# 完成事项

## harness优化 —— 提交代码流程中增加 commitlint 的检查

- 校验工具 `@commitlint/cli` + `@commitlint/config-conventional` 遵循社区标准
- 配置文件扩展名 `.commitlintrc.cjs`，根目录 `package.json` 已设 `"type": "module"`，CJS 扩展避免 ESM/CJS 混用问题

- type 白名单 `feat/fix/docs/style/refactor/perf/test/chore/ci`，同步更新 SKILL在 原有 6 类基础上扩展 `perf/test/ci`
- scope 以 SKILL 的语义化命名（frontend/backend/docs/root）为主，同时兼容 workspace 包名。

- 引入 czg 交互式提交：安装 `czg` + `@commitlint/cz-commitlint`，并在 package.json 配置 config.commitizen。，手工提交时按规范选择 type/scope，减少学习成本
- 新增 .husky/commit-msg 钩子做硬性校验 message，非法即拦截

- header 长度`120`|中文描述比英文短，120 足够；
- body 长度 `200`，项目当前不写长 body，设 200 防止自动换行过长

> 需求归档在 `docs/specs/active/2026-09-17-feature-commitlint-and-czg.md`
> 执行计划归档在`docs/exec-plans/active/2026-09-17-feature-commitlint-and-czg.md`
