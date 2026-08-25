# Plan: 侧边栏对话历史 + 当前会话 Question 面板

> 对应 spec：`docs/specs/active/feature-sidebar-conversation-history.md` | 启动 2026-08-25

## 任务分解

- [ ] 任务 1：安装 antd 依赖（`npm install antd --workspace=web`）
- [ ] 任务 2：创建类型定义 `web/src/types/conversation.ts`
- [ ] 任务 3：创建 `useConversation` hook（localStorage 读写 + 会话管理逻辑）
- [ ] 任务 4：创建 `ConversationSidebar` 组件 + 样式
- [ ] 任务 5：创建 `QuestionHistoryPanel` 组件 + 样式
- [ ] 任务 6：改造 `App.tsx`（布局重构 + 集成 sidebar/panel/hook）
- [ ] 任务 7：更新 `App.module.less`（新增 layout + sidebar 样式）
- [ ] 任务 8：更新 `index.css`（新增 sidebar CSS 变量）
- [ ] 任务 9：改造 `MessageList.tsx`（添加 `data-message-id`）
- [ ] 任务 10：`npm run build:web` 验证构建通过

## 依赖关系

- 任务 1（安装依赖）→ 所有后续任务
- 任务 2（类型定义）→ 任务 3、4、5、6
- 任务 3（hook）→ 任务 6
- 任务 4、5（组件）→ 任务 6
- 任务 6（App 改造）→ 任务 7、8、9（样式/细节调整）
- 任务 10 依赖所有任务完成

## 验证方式

- [ ] `npm run build:web` 通过
- [ ] 左侧边栏显示，包含「新建对话」按钮和「最近对话」列表
- [ ] 点击「新建对话」：有消息则归档+新建；空会话则 toast 提示
- [ ] 点击历史会话切换，消息列表正确更新
- [ ] 刷新页面后当前会话 Q&A 完整恢复
- [ ] 右侧边缘小横线标记，hover 展开 question 面板
- [ ] 面板内显示当前会话 user questions，截断省略，hover 显示全文
- [ ] 点击 question 滚动到对应消息
- [ ] ≤900px 隐藏 sidebar，恢复原布局
