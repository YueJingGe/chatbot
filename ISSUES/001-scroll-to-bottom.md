# 问题记录：消息列表未自动滚动到底部

## 问题描述

当 AI 助手返回流式回复（SSE）时，聊天容器没有自动滚动到最新消息底部，导致用户无法看到正在生成的内容，需要手动滚动才能看到最新消息。

**用户反馈截图**：消息被遮挡在视口下方，用户看不到完整的 AI 回复。

---

## 原因分析

### 根本原因

`App.jsx` 中的自动滚动逻辑依赖 `messages.length` 作为触发条件：

```jsx
// 修复前（错误）
useEffect(() => {
  scrollToBottom();
}, [messages.length, scrollToBottom]); // ❌ 只监听数组长度
```

**问题所在**：
- SSE 流式返回时，AI 回复是通过 `setMessages` 不断更新**同一条消息的 `content` 字段**
- `messages` 数组的**长度没有变化**（始终是 N 条消息）
- 只有消息的**内容在变化**，但 `messages.length` 不变，导致 `useEffect` 不触发
- 结果：滚动到底部的逻辑从未执行，新内容被遮挡

### 时序示意

```
1. 用户发送消息 → messages.length: 2 → ✅ 触发滚动
2. 创建 AI 消息（空内容） → messages.length: 3 → ✅ 触发滚动
3. SSE 返回第1个 chunk → messages.length: 3 → ❌ 不触发（长度未变）
4. SSE 返回第2个 chunk → messages.length: 3 → ❌ 不触发
5. SSE 返回第3个 chunk → messages.length: 3 → ❌ 不触发
...（后续所有流式内容都无法触发滚动）
```

---

## 解决办法

将滚动触发条件从 `messages.length` 改为监听整个 `messages` 数组引用：

```jsx
// 修复后（正确）
useEffect(() => {
  scrollToBottom();
}, [messages, scrollToBottom]); // ✅ 监听整个数组引用
```

**原理**：
- 每次 `setMessages` 调用都会创建一个新的数组引用（即使长度相同）
- `messages` 引用变化 → `useEffect` 触发 → `scrollToBottom()` 执行
- 这样无论是新增消息还是更新消息内容，都能正确触发滚动

---

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `web/src/App.jsx` | 第 33 行：`[messages.length, scrollToBottom]` → `[messages, scrollToBottom]` |

---

## 验证方式

1. 启动项目：`npm run dev`
2. 发送任意消息
3. 观察 AI 回复流式生成时，聊天容器是否自动滚动到底部
4. 确认最新消息始终可见，无需手动滚动

---

## 经验总结

| 要点 | 说明 |
|------|------|
| **React.memo 配合** | `MessageList` 使用 `React.memo`，当 `messages` 引用变化时会正确重渲染 |
| **性能影响** | 监听整个 `messages` 数组引用，每次 SSE chunk 都会触发滚动，但 `scrollIntoView` 是浏览器原生优化，性能可接受 |
| **适用场景** | 所有需要自动滚动的聊天/日志场景，都应监听数据引用而非长度 |

---

**记录时间**：2026-08-04
**修复人**：AI Copilot
**问题等级**：MEDIUM（影响用户体验，但不影响功能）
