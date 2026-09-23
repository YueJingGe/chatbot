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

### 2026-09-22 | harness | TDD 触发条件改为代码改动类型并强化 bug fix 证据

- Changed: `AGENTS.md` 第 46 行 TDD 触发条件从“新增或改变行为”改为“新增、修改或修复组件、hook、工具函数、状态或交互行为”；第 58 行“声称修复”的验收标准增加“必须包含复现 bug 的测试失败输出，以及修复后同一测试通过的输出”。
- Changed: `test-driven-development` skill 增加“Bug Fix TDD”专节，明确要求先写复现测试、保留失败输出、再修复代码；并在 Common Rationalizations 与 Red Flags 中增加 bug fix 专属条目。
- Changed: `docs/harness/frontend-testing.md` 扩展“测试先行”章节，新增“Bug Fix 的 TDD 要求”小节， checklist 同步要求保留失败输出。
- Why the change is unavoidable: 用户指出 TDD 触发应看代码改动类型而非 prompt 关键词；同时“修改bug吧”那次交互显示 agent 先改代码后补测试，说明仅有触发条件无法保证真正执行 Red-Green，必须增加 bug fix 专用流程与证据要求。
- Smaller-diff alternative considered: 仅改 AGENTS.md 触发条件，不动 TDD skill 与 frontend-testing.md。被否决，因为只改入口仍会让 agent 在"已触发 TDD"后跳过 Red 阶段；必须从入口、流程、证据三处同时收紧。

### 2026-09-23 | harness | 提交机制与 Harness 自校验

- Added: `scripts/check-harness.mjs` 与 `npm run check:harness`；`check:all` 首位并入 harness 检查。
- Added: `commit`/`cm` 双入口 script；`.husky/pre-commit` 增加 `lint.skipLintStaged` 跳过判断；`.czrc` 限定 czg 向导 type 为 9 类。
- Changed: `.agents/skills/git-commit/SKILL.md` 删除 type/scope 表格，改为直接引用 `.commitlintrc.cjs`；`.commitlintrc.cjs` 注释去悬空引用；`llms.txt` 更新命令表。
- Changed: lint-staged 中 eslint/stylelint 增加 `--cache`。

### 2026-09-23 | harness | git-commit skill 交互确认与 add 方式收紧

- Changed: `.agents/skills/git-commit/SKILL.md` 要求 `AskUserQuestion` 的 question 字段必须内联当前分支、文件清单、message 全文及依据，禁止"以下"等悬空引用；提交前 add 改为对每个文件用显式路径，禁止 `git add -A` / `git add .` 兜底。
- Why the change is unavoidable: 实测新会话调用 skill 时确认面板未展示清单，用户无法审查拟提交内容与 message；`git add -A` 兜底会把工作区其他未确认改动一并提交，已造成过越权提交实例。
- Smaller-diff alternative considered: 仅在 skill 里加"展示清单"的模糊要求，不指定必须内联到 question 字段。被否决，因为模糊要求无法保证确认面板里实际出现清单。

### 2026-09-23 | harness | git-commit skill message 选择改为多候选倾向

- Changed: `.agents/skills/git-commit/SKILL.md` 步骤 5/6 从"生成单个 message 草案后 A/B/C 确认"改为"根据改动生成 2-3 个候选 message（不同 type/scope 倾向），用 `AskUserQuestion` 让用户选择 A/B/C 或 D 取消"。
- Why the change is unavoidable: 用户希望根据代码改动看到多个 message 倾向再选，而不是只能接受/修改/拒绝单个草案；多候选更贴合"根据改动交互式问我倾向哪个描述"的交互方向。
- Smaller-diff alternative considered: 保留单草案 + "B 修改"选项，让用户用文字补充。被否决，因为无法让用户在多个完整候选间直接比较选择，交互效率更低。
