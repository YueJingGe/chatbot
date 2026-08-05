# 文件介绍

## server.js

nodejs 后端：用于转发 API 请求

# 技术介绍

## node

express 来处理请求
cors 来处理跨域

## 决定对接通义千问模型

登陆阿里云官网——百炼模型服务平台——创建并获取到 APIkey——选择调用 qwen-max 模型

## openai 是什么

openai 是一个通用规范，像阿里云、deepseek、智谱这些大模型服务商，他们都兼容这套规范

首先初始化一个 OpenAI 对象，里面包括大模型的 apiKey、baseurl、header 等

其次，在发送流式对话请求的时候他里面定义了一些字段，比如：

- model 来指定你选择的服务商
- messages 传递对话上下文
- stream 为 true 则流式输出

最后，接收到流式数据，返回给客户端

## sse (server sent event) 流式输出关键点

响应头 content-type 设置为 text/event-stream

## 实现流式数据返回给客户端

使用 for await...of 遍历 stream，以 sse 的格式发送给客户端

遍历结束之后，发送[DONE] 标识让客户毒案知道流已结束，最后调用 res.end() 关闭 TCP 连接，防止资源泄漏。

## 实现客户端读取流式数据并打字机效果输出

我这里是使用了 fetch + ReadableStream 手动处理 SSE（Server-Sent Events）流，而不是 EventSource。
主要原因是这里需要 POST 请求发送历史对话，并且需要更细粒度的流控制（手动处理错误、中断请求）。

首先读取："通过 getReader() 获取读取器，在 while 循环中增量读取数据块（chunks）。相比一次性 await response.json()，这样可以在数据到达时立即处理，实现实时渲染。"

然后解码分割："使用 TextDecoder 将二进制流转换为文本。因为一个 chunk 可能包含多行 SSE 数据，所以文本以\n 分割处理；

然后解析 sse 数据：“遵循 SSE 规范处理 data: 前缀，识别 [DONE] 标记作为流结束信号”

最后更新 react 状态："使用函数式更新保证状态一致性，通过 id 精确定位到当前正在流式输出的消息对象，避免影响历史消息

## 性能优化：当前每收到一个 chunk 就 setState，对于超快流可能触发频繁重渲染，实际生产中可以引入节流（throttle）或批量更新策略

## "如果网络中断了怎么办？" → 可以提到 reader.read() 会 throw，进入 catch 块更新错误状态，或实现断点续传（记录已接收长度）

## "如何取消请求？" → 使用 AbortController 信号传给 fetch，在组件卸载或用户点击停止时调用 controller.abort()

## 实现聊天界面自动滚动到底部

在消息列表底部放置一个空的占位 div，作为滚动锚点，通过 scrollIntoView({ behavior: "smooth" }) 实现平滑滚动到底部

触发时机：有新增消息的时候

优化操作：使用 useCallback 缓存滚动函数，避免每次渲染都生成新函数引用，减少 useEffect 的无效触发
