# Server 端补 ESLint 能力，让 `check:all` 真正名副其实

## 背景

在 [feature-sidebar-conversation-history](../docs/specs/completed/2026-08/feature-sidebar-conversation-history.md) 实施后，AGENTS.md 把验证规则收敛为：

> 改 `web/src/**` 或 `server/**` 后必须 `npm run check:all` 验证

但当前 `check:all` 的实际链路是：

```
format:check (全量 prettier) + lint:check (仅 web/src) + stylelint:check (仅 web/src) + build:web
```

**server 端只有 format 检查，没有 lint 检查**。规则与现实不一致。

## 目标

让 `check:all` 真正覆盖 server 端代码质量。

## 待办

- [x] 在 `server/` 下新增 `eslint.config.mjs`（与根目录 ESLint v10 flat config 对齐）
- [x] 在 `server/package.json` 增加 `lint` 和 `lint:check` 脚本
- [x] 评估 `check:all` 中的 `lint:check` 是否改为同时跑 `web/src` + `server`
- [x] 跑一遍现有 server 代码，确保能过新的 lint（必要时做一次性 fix）
- [x] 跑 `npm run check:all` 全量验证

## 验收

- [x] `check:all` 实际执行了 server 端代码的 ESLint
- [x] 改 `server/**` 后跑 `check:all` 能捕获 lint 错误
- [x] CI（`.github/workflows/ci.yml`）保持通过
