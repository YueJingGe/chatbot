# 完成事项

## harness流程验证 —— 分支发布场景

用户说 `发布`

agent 执行 `git branch  skill`：

1. 先确认当前分支状态和规范
2. 然后查看 `git-workflow.md` 文件，按路径约束，确认当前分支走什么发布流程
3. 如果是 release 分支， 跟用户确认版本号
4. 最后告知用户即将要做的事情，等用户确认开始发布

以fix/*分支发布为例：

```md
> Skill git-branch

好的，执行发布流程。先确认当前分支状态和规范。

> 已查看 git-workflow.md

当前分支是 `fix/git-branch-skill-post-release-trigger`，属于 `fix/*` 前缀，走 **发布 release 流程**。

让我先检查现有 release 分支和版本情况。

当前状态汇总：

- **当前分支**：`fix/git-branch-skill-post-release-trigger`
- **最新 tag**：`v1.1.0`
- **已有 release 分支**：无（远端没有 release 分支）
- **本分支待合入的 commits**：`fix/*` 前缀的改动

按路径约束，`fix/*` → `release/*` → `main`，走 **发布 release 流程**。

需要确认版本号：当前最新是 `v1.1.0`，本次是 fix 改动，按 SemVer 应为 **v1.1.1**（PATCH +1）。

**计划路径**：

1. 从 `main` 创建 `release/v1.1.1`
2. 开 PR：`fix/git-branch-skill-post-release-trigger` → `release/v1.1.1`
3. 预发布检查后，开 PR：`release/v1.1.1` → `main`
4. 你在 GitHub 网页合并后，执行发布后步骤（tag + 同步 develop）

版本号 `v1.1.1` 对吗？还是你想用其他版本？
```

然后用户说`确认`

agent 开始执行：

1. 先检查是否落后 main。不落后 main，直接 push。
2. 按照计划路径开始执行
3. 开 PR，给出 PR 标题、描述

```md
本地没有 gh CLI，请手动在 GitHub 创建 PR：

**PR 链接**：点击创建 PR

- **Base**：release/v1.1.1
- **Compare**：fix/git-branch-skill-post-release-trigger
- **标题**：fix: git-branch skill 发布后触发机制修复 + harness 文档完善

PR 合并到 release/v1.1.1 后告诉我，我继续执行预发布检查和 release/v1.1.1 → main 的 PR。
```
