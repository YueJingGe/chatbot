# CLAUDE.md

Read AGENTS.md for project context.
For architecture/conventions quick-ref, see `.agents/context/`.

## Claude-Specific

- 中文回复
- 复杂任务使用 ultrathink
- 代码审查时使用严厉风格（参考 `.agents/skills/code-review`）
- 修改代码前先在 `.agents/skills/` 找对应 skill
- 改完代码必须 `npm run check:all` 验证
- 不要修改 `.env`、lock 文件、`.agents/ignore`

## 效率约束

- 用户已指明文件位置时，直接打开该文件修改，禁止撒网式 grep
- 改完不截图自证，信任 lint + diff
- 先给改动、后简述，最小改动优先
- 根因不确定时禁止盲改，只打最小诊断日志
