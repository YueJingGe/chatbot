# Plan: 提交机制与 Harness 自校验

> 对应 spec：`docs/specs/active/2026-09-22-feature-commit-harness-mechanism.md` | 启动 2026-09-22

## 任务分解

- [x] 任务 1：修正 `.commitlintrc.cjs` 中"在 SKILL 基础上"的悬空注释，改为描述 9 类 type 白名单
- [x] 任务 2：修改 `.agents/skills/git-commit/SKILL.md`（删除 type/scope 表格，改为引用 `.commitlintrc.cjs`；保留格式行与示例）
- [x] 任务 3：新增 `.czrc`（types 限定为与 `type-enum` 一致的 9 类，中文名称）
- [x] 任务 4：新增 `scripts/check-harness.mjs`（skill frontmatter / `.agents`↔`.claude` 同步一致性 / `AGENTS.md` 引用可达性）
- [x] 任务 5：修改 `package.json`（`commit`/`cm` 双入口、lint-staged 缓存、`check:harness` 命令、`check:all` 首位并入）
- [x] 任务 6：修改 `.husky/pre-commit`（增加 `lint.skipLintStaged` 跳过判断）
- [x] 任务 7：更新 `llms.txt`（`check:all` 描述含 test/harness，新增 `check:harness` 命令行）
- [x] 任务 8：运行 `npm run sync:agents` 与 `npm run check:all`，修复首次报错
- [x] 任务 9：构造三类失败场景验证 `check-harness` 拦截能力（skill 未同步 / frontmatter 缺失 / AGENTS.md 引用失联）
- [x] 任务 10：验证 czg 双入口（`npm run commit`/`cm` 存在、向导 type 选项 9 类、中断 czg 后无残留 `lint.skipLintStaged`）
- [x] 任务 11：补充 `docs/ledger/CORE-LEDGER.md` 本次核心路径变更条目（`.agents/**`、`.husky/**`、package.json harness script）
- [x] 任务 12：meta-验证（新会话真 prompt 提交类指令）与 spec/exec-plan 归档
- [x] 任务 13：修复 `git-commit/SKILL.md` 确认面板，`AskUserQuestion` 的 question 字段必须内联文件清单、message 全文及依据，禁止"以下"等悬空引用
- [x] 任务 14：修复 `git-commit/SKILL.md` add 步骤，改为对本次拟提交文件用显式路径 `git add <path>`，禁止 `git add -A` / `git add .` 兜底
- [x] 任务 15：将 message 确认从单草案 A/B/C 改为根据改动生成 2-3 个候选 message 倾向，用户选择 A/B/C 或 D 取消

## 依赖关系

- 任务 1、2、3、4 可并行启动
- 任务 5 依赖任务 4（`check:all` 引用 `check:harness`）
- 任务 6 与任务 5 相互独立
- 任务 8 依赖任务 2、4、5、6、7
- 任务 9、10、11 依赖任务 8
- 任务 12 依赖任务 9、10、11
- 任务 13、14、15 为归档后补丁，依赖任务 2（skill 已落地），可与任务 8 后验证并行

## 验证方式

- [x] `npm run check:all` 通过
- [x] `npm run check:harness` 对当前仓库零误报
- [x] 构造失败场景下 `check-harness` 退出码非 0 并输出修复提示
- [x] `npm run sync:agents` 后 `.claude/skills/git-commit` 与 `.agents/skills/git-commit` 一致
- [x] `npx czg` 向导 type 选项为 9 类、scope 选项来自 `scope-enum`
- [x] 中断 czg 后 `git config --get lint.skipLintStaged` 返回空
- [x] 新会话真 prompt 验证 `git-commit` skill 仍能正确生成 message
- [x] 新会话提交时确认面板展示 2-3 个候选 message 全文及各自依据
- [x] 新会话提交时确认面板内联展示文件清单
- [x] 提交时对显式路径文件执行 `git add`，未使用 `git add -A` 或 `git add .`
