# 完成事项

## Harness 规则缺口补全

- 硬性红线增加：不修改 `server/.env` 等环境文件；不把 secrets / API key / token 写入会提交的文件（含 `.env.example`）
- 边界约定：`ISSUES/`、`总结/`、`docs/**/completed/` 为历史记录，不作为现行规则依据。
- 不过度设计：只读事实查询（≤3 文件 & ≤1 命令可答）：直接执行并回答，不建 Todo、不扩张阅读。

> 需求归档在 `docs/specs/completed/2026-09-17-feature-harness-rule-gaps-L1.md`
