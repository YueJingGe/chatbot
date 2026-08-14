---
level: guideline
owner: "@YueJingGe"
last_reviewed: 2026-08-14
review_cycle: per-pr
auto_enforced: false
---

# 核心数据流转链路

## SSE 流式对话完整链路

```
用户输入 → 前端 App.tsx → POST /api/chat → Express 后端 → DashScope API → SSE 流 → 前端渲染
```

### 详细步骤

| 步骤        | 位置              | 说明                                                                     |
| ----------- | ----------------- | ------------------------------------------------------------------------ |
| 1. 用户输入 | `InputArea.tsx`   | 用户输入消息，按 Enter 或点击发送                                        |
| 2. 状态更新 | `App.tsx`         | 将用户消息加入 messages 状态                                             |
| 3. 发起请求 | `App.tsx`         | `fetch('/api/chat', { method: 'POST', body: JSON.stringify(messages) })` |
| 4. 接收流   | `App.tsx`         | `ReadableStream` 消费 SSE 流，逐字更新 assistant 消息                    |
| 5. 渲染消息 | `MessageList.tsx` | React.memo 优化，逐字显示流式内容                                        |

### 后端 SSE 处理流程（含 Function Calling）

| 步骤               | 位置          | 说明                                                        |
| ------------------ | ------------- | ----------------------------------------------------------- |
| 1. 设置响应头      | `server.js`   | `Content-Type: text/event-stream`                           |
| 2. 流式 LLM 请求 | `server.js`   | OpenAI SDK 流式请求，带 `tools` 参数（含 AbortController）  |
| 3. 流式转发/累积   | `server.js`   | 文本 chunk 直接转发；tool_calls 参数累积                    |
| 4. 工具执行        | `weather.js`  | 若 `finish_reason: "tool_calls"`，执行工具，发 SSE status 事件 |
| 5. 循环或结束      | `server.js`   | 有工具调用 → 回传结果，进入下一轮；无工具调用 → 发送 `[DONE]` |

### SSE 事件类型

| 事件格式 | 说明 |
|----------|------|
| `data: { "chunk": "内容" }` | 文本流式内容（逐字转发） |
| `data: { "status": "tool_call", "tool": "get_weather", "message": "🌤️ 正在查询..." }` | 工具调用状态提示 |
| `data: { "error": "错误信息" }` | 错误事件 |
| `data: [DONE]` | 流结束标志 |

### 关键节点注意事项

1. **OpenAI 客户端为模块级单例**，复用连接，不在请求内创建
2. **SSE 超时控制**：使用 `AbortController` + `setTimeout`，超时默认 60s
3. **headersSent 检查**：错误处理时检查 `res.headersSent`，已发送则写 SSE 错误
4. **前端使用 ref 保持最新状态**，避免闭包陷阱
5. **列表 key 使用稳定唯一值**，禁止数组索引
