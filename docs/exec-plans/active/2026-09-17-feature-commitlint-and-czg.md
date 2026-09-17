# Plan: 接入 commitlint + czg 统一提交信息规范

> 对应 spec：`docs/specs/active/2026-09-17-feature-commitlint-and-czg.md` | 启动 2026-09-17

## 任务分解

- [x] 安装依赖：`npm install -D @commitlint/cli @commitlint/config-conventional czg @commitlint/cz-commitlint`
- [x] 创建 `.commitlintrc.cjs`，配置 type/scope/长度规则
- [x] 创建 `.husky/commit-msg`，调用 `npx --no-install commitlint --edit "$1"`
- [x] 更新 `package.json` 的 `config.commitizen`，指向 `@commitlint/cz-commitlint`
- [x] 更新 `.agents/skills/git-commit/SKILL.md` 的 type 表为 `feat/fix/docs/style/refactor/perf/test/chore/ci`
- [x] 运行 `npm run check:all` 确认无回归
- [x] 手动测试：用非法 message 提交应被 commit-msg hook 拦截；用合法 message 提交应通过；`npx czg` 能启动交互式提示

## 依赖关系

- 任务 2 依赖 任务 1（依赖安装后才能写配置引用包）
- 任务 3、4、5 可与任务 2 并行，但建议按顺序落盘以便一次性验证
- 任务 6 依赖 1-5 全部完成
- 任务 7 依赖 6

## 验证方式

- [ ] `npm run check:all` 通过
- [ ] `npx commitlint --from=HEAD~1 --to=HEAD` 对最近一次提交不报错
- [ ] `echo "bad message" | npx commitlint` 返回非零退出码
- [ ] `npx czg --help`（或启动一次交互流程）无报错
