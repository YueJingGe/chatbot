---
name: git-branch
description: 分支操作流程（开分支/合并/发布/解冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。分支规范见 docs/harness/git-workflow.md；commit message 走 git-commit skill。
---

# Git Branch 操作流程

> 分支规范见 `docs/harness/git-workflow.md`。本文件只讲 AI 怎么执行。

## 意图识别原则

执行分支操作前，先识别用户意图：
- **唯一匹配**：只有一条合法路径 → 说明理解，直接执行
- **多条匹配**：多条路径都合法 → 列出选项及各自后果，让用户选
- **无法匹配**：无法判断意图 → 说明困惑点，让用户澄清
- **低置信度**：有猜测但不确定 → 说明猜测和依据，让用户确认或纠正

禁止在多条匹配或低置信度时自行选择。

## PR 操作规则

凡涉及用户开 PR 的步骤，必须同时提供：
- **PR 标题**：简洁描述改动范围
- **PR 描述**：基于 `git log` 生成的改动说明，按 PR 模板格式输出

禁止只说"去开 PR"而不给内容。

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

执行前：读 `docs/harness/git-workflow.md` 确认路径约束。

### 判断紧急程度

用户说「发布/上线/发版」时，先判断是否紧急：
- 紧急 → hotfix 流程（直达 main）
- 非紧急 → release 流程

不确定就问用户。

### release 流程

**准备阶段**（本地执行）：

```bash
# 1. 检查是否已有 release 分支
existing_releases=$(git branch -r | grep 'origin/release/' | sed 's|.*origin/||')
if [ -n "$existing_releases" ]; then
  echo "已有 release 分支:"
  echo "$existing_releases"
  echo "请用户确认目标版本后，再执行: git checkout <目标分支> && git pull"
else
  echo "无 release 分支，从 main 新建"
  git checkout main && git pull
  git checkout -b release/vX.Y.Z && git push -u origin release/vX.Y.Z
fi

# 2. PR: feature → release（CI + code-review）

# 3. 预发布检查（执行前必须完成）
git checkout release/vX.Y.Z && git pull  # 先同步远端，确保本地是最新版本
git log main..release/vX.Y.Z --oneline  # 展示已合入的 commit 清单
# 向用户展示清单，PR 状态（CI/review）在 GitHub 网页确认
# 用户确认后才继续

# 4. PR: release → main（CI + CodeRabbit，网页合并）
```

**发布后步骤**（PR 合并后必须执行，不需要用户指示）：

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`
4. `git push origin --delete release/vX.Y.Z`
5. 如有后续功能待发布：`git checkout main && git checkout -b release/v<next-version> && git push -u origin release/v<next-version>`（执行前确认完整版本号）

### hotfix 流程

**准备阶段**：

```bash
git checkout main && git pull
git checkout -b hotfix/xxx
# 修复 + 提交 + push
git push -u origin hotfix/xxx
# 开 PR: hotfix/xxx → main（快速 review，网页合并）
```

**发布后步骤**（PR 合并后必须执行，不需要用户指示）：

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`

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
