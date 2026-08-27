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

## Map

|场景|读取文件|
|-|-|
|新需求|`.agents/skills/new-requirement/SKILL.md`（自动路由 L0/L1/L2）|
|写前端代码|`.agents/context/frontend-context.md` + `docs/harness/frontend-rules.md`|
|写后端代码|`.agents/context/backend-context.md` + `docs/harness/backend-rules.md`|
|引入新依赖/改 workspace|`.agents/context/project-overview.md` + `docs/harness/architecture.md`|
|需要详细写法参考|`docs/reference/` 下对应文件|
|命名不确定|`docs/reference/naming.md`|
|Markdown 格式不确定|`docs/reference/markdown.md`|
|code review|`.agents/skills/code-review/SKILL.md`（IDE 内手动审查）|
|git 提交|`.agents/skills/git-commit/SKILL.md`（commit message + push）|
|开分支/合并/发布/冲突/hotfix|`.agents/skills/git-branch/SKILL.md`（操作流程）|
|分支模型/版本号规则|`.agents/context/git-workflow.md`|
|分支路径规则/禁止项/发布流程|`docs/harness/git-branching.md`|

## Default Protocol

- 先读 Map，再读正文：根据任务场景读取对应文件
- 根 AGENTS 不承载细节正文；架构、规范、技术栈详见 `.agents/` 下对应文件
- 涉及架构或规范时，按 Map 跳转到对应文件
- 涉及复杂任务 workflow 时，优先找对应 `SKILL.md`
- 改完代码必须 `npm run build:web` 验证
- 不确定就问，禁止捏造接口字段、环境变量名、业务规则
- AI 启动时读 `.agents/ignore`，不检查列表中的文件

## Contributor Rules

- 给人和 AI 共读的入口放 `README.md`；给 AI 的导航放 `AGENTS.md`
- 任务 workflow 放 `.agents/skills/*/SKILL.md`
- 给 AI 读的内容若被 `<!-- -->` 注释，AI 不读、不引用（视为人工禁用）
