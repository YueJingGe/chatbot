# AI 前端分层治理补强（L1 简化）

> 启动 2026-09-24 | 路由依据：影响约 6 个文件 / 以脚本和模板改动为主

## 目标

把前端 TDD 从"AI 自觉调用 skill"推进到"Skill + 门禁 + 计划模板"三层互锁，防止绕过和遗忘，避免规则多份漂移。

## 验收

- [x] 新增 `scripts/check-frontend-tdd.mjs`，对本次变更的 `web/src/**` 逻辑文件检查同目录是否存在 `*.test.ts(x)`；`fix` 类提交额外检查是否有测试文件变更。
- [x] `npm run check:all` 调用该脚本；`.husky/pre-commit` 与 `.husky/pre-push` 也在提交前触发它。
- [x] 更新 `docs/harness/frontend-testing.md`，用"三层治理"小节说明 Skill、门禁、计划模板各自的职责和引用关系。
- [x] 更新 `docs/specs/active/TEMPLATE-L1.md`、`TEMPLATE-L2.md` 与 `docs/exec-plans/active/TEMPLATE.md`，在验收/Verification Strategy 中引用 TDD skill 与门禁，不重复写规则。
- [x] `npm run check:all` 全绿，`npm run sync:agents` 后 `check:harness` 全绿；破坏式验证（临时新增无测试文件 → 门禁报错 → 补测试 → 通过；fix 提交不带测试变更 → 门禁报错）成立。

## 涉及

- `scripts/check-frontend-tdd.mjs`（新增）
- `package.json` 的 `check:all` 与 `check:frontend-tdd` 脚本
- `.husky/pre-commit` 与 `.husky/pre-push`
- `docs/harness/frontend-testing.md`
- `docs/specs/active/TEMPLATE-L1.md`、`TEMPLATE-L2.md`
- `docs/exec-plans/active/TEMPLATE.md`
- `llms.txt`
- `docs/ledger/CORE-LEDGER.md`
- 未改动：`AGENTS.md`（现有 TDD 触发条款已覆盖，无需扩写）

## 范围外

- 不改 `web/src/**` 现有业务代码和测试
- 不新增后端 TDD 门禁
- 不修改 `.env` 等环境文件
