# AGENTS.md — AI 协作入口

AI 对话机器人 monorepo，npm workspaces 管理前端（web/）和后端（server/）。

## Commands

- `npm run dev` — 并发启动前后端（端口 5173 / 3000）
- `npm run dev:web` / `dev:server` — 仅启动一端
- `npm run build:web` — 构建前端到 `web/dist/`
- `npm run check:all` — Prettier + ESLint + Stylelint + Build
- `npm run sync:agents` — 同步 `.agents/` 到各 AI 工具

## Map（结构索引）

|路径|是什么|
|-|-|
|`.agents/context/`|稳定事实：技术栈、架构、工作流（含 file-catalog / harness-governance）|
|`.agents/skills/`|任务 workflow（按需触发）|
|`docs/harness/`|前后端架构规范|
|`docs/reference/`|命名 / markdown / css / 组件写法|
|`docs/specs/` / `docs/exec-plans/`|需求规格 / 执行计划（active + completed）|

关键文件：

- `.agents/context/file-catalog.md` — harness 文件清单
- `.agents/context/harness-governance.md` — 修改 harness 自身的协议

## Guardrails（硬性红线）

- 只做用户明确要求的事。布局≠交互，样式≠逻辑，修 bug≠重构。
- 禁止捏造接口字段、环境变量名、业务规则。
- 以下情况必须停下来问用户：需求有歧义、多个方案有不同产品后果、范围超出原始需求。

## Default Protocol（动作触发）

- 接到新需求：走 `.agents/skills/new-requirement/SKILL.md` 路由
- 任何代码改动：先调 `karpathy-guidelines`（显式假设、最小改动、可验证标准）
- 凡涉及用户可见行为/视觉/交互的改动（UI 组件、Hook、状态、API 契约、数据流），必须先走 `brainstorming`
- 改 web/src/** 涉及布局/样式/响应式/交互：调 `.agents/skills/frontend-visual-verification/SKILL.md`（4 档：T1 DOM 探针 / T2 单截图 / T3 多断点 / T4 含交互态）
- 改 web/src/** 逻辑：读 `.agents/context/frontend-context.md` + `docs/harness/frontend-rules.md`
- 改 server/**：读 `.agents/context/backend-context.md` + `docs/harness/backend-rules.md`
- 加依赖/改 workspace：读 `.agents/context/project-overview.md` + `docs/harness/architecture.md`
- 命名/格式/写法不确定：查 `docs/reference/`
- 用户说 review/审查：走 `.agents/skills/code-review/SKILL.md`
- 任务首次代码改动前：`git rev-parse --abbrev-ref HEAD` 确认分支；main / release/* 先按 `.agents/skills/git-branch/SKILL.md` 切 feature 分支
- 实现完成：`npm run check:all` 通过后主动询问是否需要 code review
- commit/push 走 `git-commit` SKILL；分支/合并/发布/冲突/hotfix 走 `git-branch` SKILL
- 改 `.agents/**` 或 `AGENTS.md`：先读 `.agents/context/harness-governance.md`
- 完成任务 / 声称修复：必须给可验证证据（命令输出 / 截图 / 数据），不是「应该好了」
- AI 启动时读 `.agents/ignore`

<!-- 详细规范外移到 .agents/context/file-catalog.md / harness-governance.md -->
