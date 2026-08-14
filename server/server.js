// ---------------- 1. 引入必要的库 ----------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { getWeatherTool } = require("./weather");

// ---------------- 2. 创建Express应用 ----------------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- 3. 配置中间件 ----------------
app.use(cors()); // 允许前端跨域请求
app.use(express.json()); // 解析JSON格式的请求体
app.use(express.static("public")); // 托管前端页面（public文件夹）

// ---------------- 4. 校验必需的环境变量 ----------------
const requiredEnv = ["DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL", "MODEL_NAME"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`❌ 缺少必需的环境变量: ${missingEnv.join(", ")}`);
  console.error("请复制 .env.example 为 .env 并填写正确的值");
  process.exit(1);
}

// ---------------- 5. 初始化 OpenAI 客户端（单例模式） ----------------
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
  defaultHeaders: {},
});

// ---------------- 5.5 获取实时日期时间（注入 system prompt） ----------------
const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = WEEKDAYS[now.getDay()];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`;
}

// ---------------- 5.6 Function Calling 工具定义 ----------------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "获取指定城市的实时天气和未来天气预报",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "城市名称，如：北京、上海、杭州",
          },
          forecast_days: {
            type: "integer",
            description: "预报天数，0 表示仅实时天气，最大 7 天",
            default: 0,
          },
        },
        required: ["location"],
      },
    },
  },
];

// 工具名称 → 执行函数的映射
const TOOL_HANDLERS = {
  get_weather: async (args) => {
    const { location, forecast_days } = JSON.parse(args);
    return getWeatherTool(location, forecast_days || 0);
  },
};

// ---------------- 6. 核心：处理聊天请求的API接口 ----------------
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 60000; // 默认 60s

const MAX_TOOL_ROUNDS = 5;

app.post("/api/chat", async (req, res) => {
  // 1. 设置流式响应头
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const userMessages = req.body.messages; // 完整历史

    // 1. 校验请求体
    if (!Array.isArray(userMessages)) {
      return res.status(400).json({ error: "请求格式错误：messages 必须为数组" });
    }

    // 2. 构建 system prompt 和消息列表
    const systemMessage = {
      role: "system",
      content: `你是一个专业的客服助手。请遵循以下规则：
        1. 仔细分析用户的完整对话历史，理解当前问题的上下文。
        2. 当用户使用代词（如"它"、"这个"、"那里"）或简略表达时，结合历史明确指代对象。
        3. 如果用户的问题与历史相关，请自然衔接，不要重复已提供的信息。
        4. 回答应简洁、准确、有帮助。
        5. 当前服务器实时时间为：${getCurrentDateTime()}。当用户询问日期、时间、星期几等问题时，请以此时间为准进行回答。`,
    };
    const messages = [systemMessage, ...userMessages];

    // 3. 超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    // 4. Tool calling 循环（全程流式）
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const stream = await openai.chat.completions.create({
        model: process.env.MODEL_NAME,
        messages,
        tools: TOOLS,
        stream: true,
        signal: controller.signal,
      });

      // 累积当前轮次的 tool_call 参数
      const currentToolCalls = {};
      let finishReason = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        const reason = chunk.choices?.[0]?.finish_reason;

        // 转发文本内容给前端
        if (delta?.content) {
          res.write(`data: ${JSON.stringify({ chunk: delta.content })}\n\n`);
        }

        // 累积 tool_calls 参数
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!currentToolCalls[idx]) {
              currentToolCalls[idx] = { id: "", function: { name: "", arguments: "" } };
            }
            if (tc.id) currentToolCalls[idx].id = tc.id;
            if (tc.function?.name) currentToolCalls[idx].function.name += tc.function.name;
            if (tc.function?.arguments) currentToolCalls[idx].function.arguments += tc.function.arguments;
          }
        }

        if (reason) finishReason = reason;
      }

      // 没有工具调用 → 内容已在流中转发，结束
      if (finishReason !== "tool_calls") {
        clearTimeout(timeoutId);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      // 有工具调用 → 构建 assistant message 并执行工具
      const toolCallsArray = Object.values(currentToolCalls);
      messages.push({ role: "assistant", content: null, tool_calls: toolCallsArray });

      for (const toolCall of toolCallsArray) {
        const handler = TOOL_HANDLERS[toolCall.function.name];
        if (!handler) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `不支持的工具: ${toolCall.function.name}`,
          });
          continue;
        }

        // 发送状态事件给前端
        const args = JSON.parse(toolCall.function.arguments);
        const statusMessage = toolCall.function.name === "get_weather"
          ? `🌤️ 正在查询${args.location || ""}的天气...`
          : `正在调用 ${toolCall.function.name}...`;
        res.write(`data: ${JSON.stringify({
          status: "tool_call",
          tool: toolCall.function.name,
          message: statusMessage,
        })}\n\n`);

        // 执行工具
        const result = await handler(toolCall.function.arguments);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    // 超过最大轮次
    clearTimeout(timeoutId);
    res.write(`data: ${JSON.stringify({ error: "工具调用次数超限" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("流式处理出错:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: "处理中断" })}\n\n`);
      res.end();
    }
  }
});

// ---------------- 7. 启动服务器 ----------------
app.listen(PORT, () => {
  console.log(`✅ 服务器启动成功！`);
  console.log(`📍 请打开浏览器访问：http://localhost:${PORT}`);
  console.log(`⚠️  注意：请确保已在 .env 文件中配置了正确的阿里云密钥！`);
});
