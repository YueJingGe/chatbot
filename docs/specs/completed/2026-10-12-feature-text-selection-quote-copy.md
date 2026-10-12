# Spec: 选中文本引用与复制

> L2 完整规格 | 启动 2026-10-12 | 路由依据：影响约 10 个文件（新增 5、修改 5）/ 预估 400+ 行

## 背景

用户选中 AI 回答中的一段文本时，在选区附近弹出操作弹层，支持「引用」（引用到对话）与「复制」（复制到剪贴板 + toast 提示）。当前项目仅支持整条消息级复制（CopyActions），无选区级操作，无引用能力。多次选中点击引用或复制时，以最后一次为准。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|引用发送契约|messages 数组独立项 `{role:"user", content:<quote>, mimeType:"ref_text/plain"}`|引用与问题作为独立消息项，语义边界清晰；契约随需求演进，本次新增 mimeType 可选字段|
|弹层实现|自研 `useTextSelection` hook + `SelectionToolbar` 组件，fixed 定位，无新依赖|antd Popover 做选区动态定位需 hack；第三方库违背依赖精简原则|
|触发范围|仅 assistant 气泡（`data-selectable` 标记），选区起点落在标记容器内才触发|需求明说"回答中的文本"|
|引用持久化|`ConversationMessage` 新增可选 `quote?: string`，随消息存入 localStorage|发送后用户气泡内展示引用（灰字+左竖线），刷新不丢|
|多次操作语义|quote 状态为单值，新引用覆盖旧值；引用条与气泡展示均只呈现最后一次|需求明确"以最后一次为准"|
|复制格式|选区纯文本（`Selection.toString()`），不做 markdown 还原|渲染后文本所见即所得|
|toast|antd `message.success('复制成功')` / `message.error('复制失败')`|项目统一用户反馈约定|
|引用所在原文段落|不做|YAGNI，仅引用选中文本本身|

## 交互规格

- 触发：mouseup 完成选区且选中文本 trim 非空、起点在 assistant 气泡内 → 弹层出现在选区下方（下方空间不足时翻转到上方）
- 关闭：点击弹层外部、聊天区滚动、选区清空
- 引用：设置 quote → 弹层消失 → 输入框上方出现引用条（灰底圆角、文本截断、右侧 X 关闭按钮）；点 X 清空引用
- 复制：`copyToClipboard(选中文本)` → `message.success('复制成功')`；失败 `message.error('复制失败')`；弹层保留 3 秒后自动消失
- 发送：携带 quote 时，用户消息存储与气泡展示均为「引用行 + 问题」；发送成功后清空 quote 状态；发送失败（网络错误、请求中断、服务端错误事件）时保留引用便于直接重试

## API 契约变化（POST /api/chat）

请求体 `messages` 项新增可选字段 `mimeType?: "ref_text/plain"`：

- 无引用：请求结构不附加 mimeType 字段，服务端不执行引用拼接
- 有引用：`messages` 末尾依次为引用项 `{role:"user", content:<quote>, mimeType:"ref_text/plain"}` 与问题项（不带 mimeType）
- server：识别 `mimeType === "ref_text/plain"` 的项（仅消费最后一项），将其拼进当轮问题内容发给模型（`[引用材料]\n…\n\n[问题]\n…`）；发给 DashScope 的消息不透传 mimeType 字段；历史消息中的 mimeType 项原样剔除不重复拼接

## 验收标准

- [x] 选中 assistant 回答文本出现弹层（「引用」「复制」按钮，hover 灰色背景）；选中 user 消息或空白选区不出现
- [x] 点复制：剪贴板为选中文本，toast「复制成功」；复制失败 toast「复制失败」；弹层保留 3 秒后自动消失
- [x] 点引用：输入框上方出现引用条，点 X 可关闭；多次引用以最后一次为准
- [x] 引用后发送：请求体 messages 含 `ref_text/plain` 引用项 + 问题项；用户气泡展示引用+问题；刷新页面后气泡仍展示引用；发送失败或中断时引用条保留
- [x] server 正确拼接引用材料；无引用请求的服务端行为与现状完全一致
- [x] TDD：若新增/修改/修复前端组件、hook、工具函数、状态或交互行为，已按 `.agents/skills/test-driven-development/SKILL.md` 执行 Red-Green-Refactor，并保留同目录 `*.test.ts(x)`；修 bug 时保留失败测试输出作为 Red 证据。

## 涉及模块

- 前端：
  - `web/src/hooks/useTextSelection.ts` + 同目录测试（新增）：选区监听与校验
  - `web/src/components/SelectionToolbar/`（新增：index.tsx / index.module.less / index.test.tsx）：引用复制弹层
  - `web/src/App.tsx`（修改）：quote 状态、sendMessage 请求体、挂载弹层
  - `web/src/components/InputArea/`（修改：tsx / less / test 增补）：输入框上方引用条
  - `web/src/components/MessageList/`（修改：tsx / less / test 增补）：assistant 气泡 data-selectable 标记、user 气泡引用行渲染
  - `web/src/types/conversation.ts`（修改）：ConversationMessage 增加可选 quote 字段
  - `web/src/App.test.tsx`（修改）：请求体契约断言增补
- 后端：
  - `server/server.js`（修改）：/api/chat 引用项识别与 prompt 拼接
- 其他：无新增依赖

## 范围外

- 不做引用所在原文段落
- 不做选区跨 user+assistant 消息的场景（起点不在 assistant 气泡内不触发弹层）
- 不动 server 会话存储（server 无状态转发）与 `server/public/`（旧版静态页）
- 不做移动端长按选择菜单定制（沿用浏览器原生行为）
- 不改 `.env`、不新增环境变量
