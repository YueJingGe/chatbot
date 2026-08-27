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

规则见 `docs/harness/backend-rules.md` 的工具调用章节。
