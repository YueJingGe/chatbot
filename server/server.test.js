const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

// 隔离 SDK、网络监听和环境加载；执行真实路由，不读取本地密钥。
function loadChatHandler(createStream) {
  let handler;
  const timers = new Map();
  const requests = [];
  const app = {
    use() {},
    post(_path, callback) {
      handler = callback;
    },
    listen() {},
  };
  const express = () => app;
  express.json = () => () => {};
  express.static = () => () => {};
  class MockOpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: async (body, options) => {
            requests.push({ body, options });
            return createStream(body, options);
          },
        },
      };
    }
  }
  const dependencies = {
    dotenv: { config() {} },
    express,
    cors: () => () => {},
    openai: MockOpenAI,
    "./weather": {},
    "./datetime": {},
  };
  vm.runInNewContext(readFileSync(path.join(__dirname, "server.js"), "utf8"), {
    require: (name) => dependencies[name],
    process: {
      env: {
        DASHSCOPE_API_KEY: "mock-key",
        DASHSCOPE_BASE_URL: "https://mock.invalid",
        MODEL_NAME: "mock-model",
      },
    },
    console: { log() {}, error() {} },
    AbortController,
    setTimeout(callback) {
      const timer = {};
      timers.set(timer, callback);
      return timer;
    },
    clearTimeout(timer) {
      timers.delete(timer);
    },
  });

  const frames = [];
  const res = {
    headersSent: false,
    ended: false,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      this.ended = true;
    },
    write(frame) {
      this.headersSent = true;
      frames.push(frame);
    },
    end() {
      this.ended = true;
    },
  };
  const run = (messages = [{ role: "user", content: "测试" }]) =>
    handler({ body: { messages } }, res);
  return { run, timers, requests, res, frames };
}

async function* successfulStream() {
  yield { choices: [{ delta: { content: "完成" }, finish_reason: "stop" }] };
}

test("SDK 通过请求选项接收可中断信号", async () => {
  const chat = loadChatHandler(successfulStream);
  await chat.run();

  assert.ok(chat.requests[0].options?.signal instanceof AbortSignal);
  assert.equal(chat.requests[0].body.signal, undefined);
});

test("超时触发后中断 SDK 请求并完成错误响应", async () => {
  const chat = loadChatHandler(
    (_body, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("请求超时")), { once: true });
      })
  );
  const running = chat.run();
  const onTimeout = [...chat.timers.values()][0];
  onTimeout();
  await running;

  assert.equal(chat.requests[0].options.signal.aborted, true);
  assert.equal(chat.res.statusCode, 500);
  assert.equal(chat.res.ended, true);
  assert.equal(chat.timers.size, 0);
});

test("上游请求失败后清除超时定时器", async () => {
  const chat = loadChatHandler(async () => {
    throw new Error("上游请求失败");
  });
  await chat.run();

  assert.equal(chat.res.statusCode, 500);
  assert.equal(chat.timers.size, 0);
});

test("流读取失败后返回 SSE 错误并清除超时定时器", async () => {
  const chat = loadChatHandler(async function* () {
    yield { choices: [{ delta: { content: "部分回复" } }] };
    throw new Error("流读取失败");
  });
  await chat.run();

  assert.match(chat.frames.at(-1), /处理中断/);
  assert.equal(chat.res.ended, true);
  assert.equal(chat.timers.size, 0);
});

test("正常结束发送 DONE 并清除超时定时器", async () => {
  const chat = loadChatHandler(successfulStream);
  await chat.run();

  assert.equal(chat.frames.at(-1), "data: [DONE]\n\n");
  assert.equal(chat.res.ended, true);
  assert.equal(chat.timers.size, 0);
});

test("工具轮次超限后发送错误与 DONE 并清除定时器", async () => {
  const chat = loadChatHandler(async function* () {
    yield {
      choices: [
        {
          delta: {
            tool_calls: [
              { index: 0, id: "tool-id", function: { name: "unknown_tool", arguments: "{}" } },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    };
  });
  await chat.run();

  assert.equal(chat.requests.length, 5);
  assert.match(chat.frames.at(-2), /工具调用次数超限/);
  assert.equal(chat.frames.at(-1), "data: [DONE]\n\n");
  assert.equal(chat.res.ended, true);
  assert.equal(chat.timers.size, 0);
});

test("参数校验失败不创建超时定时器或调用模型", async () => {
  const chat = loadChatHandler(successfulStream);
  await chat.run(null);

  assert.equal(chat.res.statusCode, 400);
  assert.equal(chat.requests.length, 0);
  assert.equal(chat.timers.size, 0);
});
