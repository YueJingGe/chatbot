# Plan: 选中文本引用与复制

> 对应 spec：`docs/specs/active/2026-10-12-feature-text-selection-quote-copy.md` | 启动 2026-10-12

## 任务分解

- [x] 任务 1：类型契约 —— `web/src/types/conversation.ts` 的 `ConversationMessage` 新增可选字段 `quote?: string`
- [x] 任务 2（TDD）：useTextSelection hook —— 先写 `web/src/hooks/useTextSelection.test.ts`（Red）：非空选区且选区起点在 `data-selectable` 容器内 → 返回 `{ text, rect, visible: true }`；起点不在容器内/空选区/选区清空 → `visible: false`；监听 `selectionchange`/`mouseup` 并在卸载时清理。再实现 `web/src/hooks/useTextSelection.ts`（Green，5 passed）
- [x] 任务 3（TDD）：SelectionToolbar 弹层组件 —— 先写 `web/src/components/SelectionToolbar/index.test.tsx`（Red）：渲染「引用」「复制」按钮；点引用回调携带选中文本；点复制调用 `copyToClipboard` 并按成败触发 `message.success('复制成功')`/`message.error('复制失败')`；复制后弹层保留 3 秒自动消失（fake timers）。再实现 `index.tsx` + `index.module.less`（Green，7 passed；fixed 定位、选区上方、顶部空间不足翻转下方、按钮 hover 灰色背景）
- [x] 任务 4（TDD）：InputArea 引用条 —— 先增补 `InputArea/index.test.tsx`（Red）：`quote` 非空时输入框上方渲染引用条（截断文本 + X 按钮）；点 X 触发 `onClearQuote`；无 `quote` 不渲染。再改 `index.tsx` + `index.module.less`（Green，7 passed，新增可选 props `quote`/`onClearQuote`）
- [x] 任务 5（TDD）：MessageList 改造 —— 先增补 `MessageList/index.test.tsx`（Red）：user 消息含 `quote` 时气泡内渲染引用行（灰字 + 左竖线）+ 问题；无 `quote` 不渲染引用行；assistant 气泡带 `data-selectable` 标记。再改 `index.tsx` + `index.module.less`（Green，10 passed）
- [x] 任务 6（TDD）：App 集成 —— 先增补 `App.test.tsx`（Red）：点引用后 `quote` 状态生效（引用条出现）；引用后发送，fetch 请求体 `messages` 末尾为 `{role:"user", content:<quote>, mimeType:"ref_text/plain"}` 引用项 + 问题项；发送成功后引用条消失；多次引用以最后一次为准。再改 `App.tsx`（Green，29 passed：quote 状态单值覆盖、挂载 useTextSelection 与 SelectionToolbar、sendMessage 拆引用项、发送消费后清空 quote、localStorage 持久化 `chatbot_quote`）
- [x] 任务 6.1（需求变更 2026-10-12，TDD）：发送失败/中断/服务端错误时保留引用 —— 先增补 `App.test.tsx` 用例（Red，2 failed：引用条已被发送前清空逻辑移除）：fetch reject 后引用条仍在；SSE error 事件后引用条仍在。再改 `App.tsx`：`updateQuote("")` 从发送前移到 SSE 全链路无错完成后（catch/Abort 分支与 data.error 均不清空）（Green，31 passed）
- [x] 任务 7：server 引用拼接 —— `server/server.js` 的 `/api/chat`：识别 `mimeType === "ref_text/plain"` 项（仅消费最后一项），拼进当轮问题内容（`[引用材料]\n…\n\n[问题]\n…`）发给模型；剔除 mimeType 字段不透传 DashScope（后端无测试框架，验证：`node --check` + eslint + 纯函数 3 场景断言通过）
- [x] 任务 8：全量验证与视觉验证 —— `npm run check:all` 全绿（TDD gate 5 test files / 192 passed / build 成功）；T4 档 DOM 探针 5 步交互序列全部通过（弹层出现/引用条/复制 toast/3 秒消失/多次引用覆盖/关闭引用），截图受后台无头视口限制未产出，已在预览浏览器中提供人工核验；手动测试清单见下

## 依赖关系

- 任务 2-5 依赖任务 1（类型先行）
- 任务 6 依赖任务 2/3/4/5（hook、弹层、引用条、气泡引用行就位后集成）
- 任务 5 的 `data-selectable` 标记与任务 2 的选区校验呼应，但两者测试互相独立（hook 测试用模拟 DOM）
- 任务 7 独立于前端，可并行
- 任务 8 依赖全部任务完成

## 验证方式

- [x] `npm run check:all` 通过（含 `check:harness`、`check:frontend-tdd`）
- [x] 若涉及前端行为改动，TDD 已按 `.agents/skills/test-driven-development/SKILL.md` 执行，并保留 Red-Green 证据；门禁 `scripts/check-frontend-tdd.mjs` 不重复定义规则，仅做机器兜底
- [ ] 手动测试（自动化已覆盖标注 ✓；其余待用户端到端核验）：
  - 选中 assistant 回答文本 → 弹层出现于选区附近 ✓（T4 探针）；选中 user 消息/空白 → 不出现 ✓（hook 单测）
  - 点复制 → toast「复制成功」✓（T4 探针 + 单测）+ 弹层 3 秒后消失 ✓（T4 探针 + fake timers 单测）；复制失败 → toast「复制失败」✓（单测）
  - 点引用 → 输入框上方引用条出现 ✓；点 X 清空 ✓；连续引用两次 → 显示最后一次 ✓（T4 探针 + App 单测）
  - 发送失败/中断/服务端错误 → 引用条保留 ✓（App 单测 2 用例：fetch reject + SSE error）
  - 引用后发送 → 请求体 messages 含 mimeType 引用项 + 问题项 ✓（App 单测 fetch 断言）；用户气泡展示「引用行 + 问题」✓（MessageList 单测）；刷新页面后气泡仍展示引用（随会话 localStorage 持久化，✓ 用户手动验收通过）
  - 无引用发送 → 请求体不含 mimeType 字段 ✓（前端条件展开 + server filter 双侧保证）；对话行为正常（回归）
  - 服务端：带引用请求回答内容与引用材料相关；无引用请求行为与现状一致 ✓（mergeRefTextMessages 3 场景断言 + 真实模型端到端用户手动验收通过）
