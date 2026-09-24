# Plan: [名称]

> 对应 spec：`docs/specs/active/[名称].md` | 启动 YYYY-MM-DD

## 任务分解

- [ ] 任务 1：[具体动作]
- [ ] 任务 2：[具体动作]
- [ ] 任务 3：[具体动作]

## 依赖关系

- 任务 2 依赖 任务 1
- 任务 3 可与 任务 2 并行

## 验证方式

- [ ] `npm run check:all` 通过（含 `check:harness`、`check:frontend-tdd`）
- [ ] 若涉及前端行为改动，TDD 已按 `.agents/skills/test-driven-development/SKILL.md` 执行，并保留 Red-Green 证据；门禁 `scripts/check-frontend-tdd.mjs` 不重复定义规则，仅做机器兜底
- [ ] 手动测试 xxx
