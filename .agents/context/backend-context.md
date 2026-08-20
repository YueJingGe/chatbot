# 后端上下文

> 写后端代码时必读。

## SSE 流程

```
POST /api/chat → 设置 SSE 响应头 → OpenAI SDK 流式请求 → 逐 chunk 转发 → [DONE] 结束
```

OpenAI 客户端为模块级单例。

### SSE 事件类型

|事件格式|说明|
|-|-|
|`data: { "chunk": "内容" }`|文本流式内容|
|`data: { "status": "tool_call", ... }`|工具调用状态提示|
|`data: { "error": "错误信息" }`|错误事件|
|`data: [DONE]`|流结束标志|

## 环境变量

|变量|用途|
|-|-|
|`DASHSCOPE_API_KEY`|阿里云百炼 API 密钥|
|`DASHSCOPE_BASE_URL`|API 地址|
|`MODEL_NAME`|模型名称（qwen-max）|

## 工具调用（Function Calling）

- 通过 OpenAI `tools` 参数定义工具 Schema
- LLM 决策调用 → 后端执行 → 结果回传 → 进入下一轮（最多 `MAX_TOOL_ROUNDS` 轮）
- 工具执行前发送 SSE status 事件通知前端
