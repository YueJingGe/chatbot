---
name: git-branch
description: 分支操作流程（开分支/合并/发布/解冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。**用户告知发布完成（如"已经发布到main了"、"发布完了"、"已发布"）时也触发——自动执行发布后步骤，不需要用户指示。** 分支规范见 docs/harness/git-workflow.md；commit message 走 git-commit skill。
---

# Git Branch 操作流程

> 分支规范见 `docs/harness/git-workflow.md`。本文件只讲 AI 怎么执行。

## 意图识别原则

执行分支操作前，先识别用户意图：
- **唯一匹配**：只有一条合法路径 → 说明理解，直接执行
- **多条匹配**：多条路径都合法 → 列出选项及各自后果，让用户选
- **无法匹配**：无法判断意图 → 说明困惑点，让用户澄清
- **低置信度**：有猜测但不确定 → 说明猜测和依据，让用户确认或纠正
- **完成态告知**：用户告知某阶段已完成（如"已经发布了"）→ 视为触发信号，自动执行该阶段的后续步骤，不需要用户指示

禁止在多条匹配或低置信度时自行选择。

## PR 操作规则

凡涉及用户开 PR 的步骤，必须同时提供：
- **PR 标题**：简洁描述改动范围
- **PR 描述**：基于 `git log` 生成的改动说明，按 PR 模板格式输出
- **索要 PR 链接**：提供标题和描述后，必须向用户索要 PR 链接（格式："PR 链接给我，我自己看 CodeRabbit 审查结果"）

禁止只说"去开 PR"而不给内容。

**PR 链接到手后的处理**：
1. 用 WebFetch 抓取 PR 页面，提取所有 CodeRabbit 审查意见
2. 逐条判断：真 bug / 文档一致性 / 边缘情况 / nitpick
3. 给出分类清单 + 修复建议（哪些修、哪些进 ISSUES、哪些拆 feature 分支）
4. 等用户确认后动手

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
# 1. 刷新远端引用，再检查 release 分支（避免本地 refs 过期误报）
if ! git fetch --prune origin; then
  echo "❌ 无法刷新远端引用，请检查网络连接后重试"
  exit 1
fi
existing_releases=$(git branch -r | grep 'origin/release/' | sed 's|.*origin/||')
if [ -n "$existing_releases" ]; then
  echo "已有 release 分支:"
  echo "$existing_releases"
  echo ""
  echo "选项 A：复用已有分支 → git checkout <目标分支> && git pull --ff-only"
  echo "选项 B：从 main 创建新版本 → git checkout main && git pull && git checkout -b release/v<新版本>"
  echo "请用户选择"
else
  echo "无 release 分支，从 main 新建"
  git checkout main && git pull
  git checkout -b release/vX.Y.Z && git push -u origin release/vX.Y.Z
fi

# 2. PR: feature → release（CI + code-review）

# 3. 预发布检查（执行前必须完成）
git checkout release/vX.Y.Z && git pull --ff-only  # 快进同步，分叉则停止（不应修改发布分支历史）
git log main..release/vX.Y.Z --oneline  # 展示已合入的 commit 清单
# 向用户展示清单，PR 状态（CI/review）在 GitHub 网页确认
# 用户确认后才继续

# 4. PR: release → main（CI + CodeRabbit，网页合并）
```

**发布后步骤**（PR 合并后必须执行，不需要用户指示。用户说"已经发布了"、"发布完了"等完成态表述时，立即告知用户将会执行以下步骤，用户确认完之后执行）：

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

**发布后步骤**（PR 合并后必须执行，不需要用户指示。用户说"已经发布了"、"发布完了"等完成态表述时，立即执行以下步骤）：

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

> 行业标准：每个 agent 一个 worktree（独立目录 + 独立分支），共享同一 `.git` 历史，互不干扰。
> 来源：Superset、Nx、Augment Code 等多 agent 工作流的通用实践。

### 核心原则

1. **一任务一 worktree**：每个 agent / 每个功能一个独立工作目录，不在同一目录切换分支
2. **任务必须独立**：不同 worktree 不应大量修改同一文件，否则合并时冲突无法自动解决
3. **独立依赖**：每个 worktree 有自己的 `node_modules`，需单独 `npm install`
4. **独立端口**：dev server 端口不能冲突（如 5173 / 5174 / 5175...）
5. **独立 review**：每个 worktree 产出独立 diff，各自开 PR 各自审查

### 目录结构

```text
Desktop/ai/
├── chatbot/              ← 主仓库（main / develop）
├── chatbot-featA/        ← worktree：feature/a
├── chatbot-featB/        ← worktree：feature/b
└── chatbot-hotfix/       ← worktree：hotfix/xxx
```

### 操作命令

```bash
# 创建 worktree（从 main 切出新分支）
git worktree add ../chatbot-featA -b feature/a main

# 初始化（每个 worktree 必须独立装依赖）
cd ../chatbot-featA && npm install

# 查看所有 worktree
git worktree list

# 删除 worktree（分支保留，只删工作目录）
git worktree remove ../chatbot-featA

# 清理已删除目录的 worktree 引用
git worktree prune
```

### 注意事项

| 项目 | 说明 |
|------|------|
| `node_modules` | 不共享，每个 worktree 独立 `npm install` |
| 端口冲突 | 主仓库用 5173/3000，其他 worktree 需改端口（`vite --port 5174`） |
| 内存占用 | 每个 worktree + dev server 约 500MB-1GB，建议不超过 3-4 个并行 |
| `.env` | 每个 worktree 独立，需各自配置 `server/.env` |
| Git hook | 共享 `.husky/`，hook 行为一致 |
| 合并顺序 | 先合的 PR 可能影响后合的——后合的需 rebase main |
| 清理 | 功能合并后及时 `git worktree remove`，避免目录堆积 |

### 本项目的 worktree 流程

```bash
# 1. 主仓库保持 main 分支
cd /Users/a211026/Desktop/ai/chatbot

# 2. 为每个功能创建 worktree
git worktree add ../chatbot-featA -b feature/a main
git worktree add ../chatbot-featB -b feature/b main

# 3. 各 worktree 独立工作
cd ../chatbot-featA
npm install
# 开发... → git add → git commit → git push -u origin feature/a
# 开 PR: feature/a → release/vX.Y.Z

# 4. 完成后清理
cd /Users/a211026/Desktop/ai/chatbot
git worktree remove ../chatbot-featA
```
