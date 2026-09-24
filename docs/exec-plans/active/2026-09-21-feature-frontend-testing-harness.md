# Plan: 前端测试 Harness 引入

> 对应 spec：`docs/specs/active/2026-09-21-feature-frontend-testing-harness.md` | 启动 2026-09-21

## 任务分解

- [x] 新增 `docs/harness/frontend-testing.md`，固化已验证的前端测试规则与 TDD checklist。
- [x] 更新 `frontend-context.md` 的测试事实，移除过时技术债。
- [x] 更新 AGENTS Default Protocol，仅对新增或改变前端行为触发 TDD skill。
- [x] 将 `npm run test --workspace=web` 加入根 `check:all` 的构建前门禁。
- [x] 同步 agent assets，运行质量检查，并以真实 prompt 做 meta 验证。

## 依赖关系

- AGENTS 的一行触发规则依赖详细规范已落在 `docs/harness/frontend-testing.md`。
- `check:all` 门禁依赖既有 Vitest 测试可稳定运行。
- meta 验证依赖文档、上下文和入口规则全部更新完成。

## 验证方式

- [x] `npm run sync:agents` 后无非预期同步改动。
- [x] `npm run check:all` 通过，且日志中可见 `npm run test --workspace=web`。
- [x] 使用“为 MessageList 新增交互行为”的真实 prompt 验证：命中 frontend context、frontend-testing 规则和 TDD skill。
- [x] `git diff --check` 通过。
