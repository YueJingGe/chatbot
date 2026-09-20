# Spec: Git 提交前变更治理增强

> L2 完整规格 | 启动 2026-09-18 | 路由依据：影响 7 个文件 / 约 250 行

## 背景

当前项目 Git 工作流已具备分支保护与自动 rebase 能力，但缺少对**核心模块变更**的轻量治理手段。随着 `web/src/hooks/`、`web/src/types/`、`server/` 等核心路径承载的契约越来越多，希望引入一套低成本、可渐进增强的提交前治理机制：

- 改动核心路径时，作者需显式记录变更理由（Ledger）。
- 提供轻量/严格双模式，默认不阻塞快速迭代，严格模式可用于发布前或核心重构。
- 对复杂度敏感文件（如状态管理、协议层、API 契约）自动识别并提升检查强度。
- 首次 push 时交互式询问是否启用严格模式，并持久化到本地 git config。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|Ledger 位置|`docs/ledger/CORE-LEDGER.md`|与现有 `docs/` 文档体系一致，便于归档与 review|
|Ledger 格式|Markdown，含 Added / Reused / Removed / Consolidated / Why unavoidable / Smaller-diff considered|借鉴减法账本结构，字段按项目场景适配|
|触发范围|`web/src/hooks/**`、`web/src/types/**`、`server/**`、`.agents/**`、`docs/harness/**`|命中这些路径代表核心契约或协作规范变更|
|复杂度敏感文件|正则匹配：`protocol/index.tsx`、`module.tsx`、`store`、`mode` 等|命中时强制要求 ledger，严格模式下阻塞|
|检查模式|Lightweight（默认）/ Strict|轻量模式仅警告；严格模式阻塞并跑完整 `check:all`|
|Strict 启用方式|首次 push 交互式询问 + `git config --local chatbot.pushStrict` + `CHATBOT_PUSH_STRICT=1` 环境变量|兼顾人性化、持久化与 CI/自动化场景|
|Bypass 机制|`CHATBOT_LEDGER_SKIP=1`、`CHATBOT_LEDGER_BASE_REF=<branch>`|处理 merge/rebase/integration push 等合理绕过场景|
|阻塞策略|轻量模式：警告不阻塞；严格模式：ledger 缺失/过期则阻塞|与现有 hook 风格一致，避免拖慢日常迭代|

## 验收标准

- [x] 新增 `docs/ledger/CORE-LEDGER.md` 模板，结构清晰可直接填写。
- [x] `.husky/pre-push` 能识别核心路径变更，轻量模式下打印黄色警告与修复命令。
- [x] `.husky/pre-push` 支持交互式 strict 模式询问，用户选择后写入本地 git config。
- [x] 严格模式下，核心路径变更若未填写 ledger 或命中复杂度敏感文件无 ledger，则阻塞 push。
- [x] 新增 `scripts/push-gate.mjs` 承载主要检测逻辑，便于本地手动运行与测试。
- [x] `.agents/skills/git-commit/SKILL.md` 更新：提醒改动核心文件时填写 ledger。
- [x] `docs/harness/git-workflow.md` 更新：补充 ledger、strict 模式、bypass 环境变量说明。
- [x] `package.json` 新增 `check:strict` 脚本（严格模式完整检查）。
- [x] `npm run check:all` 通过，且 hook 脚本可手动验证。

## 涉及模块

- 协作规范：`.agents/skills/git-commit/SKILL.md`、`docs/harness/git-workflow.md`
- Git 钩子：`.husky/pre-push`
- 治理脚本：`scripts/push-gate.mjs`（新增）
- 文档模板：`docs/ledger/CORE-LEDGER.md`（新增）
- 构建配置：`package.json`

## 范围外

- 不引入 E2E / CDP / 埋点验证（当前项目无此基础设施）。
- 不改动 pre-commit 的 lint-staged 流程。
- 不强制所有文件都参与 ledger，仅针对核心路径。
- 不修改 `.env` 或任何环境密钥文件。
