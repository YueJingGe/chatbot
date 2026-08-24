# AGENTS.md — 通用的 Agent 规范

## Project

AI 对话机器人 monorepo，npm workspaces 管理前端（web/）和后端（server/）

## Commands

- `npm install` — 安装全部依赖
- `npm run dev` — 并发启动前后端（端口 5173 / 3000）
- `npm run dev:web` — 仅启动前端（端口 5173）
- `npm run dev:server` — 仅启动后端（端口 3000）
- `npm run build:web` — 构建前端生产包（输出到 `web/dist/`）
- `npm run check:all` — 全量检查（Prettier + ESLint + Stylelint + Build）
- `npm run format` — 自动格式化
- `npm run lint` — 自动修复 ESLint 问题
- `npm run stylelint` — 自动修复 Stylelint 问题
- `npm run sync:ignore` — 同步 `.agents/ignore` 到各 AI 工具
- `npm run sync:skills` — 同步 `.agents/skills/` 到各 AI agent
- `npm run sync:agents` — 同时同步 ignore 和 skills

## Map（结构索引，只用于定位）

|路径|是什么|
|-|-|
|`.agents/context/`|稳定事实：分支模型、技术栈、前后端上下文|
|`.agents/skills/`|任务 workflow|
|`docs/harness/`|前后端/架构规范|
|`docs/reference/`|写法参考：命名 / markdown / css / 组件|
|`docs/specs/` / `docs/exec-plans/`|需求规格 / 执行计划（active + completed）|

## Default Protocol（动作触发，跨所有 skill 始终生效）

- 接到新需求（加个/做个/帮我做 xxx）：先走 `.agents/skills/new-requirement/SKILL.md` 路由
- 任务首次代码改动前：跑 `git rev-parse --abbrev-ref HEAD` 确认当前分支；若在 main / release/*，先按 `git-branch` SKILL 切 feature 分支（模型见 `.agents/context/git-workflow.md`）
- 改 `web/src/**` 时：先读 `.agents/context/frontend-context.md` + `docs/harness/frontend-rules.md`
- 改 `server/**` 时：先读 `.agents/context/backend-context.md` + `docs/harness/backend-rules.md`
- 加依赖/改 workspace 时：先读 `.agents/context/project-overview.md` + `docs/harness/architecture.md`
- 命名/格式/写法不确定时：查 `docs/reference/` 对应文件
- 用户说 review/审查代码：用 `.agents/skills/code-review/SKILL.md`（IDE 内手动审查）
- commit/push 走 `git-commit` SKILL；开分支/合并/发布/冲突/hotfix 走 `git-branch` SKILL
- 改完代码必须 `npm run build:web` 验证
- 禁止捏造接口字段、环境变量名、业务规则；不确定就问
- AI 启动时读 `.agents/ignore`，不检查列表中的文件
- 根 AGENTS 不承载细节正文；事实/规范按 Map 定位后读正文

## Contributor Rules

- 给人和 AI 共读的入口放 `README.md`；给 AI 的导航放 `AGENTS.md`
- 任务 workflow 放 `.agents/skills/*/SKILL.md`
- 给 AI 读的内容若被 `<!-- -->` 注释，AI 不读、不引用（视为人工禁用）
