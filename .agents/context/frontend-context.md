# 前端上下文

> 写前端代码时必读。每次改 `web/src/**` 前先扫一遍。

## 概览

- 技术栈：React 19 + Vite 7 + TypeScript 5.9 + Less
- 状态管理：原生 React Hooks（**无** Redux/Zustand/MobX）
- UI 库：antd（Button / List / Tooltip / Empty / message 等）
- 通信：fetch + ReadableStream 消费 SSE
- 持久化：localStorage（仅前端 store，不走后端）
- 路径别名：暂无，使用相对路径 `../types/xxx`

## 数据流

```text
用户输入 → InputArea → App.sendMessage()
  → POST /api/chat（SSE 流）
  → fetch + ReadableStream 逐 chunk 解析
  → App 累积 fullReply，setMessages 逐字更新
  → MessageList 渲染

侧边栏点击 → ConversationSidebar → App.handleSelectConversation
  → useConversation.switchConversation
  → 切换 activeId，触发 messages 重渲染
```

## 组件清单

|组件|职责|关键 props / state|备注|
|-|-|-|-|
|[App.tsx](../../web/src/App.tsx)|顶层容器，集成所有子组件，管理全局状态|messages / inputText / isLoading / isAtBottom|流式 SSE 在此消费|
|[MessageList](../../web/src/components/MessageList.tsx)|渲染消息列表|messages|必须 `memo`；每条带 `data-message-id` 用于滚动定位|
|[InputArea](../../web/src/components/InputArea.tsx)|输入框 + 发送按钮|inputText / setInputText / isLoading / sendMessage|必须 `memo`|
|[ScrollToBottomButton](../../web/src/components/ScrollToBottomButton.tsx)|滚到底部悬浮按钮|visible / onClick|必须 `memo`|
|[ConversationSidebar](../../web/src/components/ConversationSidebar.tsx)|左侧历史会话栏|conversations / activeId / onNewConversation / onSelectConversation|必须 `memo`；≤900px 隐藏|
|[QuestionHistoryPanel](../../web/src/components/QuestionHistoryPanel.tsx)|右侧当前会话 question 列表|questions / onSelectQuestion|必须 `memo`；hover 展开|
|[useConversation](../../web/src/hooks/useConversation.ts)|会话管理 hook|见返回值|localStorage 持久化 + debounce 300ms|

## 状态归属

|状态|位置|原因|
|-|-|-|
|`messages`|App（通过 `useConversation` 间接管理）|全局唯一，会话切换时整体替换|
|`conversations` / `activeId`|`useConversation`|会话管理逻辑封装在 hook 内|
|`inputText` / `isLoading` / `isAtBottom`|App|临时 UI 状态，不跨组件共享|
|组件内部 UI 状态|各组件|例：`QuestionHistoryPanel` 的 `expanded`|

**原则**：状态就近，避免 props 透传。会话级数据 → `useConversation`；临时交互 → 组件内部。

## localStorage keys

|key|类型|用途|
|-|-|-|
|`chatbot_conversations`|`Conversation[]`|所有历史会话|
|`chatbot_active_id`|`string`|当前激活会话 ID|

修改持久化结构时必须考虑向后兼容（`loadConversations` 已 try-catch 兗底）。

## 关键约束

组件 / 状态 / CSS / 列表渲染红线见 `docs/harness/frontend-rules.md`。本文件补充项目特有约定：

- **消息 ID 一律 `crypto.randomUUID()`**：与后端 / 滚动定位 / localStorage 一致
- **响应式断点**：≤900px 隐藏 sidebar；≤480px 全宽 + 紧凑样式
- **BEM element 禁连字符**：详见 [docs/reference/naming.md](../../docs/reference/naming.md)

## 已知技术债

- `web/tsconfig.tsbuildinfo` 被提交了，应在 `.gitignore` 排除（运行 `tsc -b` 自动生成）
- 暂无单元测试
- 暂无错误边界（Error Boundary），单条消息渲染失败会拖垮整个列表
- `useConversation` 的 `getConversationTitle` 在每次 `updateMessages` 调用时执行，频繁输入场景有微小性能损耗
- antd 全量引入，bundle size 较大（597 kB / gzip 195 kB），后续可按需引入

## 调试技巧

- 浏览器 DevTools → Application → Local Storage 看 `chatbot_*` key
- 流式响应调试：Network → chat 请求 → EventStream tab
- 滚动定位：选中元素加 `data-message-id` 属性后用 `scrollIntoView({block: 'center'})`
- antd 样式覆盖：CSS Module 类名优先，antd 自带类用 `:global` 包裹
