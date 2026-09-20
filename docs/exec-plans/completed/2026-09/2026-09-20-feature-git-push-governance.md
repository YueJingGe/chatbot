# Plan: Git 提交前变更治理增强

> 对应 spec：`docs/specs/active/2026-09-18-feature-git-push-governance.md` | 启动 2026-09-18

## 任务分解

- [x] 任务 1：创建 `docs/ledger/CORE-LEDGER.md` 模板
- [x] 任务 2：创建 `scripts/push-gate.mjs`，实现核心路径检测、复杂度敏感文件识别、ledger 存在性检查、strict 模式判断
- [x] 任务 3：重构 `.husky/pre-push`，集成 `push-gate.mjs`，加入交互式 strict 模式询问
- [x] 任务 4：更新 `.agents/skills/git-commit/SKILL.md`，增加 ledger 提醒
- [x] 任务 5：更新 `docs/harness/git-workflow.md`，补充治理机制说明
- [x] 任务 6：更新 `package.json`，新增 `check:strict` 脚本
- [x] 任务 7：本地验证 hook 与脚本行为（警告模式、严格模式、bypass）

## 依赖关系

- 任务 2 依赖 任务 1（ledger 模板路径确定后脚本才能检查）
- 任务 3 依赖 任务 2
- 任务 4、5、6 可与 任务 3 并行
- 任务 7 依赖 任务 3、4、5、6

## 验证方式

- [ ] `npm run check:all` 通过
- [ ] 手动模拟：修改 `web/src/hooks/useConversation.ts` 后 push，验证警告输出
- [ ] 手动模拟：`CHATBOT_PUSH_STRICT=1 git push` 验证严格模式阻塞行为
- [ ] 手动模拟：`CHATBOT_LEDGER_SKIP=1 git push` 验证 bypass 生效
