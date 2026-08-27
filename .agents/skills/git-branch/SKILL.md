---
name: git-branch
description: 分支操作流程（开分支/合并/发布/解冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。分支规范见 docs/harness/git-branching.md；commit message 走 git-commit skill。
---

# Git Branch 操作流程

> 分支规范见 `docs/harness/git-branching.md`。本文件只讲 AI 怎么执行。

## 意图识别原则

执行分支操作前，先识别用户意图：
- **唯一匹配**：只有一条合法路径 → 说明理解，直接执行
- **多条匹配**：多条路径都合法 → 列出选项及各自后果，让用户选
- **无法匹配**：无法判断意图 → 说明困惑点，让用户澄清
- **低置信度**：有猜测但不确定 → 说明猜测和依据，让用户确认或纠正

禁止在多条匹配或低置信度时自行选择。

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

执行前：读 `docs/harness/git-branching.md` 确认路径约束。

### 判断紧急程度

用户说「发布/上线/发版」时，先判断是否紧急：
- 紧急 → hotfix 流程（直达 main）
- 非紧急 → release 流程

不确定就问用户。

### release 流程

```bash
# 1. 检查是否已有 release 分支
git branch -r | grep release/
# 有 → 切到该 release，合并当前 feature
# 无 → 从 main 新建
git checkout main && git pull
git checkout -b release/vX.Y.Z && git push -u origin release/vX.Y.Z

# 2. PR: feature → release（CI + code-review）

# 3. 预发布检查（执行前必须完成）
# 列举当前 release 上所有已合入的 feature 分支
git log main..release/vX.Y.Z --oneline
# 检查各 PR 状态：CI 是否通过、review 是否完成
# 向用户展示清单，用户确认后才继续

# 4. PR: release → main（CI + CodeRabbit，网页合并）

# 5. 发布后步骤（合并后依次执行）
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z
git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop
git push origin --delete release/vX.Y.Z
# 如有后续功能待发布，新建下一 release：
# git checkout main && git checkout -b release/vX.Y+1.0 && git push -u origin release/vX.Y+1.0
```

### hotfix 流程

```bash
git checkout main && git pull
git checkout -b hotfix/xxx
# 修复 + 提交 + push
git push -u origin hotfix/xxx
# 开 PR: hotfix/xxx → main（快速 review，网页合并）
# 合并后：
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z
git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop
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
