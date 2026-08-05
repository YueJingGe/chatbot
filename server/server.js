// ---------------- 1. 引入必要的库 ----------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

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

// ---------------- 6. 核心：处理聊天请求的API接口 ----------------
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 60000; // 默认 60s

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

    // 2. 发起流式请求（带超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const stream = await openai.chat.completions.create({
      model: process.env.MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `你是一个专业的客服助手。请遵循以下规则：
            1. 仔细分析用户的完整对话历史，理解当前问题的上下文。
            2. 当用户使用代词（如"它"、"这个"、"那里"）或简略表达时，结合历史明确指代对象。
            3. 如果用户的问题与历史相关，请自然衔接，不要重复已提供的信息。
            4. 回答应简洁、准确、有帮助。`,
        },
        ...userMessages,
      ],
      stream: true,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3. 流式返回数据给前端
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }
    // 流结束标志
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
