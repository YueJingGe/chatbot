---
name: git-branch
description: 分支管理工作流（开分支/合并/发布/冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。commit message 走 git-commit skill；代码质量 review 走 code-review skill。
---

# Git Branch 工作流

## 分支模型

```
main                       ← 唯一真相源,受保护,打 SemVer tag
 │  ↑ release → main + tag,删旧 release
 │  ↑ hotfix → main + tag（紧急快车道）
 │  ↓ main → develop 单向同步
release/vX.Y.Z             ← 预发布,一次性,code-review 门禁
 │  ↑ feature PR（测过 + 人定这轮发哪些）
develop                    ← 集成沙箱,不作为发布源,可重建
 │  ↑ feature → develop（CI + 测试）
feature/* fix/*            ← 从 main 切,发布前不删
hotfix/*                   ← 从 main 切,紧急修复直达 main
```

| 分支 | 从哪切 | 去哪 | 门禁 |
|------|-------|------|------|
| `feature/*` | main | develop → release | CI + code-review |
| `fix/*` | main | develop → release | CI + code-review |
| `hotfix/*` | main | 直达 main + tag | CI + 快速 review |
| `release/vX.Y.Z` | main | main + tag | code-review 门禁 |

## 版本号（SemVer）

| commit 类型 | 版本变化 | 例 |
|------------|---------|-----|
| `fix` | PATCH +1 | v1.2.0 → v1.2.1 |
| `feat` | MINOR +1 | v1.2.0 → v1.3.0 |
| `feat!` / BREAKING | MAJOR +1 | v1.2.0 → v2.0.0 |

## 常规功能流程

```bash
# 1. 从 main 切分支
git checkout main && git pull
git checkout -b feature/xxx

# 2. 开发 + 提交（走 git-commit skill）

# 3. 推送 + 合 develop 测试（PR）
git push -u origin feature/xxx
# 开 PR: feature/xxx → develop

# 4. 测过后开 PR: feature/xxx → release/vX.Y.Z（code-review 门禁）
# 由人决定这轮发哪些 feature

# 5. release → main + 打 tag（人确认）
# 6. main → develop 同步
```

## 发布流程

```bash
# 从 main 切 release
git checkout main && git pull
git checkout -b release/v1.3.0

# ready 的 feature PR 合入 release（code-review 在此）
# 静置测试后：
git checkout main && git merge release/v1.3.0 --no-ff
git tag v1.3.0
git push origin main --tags

# 同步回 develop
git checkout develop && git merge main
git push origin develop

# 删旧 release
git branch -d release/v1.3.0
git push origin --delete release/v1.3.0
```

## 紧急 hotfix

```bash
# 从 main 切，修复直达 main
git checkout main && git pull
git checkout -b hotfix/xxx
# 修复 + 提交
git push -u origin hotfix/xxx
# 开 PR: hotfix/xxx → main（快速 review），合并 + 打 PATCH tag
# 同步回 develop
```

## rebase 规则

feature 落后 main 时,用 **rebase**（保持线性历史），不用 merge：

```bash
git checkout feature/xxx
git rebase main   # 不要 git merge main
```

## 冲突分级处理

| 冲突类型 | 处理方 | 做法 |
|---------|-------|------|
| `package-lock.json` | AI | 删掉重跑 `npm install` |
| `.claude/skills/`、`.cursorignore` 等同步产物 | AI | 重跑 `npm run sync:agents` |
| 不同文件的改动 | Git 自动 | 无需干预 |
| 同文件不同区域 | AI | 保留双方 |
| **同一函数双方都改** | **人** | AI 停下，列出双方意图，等人决策 |
| **语义冲突**（无文本冲突但逻辑打架） | **人** | AI 只提示风险，不自作主张 |

## develop 维护

- feature 分支在正式发布前**不删**（它是真相源）
- 退出某功能：`git revert -m 1 <merge-commit>`（可逆）
- develop 太乱：从 main 重建，re-merge 要留的 feature

## 多 agent 并行（worktree）

多个 agent 同时开发时，用 worktree 物理隔离：

```bash
git worktree add ../chatbot-featA -b feature/a main
cd ../chatbot-featA && npm install   # 每个 worktree 独立装依赖
```

每个 agent 一个独立目录 + 独立分支，互不干扰，完成后各自开 PR。

## 约束

- AI **不能**直接 push `main` / `release/*`（pre-push 拦截 + GitHub 保护）
- AI **不能**自主合并 PR（人审是硬门槛）
- 合到 release 的功能选择、release → main 由**人决定**
- AI 可以：开分支、commit、push feature/fix/hotfix 分支、开 PR、修 CI 报错
