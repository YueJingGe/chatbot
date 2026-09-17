# Spec: 接入 commitlint + czg 统一提交信息规范

> L2 完整规格 | 启动 2026-09-17 | 路由依据：影响 5 个文件 / 约 80 行配置

## 背景

当前项目仅依靠 [git-commit SKILL](file:///Users/a211026/Desktop/ai/chatbot/.agents/skills/git-commit/SKILL.md) 约束 AI 的 commit message，缺少工具层面的强制校验。手工提交或外部贡献时容易写出不符合 `<type>(<scope>): <中文描述>` 规范的 message。需要把上一回合分析的 `.commitlintrc.cjs` 可借鉴项（前 7 项）落地为项目规范，并同步引入 `czg` 提供交互式提交引导。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|校验工具|`@commitlint/cli` + `@commitlint/config-conventional`|社区标准，与 Conventional Commits 对齐，支持自定义规则|
|配置文件扩展名|`.commitlintrc.cjs`|根目录 `package.json` 已设 `"type": "module"`，CJS 扩展避免 ESM/CJS 混用问题|
|type 白名单|`feat/fix/docs/style/refactor/perf/test/chore/ci`|在 SKILL 原有 6 类基础上扩展 `perf/test/ci`，并同步更新 SKILL|
|scope 来源|语义化 scope 为主，workspace 包名为辅|与 SKILL 保持一致：`frontend/backend/docs/root`；同时允许 `chatbot-web/chatbot-server` 作为兼容|
|header 长度|`120`|中文描述比英文短，120 足够；比示例中的“不限制”更严格|
|body 长度|`200`|项目当前不写长 body，设 200 防止自动换行过长|
|emoji|不启用|遵循 AGENTS.md：默认不使用 emoji|
|多 scope|不启用|SKILL 使用单 scope，保持 message 简洁|
|交互式提交|引入 `czg` + `@commitlint/cz-commitlint`|手工提交时按规范选择 type/scope，减少学习成本|
|hook 校验|新增 `.husky/commit-msg`|`git commit` 时自动校验 message，非法即拦截|

## 验收标准

- [x] `.commitlintrc.cjs` 已创建，`npx commitlint --from=HEAD~1 --to=HEAD` 对最近一次提交不报错。
- [x] `.husky/commit-msg` 已创建，非法 commit message 在提交时被拦截并给出明确错误。
- [x] `package.json` 已添加 `@commitlint/cli`、`@commitlint/config-conventional`、`czg`、`@commitlint/cz-commitlint` 为 devDependencies。
- [x] `package.json` 已配置 `config.commitizen`，指定 `path: "@commitlint/cz-commitlint"`。
- [x] `.agents/skills/git-commit/SKILL.md` 的 type 表已扩展为 `feat/fix/docs/style/refactor/perf/test/chore/ci`。
- [x] `npx czg` 可正常启动交互式提交流程。
- [x] `npm run check:all` 仍然全部通过。

## 涉及模块

- 根仓库配置：`package.json`、`.commitlintrc.cjs`、`.husky/commit-msg`
- 依赖锁定：`package-lock.json`
- AI 流程规范：`.agents/skills/git-commit/SKILL.md`

## 范围外

- 不改动 `.husky/pre-commit` 和 `.husky/pre-push` 的现有逻辑。
- 不修改 CI/GitHub Actions 工作流。
- 不动业务代码。
- 不引入 `release` / `other` type，避免稀释规范。
