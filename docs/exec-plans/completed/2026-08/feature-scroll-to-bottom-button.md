# 执行计划：聊天区域"回到底部"悬浮按钮

## 目标

在聊天区域右下角实现"回到底部"悬浮按钮，未滚动到底部时显示，点击后平滑滚动回最新消息位置。

## 依赖关系

```
创建 ScrollToBottomButton.tsx
        ↓
修改 App.tsx（ref、滚动状态、回调）
        ↓
更新 App.css（按钮样式、响应式）
        ↓
npm run build 验证
```

## 任务分解

### 任务 1：新建 ScrollToBottomButton.tsx

- **文件**：`web/src/components/ScrollToBottomButton.tsx`
- **内容**：
  - 定义 `ScrollToBottomButtonProps` 接口：`onClick`、`visible`。
  - 使用 `React.memo` 包装函数组件。
  - 渲染固定定位按钮，带向下箭头 SVG。
  - 使用 BEM 类名 `scroll-to-bottom-button`。
- **验收**：组件可通过 TypeScript 编译，props 类型正确。

### 任务 2：修改 App.tsx

- **文件**：`web/src/App.tsx`
- **内容**：
  - 新增 `chatHistoryRef = useRef<HTMLDivElement>(null)` 指向 `.chat-history`。
  - 新增状态 `isAtBottom`，默认 `true`。
  - 实现 `handleScroll` 回调，通过 `scrollHeight - scrollTop - clientHeight <= 1` 判断是否在底部。
  - 将 `handleScroll` 绑定到 `.chat-history` 的 `onScroll`。
  - 修改 `scrollToBottom`：使用 `chatHistoryRef.current?.scrollTo({ top, behavior: "smooth" })`，避免与自动滚动冲突。
  - 新增 `handleScrollToBottomClick`，点击时滚动到底部。
  - 在 `chat-history` 内部渲染 `<ScrollToBottomButton visible={!isAtBottom} onClick={handleScrollToBottomClick} />`。
- **验收**：滚动状态实时更新，按钮显示/隐藏正确，点击平滑滚动。

### 任务 3：更新 App.css

- **文件**：`web/src/App.css`
- **内容**：
  - 为 `.chat-history` 添加 `position: relative`，使按钮相对于该容器定位。
  - 新增 `.scroll-to-bottom-button` 样式：右下角定位、圆形、阴影、主色背景、白色图标。
  - 新增悬停 `:hover` 与点击 `:active` 状态。
  - 新增 `hidden` 修饰符或基于 `visible` 的透明度/缩放过渡。
  - 在 `prefers-reduced-motion` 媒体查询中减弱按钮过渡。
  - 在移动端 `@media (max-width: 480px)` 中调整按钮尺寸与位置。
- **验收**：视觉风格统一，动效完整，移动端适配。

### 任务 4：构建验证

- **命令**：`npm run build`
- **验收**：构建成功，无 TypeScript/ESLint 错误。

## 风险与回退

- 风险：自动滚动逻辑与手动滚动判断冲突。
  - 缓解：通过 `isAtBottom` 状态区分用户手动滚动，点击按钮只触发一次平滑滚动。
- 风险：频繁滚动事件导致重渲染。
  - 缓解：使用原生 `onScroll` + React 状态，阈值判断避免频繁 setState；按钮自身用 `React.memo` 减少渲染。

## 验证清单

- [x] 任务 1 完成：组件文件创建。
- [x] 任务 2 完成：App.tsx 修改。
- [x] 任务 3 完成：App.css 更新。
- [x] 任务 4 完成：`npm run build` 通过。
- [x] 功能验证：消息溢出时按钮显示，滚动到底部时隐藏，点击平滑回底。
- [x] 移动端验证：按钮尺寸与位置适配。
