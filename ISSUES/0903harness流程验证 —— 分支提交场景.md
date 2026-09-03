# 完成事项

## harness流程验证 —— 分支提交场景

用户说`提交`

agent 执行 `git commit  skill`，按照 git-commit 工作流开始执行：

1、先并行跑质量检查和查看当前变更状态
2、执行 `check:all` 跑质量检查，全部通过之后查看当前分支具体改动
3、然后确定变更内容
4、然后执行提交

完成后自动继续执行 `git-branch skill` 的 `push` 段：

1、先检查是否落后 `main`，没有落后 `main`，无需 `rebase`，落后的话就 `rebase`
2、然后看当前分支是否有同名远程分支，有则直接 `push` ，没有就跟用户确认目标分支
3、执行 `push`

以fix/*分支提交为例：

```md
> Skill git-commit

先跑质量检查。

全部通过。提交变更。

> **Commit 信息**

- **分支**：`fix/git-branch-skill-post-release-trigger`
- **Commit**：`d859d51` — `docs: 明确 git-commit skill 完成后自动推送，不询问用户`
- **变更**：`.agents/skills/git-commit/SKILL.md`（1 文件，1 行改动）

**Push 结果**

- 已推送到 `origin/fix/git-branch-skill-post-release-trigger`（`1a99c1f..d859d51`）
```
