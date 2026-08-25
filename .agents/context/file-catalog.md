# File Catalog

仓库内 harness 相关文件清单。新增/删除文件时同步更新本表。

## `.agents/`

### context/

|文件|作用|
|-|-|
|`backend-context.md`|后端稳定事实：技术栈、目录结构、约定|
|`frontend-context.md`|前端稳定事实：技术栈、目录结构、约定|
|`project-overview.md`|项目全局：架构、workspace、关键约束|
|`git-workflow.md`|Git 分支模型 + 版本号规则（hotfix / develop / release）|
|`harness-governance.md`|修改 harness 自身的协议（本仓库的「karpathy-guidelines」）|

### skills/

|Skill|何时触发|
|-|-|
|`new-requirement`|接到新需求（加个/做 xxx/帮我做 xxx）|
|`code-review`|用户说 review/审查代码（IDE 内手动）|
|`git-branch`|开分支/合并/发布/解冲突/hotfix|
|`git-commit`|写 commit / 推送|
|`karpathy-guidelines`|写新代码/修 bug/重构/review 时通用行为准则|
|`skill-creator`|创建/优化 skill 时|
|`frontend-visual-verification`|改 web/src/** 涉及布局/样式/响应式/交互时（4 档执行）|

### 其他

- `.agents/ignore` — AI 工具通用 ignore 单一事实源（同步到 .cursorignore / .claudeignore）

## `docs/`

### harness/

|文件|作用|
|-|-|
|`architecture.md`|仓库架构、workspace 拓扑、依赖流向|
|`backend-rules.md`|后端编码规范（详细）|
|`frontend-rules.md`|前端编码规范（详细）|

### reference/

|文件|作用|
|-|-|
|`css.md`|样式写法参考|
|`markdown.md`|Markdown 写法参考|
|`naming.md`|命名规范|
|`react-components.md`|React 组件写法参考|

### specs/

- `active/` — 进行中的需求规格（含 `TEMPLATE-L1.md` / `TEMPLATE-L2.md`）
- `completed/2026-08/` — 已完成的需求规格

### exec-plans/

- `active/` — 进行中的执行计划（含 `TEMPLATE.md` 和 `README.md`）
- `completed/2026-08/` — 已完成的执行计划

## 根目录

|文件|作用|
|-|-|
|`AGENTS.md`|AI 协作入口（< 60 行）|
|`CLAUDE.md`|Claude Code 专属配置（指向 AGENTS.md）|
|`README.md`|仓库入口（人/AI 共读）|
|`llms.txt`|LLM 友好的项目概览|
|`package.json`|根 workspace 配置|
|`eslint.config.mjs`|ESLint 配置|
|`.prettierrc` / `.stylelintrc`|格式化配置|
|`.husky/`|Git hooks|
|`.github/`|GitHub 配置（PR 模板、workflows）|
|`ISSUES/`|项目 issue 记录（按日期编号）|

## workspace

|目录|作用|
|-|-|
|`web/`|前端（React 19 + Vite 7 + TS）|
|`server/`|后端（Node + Express）|
|`scripts/`|仓库级脚本（`sync-ignore.js` / `sync-skills.js`）|

## 维护

新增/删除/重命名文件时，**同步本表**。本表是 catalog，不是 SSOT——SSOT 仍是各文件本身。本表只是导航。
