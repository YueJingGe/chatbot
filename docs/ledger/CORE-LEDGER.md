# Core Change Ledger

> 记录核心模块变更的决策理由。当改动涉及 `web/src/hooks/`、`web/src/types/`、`server/`、`.agents/**` 或 `docs/harness/**` 时，请在本文件追加条目。
>
> 填写原则：诚实、简洁、面向 review。不需要每个字段都写，但 `Why the change is unavoidable` 必须回答。

## 条目模板

```markdown
### YYYY-MM-DD | scope | 简短描述

- Added: 新增了什么
- Reused: 复用了什么现有逻辑/组件/类型
- Removed: 删除了什么
- Consolidated: 合并/折叠了什么重复代码
- Why the change is unavoidable: 为什么必须做这个改动，不做的代价是什么
- Smaller-diff alternative considered: 是否考虑过更小的改动方案，为什么被否决
```

## 变更记录

### 2026-09-22 | frontend | 组件目录化与测试同目录组织

- Added: `docs/harness/frontend-rules.md` 中新增「组件目录」规则，要求每个组件使用 `components/<Component>/index.tsx` 与 `index.module.less`。
- Reused: 保留现有 React.memo、CSS Modules、BEM 命名等既有约定。
- Removed: 删除 `web/src/components/__tests__/` 与 `web/src/utils/__tests__/` 子目录；测试文件平铺到源码同目录。
- Why the change is unavoidable: 用户明确要求 `components/` 下文件以 `demo` 为样例采用目录化结构；测试与源码同目录可降低新增测试的认知成本，并避免后续删除 `demo/` 时需要调整 Vitest 配置。
- Smaller-diff alternative considered: 仅移动源码而不同步规则文档。被否决，因为规则文档是 AI 协作的事实源，代码与文档不同步会导致后续 agent 继续生成旧结构。

### 2026-09-22 | harness | 前端测试规范与 AGENTS 触发规则

- Added: 新增 `docs/harness/frontend-testing.md` 规范；在 `AGENTS.md` Default Protocol 中要求新增或改变前端行为时调用 `test-driven-development` skill 并补充同目录测试；根 `package.json` 的 `check:all` 在构建前运行 `npm run test --workspace=web`。
- Reused: 复用已验证的 Vitest + Testing Library + jsdom 工具链与 `web/src/test-utils/vitest.setup.ts`。
- Why the change is unavoidable: 消息复制功能已用 TDD 实现，但 harness 未固化测试策略、AGENTS 未定义触发规则、`check:all` 不跑测试，导致后续前端改动可能回退到无测试状态。
- Smaller-diff alternative considered: 仅在 `frontend-context.md` 中口头记录测试命令，不纳入 AGENTS 触发与质量门禁。被否决，因为无法保证后续需求会实际执行测试。

### 2026-09-22 | harness | 本地化 TDD skill 并收紧 new-requirement 触发条件

- Added: 将 `test-driven-development` skill 从 Qoder marketplace 插件复制到 `.agents/skills/test-driven-development/`，并同步到 `.claude/skills/`。
- Changed: `new-requirement` skill 由“自动路由”改为“显式路由”，仅在用户明确说“新需求”“新功能”“加一个 xxx”或显式调用 `/new-requirement` 时触发；不再从“帮我做 xxx”“做 xxx”等模糊表述自动推断。
- Why the change is unavoidable: 用户反馈“新增一个纯工具函数”被误判为 L1 新需求并生成 spec，导致小改动流程过重；同时 TDD skill 原依赖外部插件，未纳入项目单一事实源，存在规则漂移风险。
- Smaller-diff alternative considered: 仅放宽 L0 文件数阈值（把测试文件不计入），保留自动路由。被否决，因为问题的根源是触发条件过宽，即使放宽阈值仍会为非需求类任务生成 spec；显式触发更符合“用户说需求才走需求流程”的直觉。

### 2026-09-22 | harness | git-commit skill 增加提交与推送双重确认

- Changed: `git-commit` skill 触发条件从“用户要求提交或完成任务后”收紧为“用户明确说提交/commit 时才触发”；流程增加 commit 前确认、push 前确认两步；不再在 commit 后自动 push。
- Why the change is unavoidable: 用户反馈完成任务后 agent 自动 commit/push，未等待确认，导致无法审查就推送到远端；同时容易把尚未验收的 harness 调整提前发布。
- Smaller-diff alternative considered: 仅取消自动 push，保留完成任务后自动 commit。被否决，因为用户本意是“只有用户要求才触发提交”，自动 commit 同样越界。
