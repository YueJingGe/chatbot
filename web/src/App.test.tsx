import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import * as browser from "./utils/browser";
import type { PlatformHostHint } from "./utils/browser";

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

beforeAll(() => {
  // jsdom 不实现元素滚动，页脚测试不依赖滚动动画。
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  if (originalScrollTo) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  }
});

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const footerCases: { host: PlatformHostHint; expected: string }[] = [
  {
    host: { os: "harmony", pageType: "pc", runtime: "native" },
    expected: "harmony · pc · native · 未知",
  },
  {
    host: { os: "harmony", pageType: "pc", runtime: "web" },
    expected: "harmony · pc · web · 未知",
  },
  {
    host: { os: "harmony", pageType: "h5", runtime: "web" },
    expected: "harmony · h5 · web · 未知",
  },
  {
    host: { os: "harmony", pageType: "h5", runtime: "native" },
    expected: "harmony · h5 · native · 未知",
  },
  { host: { os: "windows", pageType: "pc" }, expected: "windows · pc · 未知 · 未知" },
  { host: { os: "macos", pageType: "pc" }, expected: "macos · pc · 未知 · 未知" },
  { host: { os: "linux", pageType: "pc", runtime: "web" }, expected: "linux · pc · web · 未知" },
  { host: { os: "android", pageType: "h5" }, expected: "android · h5 · 未知 · 未知" },
  {
    host: { os: "android", pageType: "h5", runtime: "native" },
    expected: "android · h5 · native · 未知",
  },
  { host: { os: "ios", pageType: "h5", runtime: "web" }, expected: "ios · h5 · web · 未知" },
  { host: { os: "ios", pageType: "h5", runtime: "native" }, expected: "ios · h5 · native · 未知" },
  { host: { os: "harmony" }, expected: "harmony · 未知 · 未知 · 未知" },
  { host: { os: "android", runtime: "native" }, expected: "android · 未知 · native · 未知" },
  { host: { pageType: "pc", runtime: "native" }, expected: "未知 · pc · native · 未知" },
  { host: { pageType: "pc", runtime: "web" }, expected: "未知 · pc · web · 未知" },
  { host: { pageType: "h5" }, expected: "未知 · h5 · 未知 · 未知" },
  { host: { runtime: "native" }, expected: "未知 · 未知 · native · 未知" },
  { host: { runtime: "web" }, expected: "未知 · 未知 · web · 未知" },
  { host: {}, expected: "未知 · 未知 · 未知 · 未知" },
];

describe("App 平台标题", () => {
  it.each([
    ["PC", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"],
    ["H5", "Mozilla/5.0 (Linux; Android 14) Mobile"],
    ["未知平台", "unrecognized-agent"],
  ])("%s 下标题固定为 ai 对话", (_name, userAgent) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);

    render(<App />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("ai 对话");
    expect(heading).toBeVisible();
  });
});

describe("App 在线状态文案", () => {
  it.each([
    ["PC", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "pc在线"],
    ["H5", "Mozilla/5.0 (Linux; Android 14) Mobile", "mobile在线"],
    ["未知平台", "unrecognized-agent", "在线"],
  ])("%s 显示对应在线文案", (_name, userAgent, expected) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);

    const { container } = render(<App />);

    const subtitle = container.querySelector("header p");
    expect(subtitle?.textContent).toBe(expected);
    expect(subtitle).toBeVisible();
  });
});

describe("App 平台页脚", () => {
  it.each(footerCases)("消费公共结果并显示 $expected", ({ host, expected }) => {
    const getPlatformInfo = vi
      .spyOn(browser, "getPlatformInfo")
      .mockReturnValue(browser.detectPlatform({ userAgent: "", host }));

    const { container } = render(<App />);
    const footers = container.querySelectorAll("footer");

    expect(footers).toHaveLength(2);
    // 外层 footer 是 App 的 Powered by 标语，内层是 PlatformFooter 自身的 footer。
    expect(footers[0]).toHaveTextContent("Powered by 阿里云百炼");
    expect(footers[1]?.textContent).toBe(expected);
    expect(footers[1]).toBeVisible();
    expect(getPlatformInfo).toHaveBeenCalledWith();
  });

  it("真实入口读取当前 UA，重新渲染后更新展示", () => {
    const userAgent = vi
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0");
    const { rerender } = render(<App />);
    expect(screen.getByText("windows · pc · 未知 · 未知")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ai 对话");

    userAgent.mockReturnValue("Mozilla/5.0 (Linux; Android 14) Mobile");
    rerender(<App />);
    expect(screen.getByText("android · h5 · 未知 · 未知")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ai 对话");
    expect(screen.queryByText("windows · pc · 未知 · 未知")).not.toBeInTheDocument();
  });
});

/** 在 body 上挂载一个可选区容器，模拟 AI 回答气泡区域 */
function mountSelectableHost(text: string): Node {
  const host = document.createElement("div");
  host.setAttribute("data-selectable", "assistant");
  const span = document.createElement("span");
  span.appendChild(document.createTextNode(text));
  host.appendChild(span);
  document.body.appendChild(host);
  return span.firstChild as Node;
}

function mockSelection(text: string, anchorNode: Node | null) {
  vi.spyOn(window, "getSelection").mockReturnValue({
    isCollapsed: false,
    rangeCount: 1,
    anchorNode,
    toString: () => text,
    getRangeAt: () => ({
      getBoundingClientRect: () => ({
        x: 10,
        y: 20,
        width: 100,
        height: 20,
        top: 20,
        right: 110,
        bottom: 40,
        left: 10,
      }),
    }),
  } as unknown as Selection);
}

function createSSEResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

describe("App 选区引用与复制", () => {
  it("选中回答文本后点击引用，输入框上方显示引用条", () => {
    render(<App />);
    const anchor = mountSelectableHost("第一段回答");
    mockSelection("第一段回答", anchor);

    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    // 通过关闭按钮定位引用条，避免与选区模拟容器同文本冲突
    const quoteBar = screen.getByRole("button", { name: "关闭引用" }).parentElement;
    expect(quoteBar).toHaveTextContent("第一段回答");
  });

  it("多次引用时以最后一次为准", () => {
    render(<App />);

    const anchor1 = mountSelectableHost("第一段回答");
    mockSelection("第一段回答", anchor1);
    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    const anchor2 = mountSelectableHost("第二段回答");
    mockSelection("第二段回答", anchor2);
    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    const quoteBar = screen.getByRole("button", { name: "关闭引用" }).parentElement;
    expect(quoteBar).toHaveTextContent("第二段回答");
    expect(quoteBar).not.toHaveTextContent("第一段回答");
  });

  it("发送时引用作为独立消息项随请求发送并在发送后清空", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createSSEResponse(["好的"]));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const anchor = mountSelectableHost("被引用的原文");
    mockSelection("被引用的原文", anchor);
    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    fireEvent.change(screen.getByRole("textbox", { name: "聊天输入框" }), {
      target: { value: "帮我解释" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(String(init.body));
    // 引用以独立项随请求发送（初始会话的欢迎消息会作为历史透传，此处只断言引用项与问题项）
    const messages = requestBody.messages as {
      role: string;
      content: string;
      mimeType?: string;
    }[];
    const refItems = messages.filter((msg) => msg.mimeType === "ref_text/plain");
    expect(refItems).toEqual([
      { role: "user", content: "被引用的原文", mimeType: "ref_text/plain" },
    ]);
    expect(messages[messages.length - 1]).toEqual({ role: "user", content: "帮我解释" });

    // 发送后引用条消失（气泡内引用行仍展示同文本，用关闭按钮区分）
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "关闭引用" })).not.toBeInTheDocument()
    );
  });

  it("发送失败时保留引用便于重试", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("网络错误"));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const anchor = mountSelectableHost("被引用的原文");
    mockSelection("被引用的原文", anchor);
    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    fireEvent.change(screen.getByRole("textbox", { name: "聊天输入框" }), {
      target: { value: "帮我解释" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }));

    await waitFor(() => expect(screen.getByText(/抱歉，出错了/)).toBeInTheDocument());
    // 发送失败引用条保留（气泡错误消息与选区容器均含同文本，用关闭按钮区分）
    const quoteBar = screen.getByRole("button", { name: "关闭引用" }).parentElement;
    expect(quoteBar).toHaveTextContent("被引用的原文");
  });

  it("服务端返回错误事件时保留引用", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "模型调用失败" })}\n\n`)
        );
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const anchor = mountSelectableHost("被引用的原文");
    mockSelection("被引用的原文", anchor);
    fireEvent.mouseUp(document);
    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    fireEvent.change(screen.getByRole("textbox", { name: "聊天输入框" }), {
      target: { value: "帮我解释" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }));

    await waitFor(() => expect(screen.getByText(/服务端出错/)).toBeInTheDocument());
    const quoteBar = screen.getByRole("button", { name: "关闭引用" }).parentElement;
    expect(quoteBar).toHaveTextContent("被引用的原文");
  });
});
