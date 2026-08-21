---
name: git-branch
description: 分支操作流程（开分支/合并/发布/解冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。分支模型与版本号规则见 .agents/context/git-workflow.md；commit message 走 git-commit skill。
---

# Git Branch 操作流程

> 分支模型、版本号规则见 `.agents/context/git-workflow.md`。本文件只讲**怎么操作**。

## 常规功能

```bash
# 从 main 切
git checkout main && git pull
git checkout -b feature/xxx
# 开发 + 提交（走 git-commit skill）
git push -u origin feature/xxx
# 开 PR: feature/xxx → develop（CI + 测试）
# 测过后开 PR: feature/xxx → release/vX.Y.Z（code-review 门禁，人定这轮发哪些）
```

## 发布

main 受保护，只能经 PR 合并；tag 单独推（不推 main 分支）。

```bash
git checkout main && git pull
git checkout -b release/v1.3.0 && git push -u origin release/v1.3.0
# ready 的 feature PR 合入 release；静置测试后：
# 开 PR: release/v1.3.0 → main（CI + CodeRabbit 过后，网页合并）
# 合并后本地同步并打 tag（只推 tag）：
git checkout main && git pull
git tag v1.3.0 && git push origin v1.3.0
# 同步回 develop（develop 未保护，可直接推）
git checkout develop && git merge main && git push origin develop
# 删旧 release
git push origin --delete release/v1.3.0
```

## 紧急 hotfix

```bash
git checkout main && git pull
git checkout -b hotfix/xxx
# 修复 + 提交 + push
git push -u origin hotfix/xxx
# 开 PR: hotfix/xxx → main（快速 review，网页合并）
# 合并后本地同步并打 PATCH tag（只推 tag）：
git checkout main && git pull
git tag v1.2.1 && git push origin v1.2.1
git checkout develop && git merge main && git push origin develop
```

## rebase（feature 落后 main 时）

```bash
git checkout feature/xxx
git rebase main   # 保持线性历史，不要 git merge main
```

## 冲突分级处理

| 冲突类型 | 处理方 | 做法 |
|---------|-------|------|
| `package-lock.json` | AI | 删掉重跑 `npm install` |
| 同步产物（`.claude/skills/`、`.cursorignore`） | AI | 重跑 `npm run sync:agents` |
| 不同文件的改动 | Git 自动 | 无需干预 |
| 同文件不同区域 | AI | 保留双方 |
| **同一函数双方都改** | **人** | AI 停下，列出双方意图，等人决策 |
| **语义冲突**（无文本冲突但逻辑打架） | **人** | AI 只提示风险，不自作主张 |

## develop 退出某功能

- `git revert -m 1 <merge-commit>`（可逆），或从 main 重建 develop 后 re-merge 要留的 feature

## 多 agent 并行（worktree）

```bash
git worktree add ../chatbot-featA -b feature/a main
cd ../chatbot-featA && npm install   # 每个 worktree 独立装依赖
```

每个 agent 一个独立目录 + 独立分支，互不干扰，各自开 PR。
