# Spec: 侧边栏对话历史 + 当前会话 Question 面板

> L2 完整规格 | 启动 2026-08-25 | 路由依据：5 个新文件 + 2 个修改文件 / 约 500 行

## 背景

当前应用只有一个会话，刷新页面后对话丢失。需要：

1. **左侧边栏**：管理多个历史会话，支持新建/切换
2. **右侧悬浮面板**：展示当前会话内的所有 user question，点击可快速定位
3. **会话持久化**：localStorage 存储，刷新页面恢复

## 设计决策

|UI 库|antd（Ant Design）|用户指定，减少自建组件工作量|
|数据存储|localStorage|无需后端，MVP 够用|
|左侧边栏布局|flex 布局，sidebar + card 并排居中|与参考图一致，sidebar 贴 card 左边缘|
|右侧面板交互|右边缘小横线标记，hover 展开面板|初始态不占空间，按需展开|
|会话标题|取首条 user message 前 20 字符|简单可靠，无需 AI 调用|
|消息 ID|统一使用 `crypto.randomUUID()`|与现有 user message 一致|
|新建对话逻辑|当前会话有 user 消息则归档+新建；已是空会话则 toast 提示|避免空会话堆积|
|Question 面板数据源|从当前会话 messages 中 filter role==='user'|实时同步，无需额外存储|
|Toast 实现|antd `message` 组件|用户指定使用 antd，无需自建|

## 数据模型

```typescript
// web/src/types/conversation.ts
interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  statusMessage?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}
```

localStorage keys：

- `chatbot_conversations`: `Conversation[]`
- `chatbot_active_id`: `string`

## 组件设计

### 1. ConversationSidebar（左侧边栏）

```
web/src/components/ConversationSidebar.tsx
web/src/components/ConversationSidebar.module.less
```

**布局**：

- 顶部：「✦ 新建对话」按钮 + 设置图标按钮（预留）
- 中部：「最近对话」分组标题 + 对话列表
- 列表项：会话标题（截断省略）+ 选中高亮

**组件**：

- `Button` — 新建对话按钮
- `List` — 最近对话列表
- `Tooltip` — question 面板悬浮提示
- `message` — toast 通知

**Props**：

```typescript
interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
}
```

**antd 组件使用**：

- `Button` — 新建对话按钮（`type="default"`，带图标）
- `List` — 最近对话列表（`size="small"`，自定义 renderItem）
- 选中项样式通过 CSS Module 覆盖

### 2. QuestionHistoryPanel（右侧悬浮面板）

```
web/src/components/QuestionHistoryPanel.tsx
web/src/components/QuestionHistoryPanel.module.less
```

**布局**：

- 初始态：右边缘竖排小横线（—）标记，间距均匀
- Hover 标记 → 展开面板（从右向左滑出）
- 面板内：当前会话所有 user question 列表

**Props**：

```typescript
interface QuestionHistoryPanelProps {
  questions: { id: string; content: string }[];
  onSelectQuestion: (messageId: string) => void;
}
```

**antd 组件使用**：

- `Tooltip` — 单条 question 悬浮显示完整文字（`title` 属性）
- `Empty` — 无 question 时显示「暂无提问」

### 3. ~~Toast~~（使用 antd `message`）

无需自建，直接使用 `import { message } from 'antd'`。

- `message.info('当前已是新对话')` — 新建对话时已是空会话的提示
- 自动 3s 消失，antd 内置动画

### 4. useConversation Hook

```
web/src/hooks/useConversation.ts
```

**职责**：

- 从 localStorage 加载 conversations + activeId
- 自动保存（messages 变化时 debounce 300ms）
- 提供 `createConversation` / `switchConversation` / `updateMessages` 方法

**返回值**：

```typescript
{
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ConversationMessage[];
  createConversation: () => boolean; // true=成功新建, false=已是空会话
  switchConversation: (id: string) => void;
  updateMessages: (messages: ConversationMessage[]) => void;
}
```

### 5. App.tsx 改造

**布局变更**：

```
<div className={styles["app-layout"]}>          // flex row, 居中
  <ConversationSidebar ... />                    // 260px 固定宽
  <div className={styles.container}>             // 820px（原 container）
    <header>...</header>
    <main>
      <div className={styles["chat-history-wrapper"]}>
        <MessageList ref=... />
        <ScrollToBottomButton ... />
        <QuestionHistoryPanel ... />             // 绝对定位，右边缘
      </div>
      <InputArea ... />
    </main>
    <footer>...</footer>
  </div>
</div>
```

**新增逻辑**：

- 使用 `useConversation` hook 替代原有 messages state
- 「新建对话」按钮集成到 header 或 sidebar
- `handleSelectQuestion` → 滚动到对应消息（data-message-id + scrollIntoView）

### 6. MessageList 改造

- 每条消息 div 添加 `data-message-id={message.id}`
- 支持外部滚动到指定消息

## 样式变量新增

```css
--color-sidebar-bg: #fafafa;
--color-sidebar-hover: #f0f0f0;
--color-sidebar-active: var(--color-user-bubble);
--color-sidebar-text: var(--color-text);
--color-sidebar-text-muted: var(--color-text-muted);
--color-sidebar-border: var(--color-header-border);
```

## 响应式

|断点|行为|
|-|-|
|> 900px|sidebar + card 并排|
|≤ 900px|隐藏 sidebar，仅 card 居中（原布局），antd 组件响应式适配|
|≤ 480px|card 全宽（原逻辑），antd 组件尺寸调整|

## 验收标准

- [ ] 左侧边栏显示，包含「新建对话」按钮和「最近对话」列表
- [ ] 点击「新建对话」：当前有消息则归档+新建空会话；已是空会话则 toast 提示「当前已是新对话」
- [ ] 点击历史会话列表项，切换到对应会话，消息列表更新
- [ ] 刷新页面后，当前会话的 Q&A 完整恢复
- [ ] 右侧边缘显示小横线标记，hover 展开 question 面板
- [ ] 面板内显示当前会话所有 user question，截断省略，hover 显示完整文字
- [ ] 点击 question 列表项，聊天区域滚动到对应消息
- [ ] 当前会话无 user 消息时，右侧面板显示「暂无提问」
- [ ] 响应式：≤900px 隐藏 sidebar，恢复原布局
- [ ] `npm run build:web` 通过

## 涉及模块

- 前端：web/src/types/conversation.ts（新）
- 前端：web/src/hooks/useConversation.ts（新）
- 前端：web/src/components/ConversationSidebar.tsx + .module.less（新）
- 前端：web/src/components/QuestionHistoryPanel.tsx + .module.less（新）
- 前端：web/src/App.tsx（改造布局 + 集成）
- 前端：web/src/App.module.less（新增 sidebar + layout 样式）
- 前端：web/src/components/MessageList.tsx（添加 data-message-id）
- 前端：web/src/index.css（新增 sidebar CSS 变量 + antd 样式覆盖）
- 依赖：web/package.json 新增 `antd`

## 范围外

- 会话重命名/删除（后续迭代，antd Menu Dropdown 实现）
- 会话搜索/分组（后续迭代）
- 后端持久化（后续迭代）
- 设置按钮功能（预留 UI，暂不实现）
