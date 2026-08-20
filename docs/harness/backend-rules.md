# 后端编码红线

> 写后端代码时必读。

## SSE 响应

|规则|说明|
|-|-|
|必须设置三个响应头|`Content-Type`、`Cache-Control`、`Connection`|
|流结束发送 `[DONE]` 后 `res.end()`|顺序不可反|
|所有出口必须 `clearTimeout`|防止内存泄漏|
|错误时检查 `res.headersSent`|已发头 → SSE 格式；未发头 → JSON 格式|

## 超时控制

|规则|说明|
|-|-|
|OpenAI 请求必须 `AbortController` 控制超时|默认 60s|

## 环境变量

|规则|说明|
|-|-|
|禁止硬编码密钥|一律从 `process.env` 读取|

## 工具调用（Function Calling）

|规则|说明|
|-|-|
|新工具必须加入 `TOOLS` 数组 + `TOOL_HANDLERS` 映射|两处同步|
|必须设置 `MAX_TOOL_ROUNDS` 防止死循环|-|
|工具执行前发送 SSE status 事件|通知前端|
