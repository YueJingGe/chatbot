# 执行计划：聊天区域"回到底部"悬浮按钮居中

## 目标

将"回到底部"悬浮按钮从聊天区域右下角移动到正中央底部，保持现有功能、动效与无障碍属性不变，并确保不遮挡聊天消息。

## 依赖关系

```
修改 App.tsx（用 .chat-history-wrapper 包裹聊天记录与按钮）
        ↓
修改 App.css（wrapper 定位、按钮居中 transform）
        ↓
npm run build 验证
```

## 任务分解

### 任务 1：新增 `.chat-history-wrapper`

- **文件**：`web/src/App.tsx`
- **内容**：
  - 用 `<div className="chat-history-wrapper">` 包裹 `.chat-history` 和 `ScrollToBottomButton`。
  - 将按钮从 `.chat-history` 内部移到 wrapper 内部、与 `.chat-history` 同级。
- **验收**：DOM 结构正确，按钮不在可滚动的 `.chat-history` 内部。

### 任务 2：为 wrapper 提供定位上下文

- **文件**：`web/src/App.css`
- **内容**：
  - 新增 `.chat-history-wrapper`：
    - `position: relative`（为按钮建立不随内容滚动的定位上下文）
    - `flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column`
  - 移除 `.chat-history` 的 `position: relative`（由 wrapper 接管）。
- **验收**：wrapper 填满 `main` 的剩余空间，`.chat-history` 仍可在其中滚动。

### 任务 3：调整按钮水平居中

- **文件**：`web/src/App.css`
- **内容**：
  - 将 `.scroll-to-bottom-button` 的 `right: var(--space-md)` 替换为 `left: 50%`。
  - 将 `transform: scale(1)` 改为 `transform: translateX(-50%) scale(1)`，实现精确水平居中。
- **验收**：按钮在桌面端水平居中于聊天区域底部。

### 任务 4：同步更新所有 transform 状态

- **文件**：`web/src/App.css`
- **内容**：
  - `.scroll-to-bottom-button:hover`：`scale(1.08)` 改为 `translateX(-50%) scale(1.08)`。
  - `.scroll-to-bottom-button:active`：`scale(0.95)` 改为 `translateX(-50%) scale(0.95)`。
  - `.scroll-to-bottom-button--hidden`：`scale(0.8)` 改为 `translateX(-50%) scale(0.8)`。
  - `prefers-reduced-motion` 中的 `:hover`、`:active` 改为 `transform: translateX(-50%)`，保持居中并移除缩放。
- **验收**：悬停、点击、显示/隐藏动效正常，按钮始终居中。

### 任务 5：移动端适配

- **文件**：`web/src/App.css`
- **内容**：
  - 在 `@media (max-width: 480px)` 中，移除 `.scroll-to-bottom-button` 的 `right: var(--space-sm)`。
  - 保留现有按钮尺寸调整（width/height 40px），居中将自动继承桌面端样式。
- **验收**：移动端视口下按钮仍水平居中，尺寸正确。

### 任务 6：构建验证

- **命令**：`npm run build`
- **验收**：构建成功，无 TypeScript/ESLint 错误。

## 验证清单

- [x] 任务 1 完成：`.chat-history-wrapper` 已新增，按钮移出 `.chat-history`。
- [x] 任务 2 完成：wrapper 提供不随内容滚动的定位上下文。
- [x] 任务 3 完成：按钮水平居中。
- [x] 任务 4 完成：所有 transform 状态同步更新。
- [x] 任务 5 完成：移动端适配正确。
- [x] 任务 6 完成：`npm run build` 通过。
- [x] 功能验证：向上滚动时按钮居中显示且不随消息滚动，点击平滑回底并隐藏。
- [x] 移动端验证：<=480px 视口下按钮居中且尺寸适配。
