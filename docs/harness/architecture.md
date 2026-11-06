# 架构约束

> 引入新依赖、改 workspace 边界、改前后端通信契约时必读。

## Monorepo 边界

|规则|说明|
|-|-|
|前端禁止引入后端依赖|`web/` 中禁止 `express`/`cors`/`openai`|
|后端禁止引入前端依赖|`server/` 中禁止 `react`/`vite`|
|禁止跨 workspace 直接 import|前后端通过 HTTP API 通信|

## API / SSE 契约

**本节是前后端通信的唯一事实源**：改契约先改本节，再改代码；表中未登记的字段视为不存在。

生产端 `server/server.js`，消费端 `web/src/App.tsx`。

### 请求：`POST /api/chat`

|项|约定|
|-|-|
|请求体|`{ messages: Array<{ role, content, mimeType? }> }`|
|`role`|`"user"` \| `"assistant"`|
|`mimeType`|仅引用文本项携带，值为 `REF_TEXT_MIME_TYPE`（`"ref_text/plain"`），常量定义在 `web/src/types/conversation.ts`|
|参数校验失败|`400` + JSON `{ error: string }`（`messages` 非数组；此时尚未设置 SSE 响应头，Content-Type 为 JSON）|
|请求体非法 JSON|`400` + JSON `{ error: string }`（`express.json()` 解析失败，由统一错误中间件转换）|

### 响应：SSE 流

所有帧统一 `data: ` 前缀 + `\n\n` 结尾，不使用 `event:` 字段。

|帧|payload|产生时机|前端处理|
|-|-|-|-|
|文本增量|`{ "chunk": string }`|转发 LLM 的 `delta.content`|累加进消息 `content`，同时清空 `statusMessage`|
|工具状态|`{ "status": "tool_call", "tool": string, "message": string }`|每次工具执行前|按 `status` 判定，取 `message` 写入 `statusMessage`；`tool` 字段前端当前未消费|
|错误|`{ "error": string }`|工具轮次超限；或已发响应头后的异常|渲染「抱歉，服务端出错：\<error>」并跳出当前 chunk 的帧循环|
|结束|`data: [DONE]`|正常结束、超限错误之后|跳出当前 chunk 的帧循环；服务端随即 `res.end()`，流读取自然结束|

|异常出口|响应形态|
|-|-|
|未发送响应头的异常|`500` + JSON `{ error: string }`|
|已发送响应头的异常|SSE `{ "error": "处理中断" }` 后直接 `res.end()`，不再发 `[DONE]`|
|客户端主动中断|前端 `AbortController` 触发，`AbortError` 静默返回，不渲染错误气泡|

### 契约变更规则

|规则|说明|
|-|-|
|先改表再改代码|代码与本节不一致时，以本节为准并立即修正代码|
|前后端同批提交|`server/` 与 `web/src/`（`App.tsx` 解析逻辑 + `types/conversation.ts`）必须在同一个 commit 内改完|
|新增字段必须可选|旧前端遇到新帧不得崩溃，新前端遇到缺字段不得崩溃|
|改语义必须改名|字段含义变化时换新字段名，禁止原地改语义|
|必须记 ledger|在 `docs/ledger/CORE-LEDGER.md` 追加条目（`server/`、`web/src/types/` 命中 push-gate 核心路径）|

## 新增依赖门禁

|规则|说明|
|-|-|
|安装前先问用户|说明用途，以及为什么现有依赖或 Node 内置模块做不到|
|先查已有替代|`server/` 现有：`express`/`cors`/`dotenv`/`openai`/`solarlunar`；`web/` 见 `web/package.json`|
|明确安装位置|root / `web` / `server` 三选一，禁止跨 workspace 混装（见 Monorepo 边界）|
|`web` 依赖须说明体积影响|前端依赖直接进 bundle，影响首屏加载|
|不手改 lock|`package-lock.json` 由 `npm install` 生成|
