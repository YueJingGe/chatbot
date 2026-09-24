# Push-gate ledger 惰性模板与 What to do next（L1 简化）

> 启动 2026-09-24 | 路由依据：影响 2–3 个文件 / 约 50–80 行

## 目标

把 `scripts/push-gate.mjs` 对 `docs/ledger/CORE-LEDGER.md` 的检查，从"文件是否存在"升级为"本次核心路径改动是否有对应条目"；缺失时惰性生成条目模板并输出可执行的 "What to do next" 提示。保留轻量/strict 模式与跳过开关。

## 验收

- [x] `push-gate.mjs` 能解析 `CORE-LEDGER.md` 中已有条目的日期与 scope，判断本次核心路径改动是否被覆盖。
- [x] 未被覆盖时，自动在 `CORE-LEDGER.md` 末尾追加一条带日期前缀、涉及文件清单、待填写字段的 ledger 模板；同时输出 "What to do next" 提示。
- [x] 轻量模式仅 warning 不阻塞；strict 模式（`CHATBOT_PUSH_STRICT=1` 或交互启用）阻塞 push。
- [x] `git-commit` skill 中关于 ledger 的提醒措辞更新为"pre-push 会兜底生成模板，但仍建议在 commit 前主动补录"。
- [x] `npm run check:all` 全绿；破坏式验证（模拟核心路径改动无 ledger 条目 → 生成模板/提示；补录后通过）成立。

## 涉及

- `scripts/push-gate.mjs`（主要改造）
- `.agents/skills/git-commit/SKILL.md`（提醒措辞微调）

## 范围外

- 不改核心路径定义（仍沿用 hooks/types/server/.agents/docs-harness）
- 不改复杂度敏感命中规则
- 不新增后端或前端 TDD 门禁
