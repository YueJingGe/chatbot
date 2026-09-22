# 消息复制功能（L1 简化）

> 启动 2026-09-20 | 路由依据：影响 4–6 个文件 / 约 150 行代码（含新增测试基础设施）

## 设计决策

|问题|决策|原因|
|-|-|-|
|question 与 answer 复制入口是否一致|question 用轻量复制 icon；answer 用下拉菜单|参考图里 question 仅展示复制 icon，answer 才出现下拉箭头；同时满足用户"每个 question/answer 都能复制"的需求|
|轻量版点击行为|点击复制 icon 直接复制 question 的 `content` 纯文本|最简交互，与参考图中 question 的复制 icon 一致|
|answer 下拉菜单项|「复制」渲染后纯文本 / 「复制为 Markdown」原始 Markdown 源码|用户确认：「复制」= 去掉 Markdown 标记的可读文字；「复制为 Markdown」= 保留原始 `content` 字符串|
|复制实现|使用 `navigator.clipboard.writeText()`|现代浏览器标准 API，无需引入额外依赖|
|复制反馈|复制成功/失败时显示 antd toast|用户确认需要操作反馈；成功显示「复制成功」，失败显示「复制失败」。|
|icon 来源|使用 SVG icon 内联，不引入图标库|项目未使用图标库，保持与现有代码一致|
|测试策略|引入 Vitest + Testing Library，测试先行|用测试作为 Agent 的验收标准|

## 测试基础设施

- 测试框架：Vitest（与 Vite 同生态）。
- 组件测试：@testing-library/react + @testing-library/jest-dom + @testing-library/user-event。
- DOM 环境：jsdom。
- 测试文件：与源码同目录下的 `*.test.{ts,tsx}`。
- 新增文件：
  - `web/vitest.config.ts`：配置 globals、environment: jsdom、setupFiles。
  - `web/src/test-utils/vitest.setup.ts`：引入 `@testing-library/jest-dom` matchers。
  - `web/package.json`：新增 `test` / `test:watch` scripts。

## 测试用例（作为验收标准）

### 工具函数 `copyToClipboard`

- [x] 调用成功后返回 resolved promise，并写入传入文本到 `navigator.clipboard`。
- [x] `navigator.clipboard` 不可用时抛出可读错误。

### 工具函数 `stripMarkdown`

- [x] 移除代码块标记，保留内部文本。
- [x] 移除行内标记（`**bold**`、`*italic*` 等），保留文本。
- [x] 处理空字符串返回空字符串。

### 组件 `MessageList`

- [x] 渲染 user 消息时，hover 气泡后可见复制按钮；点击后调用 `copyToClipboard(message.content)`。
- [x] 渲染 assistant 消息时，hover 气泡后可见复制按钮与下拉箭头；hover 复制操作区域时显示菜单。
- [x] assistant 菜单中点击「复制」时，调用 `copyToClipboard(stripMarkdown(message.content))` 并显示成功/失败 toast。
- [x] assistant 菜单中点击「复制为 Markdown」时，调用 `copyToClipboard(message.content)` 并显示成功/失败 toast。
- [x] 指针离开复制操作区域后，菜单不再显示。

## 验收

- [x] 上述所有测试用例先写后实现，且最终全部通过（`npm run test --workspace=web`）。
- [x] `npm run check:all` 通过。

## 涉及

- `web/package.json`：新增 Vitest 相关 devDependencies 与 scripts。
- `web/vitest.config.ts`：新增测试配置。
- `web/src/test-utils/vitest.setup.ts`：新增测试环境初始化。
- `web/src/components/MessageList/index.tsx`：为每条消息增加复制入口与交互逻辑。
- `web/src/components/MessageList/index.module.less`：复制 icon、下拉菜单的样式与定位。
- `web/src/components/MessageList/index.test.tsx`：组件测试。
- `web/src/utils/copy.ts`（新建）：`copyToClipboard` 通用函数。
- `web/src/utils/markdown.ts`（新建）：`stripMarkdown` 工具函数及其测试。
