---
name: git-branch
description: 分支操作流程（开分支/合并/发布/解冲突/hotfix）。当用户说"开分支"、"新功能"、"合并"、"发布"、"解决冲突"、"hotfix"、"上线"时触发。**用户告知发布完成（如"已经发布到main了"、"发布完了"、"已发布"）时也触发——自动执行发布后步骤，不需要用户指示。** 分支规范见 docs/harness/git-workflow.md；commit message 走 git-commit skill。
---

# Git Branch 操作流程

> 执行之前先阅读 `docs/harness/git-workflow.md` 规范

## 红线（不可违反）
1. 不在 `main` / `release/*` 上直接 commit
2. 不 force-push，除非 `--force-with-lease`
3. 不修改发布分支历史（`pull --ff-only`，分叉则停止）
4. commit message 走 `git-commit` skill，不在本 skill 里写

## 通用规则

### 目标分支不明确时的处理（如"合并"、"合代码"、"push"）：

1. 获取所有远程分支：`git branch -r | grep -v 'HEAD' | sed 's|origin/||'`
2. 按类型分组展示给用户，**标注推荐项**（与本分支同名的远程分支），示例：
```
当前分支：xxx
请选择目标分支：
1. 推荐（与本分支同名远程分支）：xxx
2. xxx
...
```

### 关键信息缺失时追问

- 开分支但未提供分支名 → 询问分支名
- 发布但未提供版本号 → 询问版本号（或从分支名提取）
- 回滚但未指定范围 → 询问回滚范围

### 开 PR 

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

### 冲突处理

> 冲突分级规则见 `git-workflow.md` §9。


## 意图识别

将用户意图 + 当前分支名 + 目标分支 → 对照 `docs/harness/git-workflow.md` 第 2 节路径约束表查询：

| 匹配结果 | AI 行为 |
|---------|--------|
| **唯一匹配**（路径表中只有一条合法路径） | 直接执行，不问用户 |
| **多条匹配**（路径表中多条路径都符合） | 列出选项及后果，让用户选 |
| **无匹配**（路径表中无此路径） | 说明困惑点，请用户澄清 |
| **低置信度**（有猜测但不确定） | 说明猜测和依据，让用户确认或纠正 |
| **完成态告知**（"已发布"等） | 自动触发 `## 发布后步骤` 中对应流程的步骤，不需要用户指示 |


## 操作流程

### 开分支

```bash
git checkout main && git pull
git checkout -b <分支名>
```

> 分支名格式参考 `git-workflow.md` 中的分支命名规范

### commit

走 `git-commit` skill

### push

1. 检查当前分支是否落后 main，落后则 `git rebase main`（见 `git-workflow.md` §8），否则跳过。

2. push 之前确定目标分支，然后执行
```bash
git push -u origin <目标分支>
```

### 发布

执行前：

1. 读 `docs/harness/git-workflow.md` 确认路径约束。
2. 做发布路径判断
| 条件 | 路径 |
|------|------|
| 当前分支是 `hotfix/` 前缀 | 发布 hotfix 流程（直达 main） |
| 当前分支是 `feature/` 或 `fix/` 前缀 | 发布 release 流程 |
| 用户明确说了"hotfix"或"紧急修复" | 发布 hotfix 流程 |
| 当前分支是 `release/` 前缀，用户说"发布" | 将 release 分支发布到 main |

判断出来之后跟用户确认发布路径，用户确认通过后走相应的流程

### 发布 release 流程


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

### 发布 hotfix 流程

**准备阶段**：

```bash
git checkout main && git pull
git checkout -b hotfix/xxx
# 修复 + 提交 + push
git push -u origin hotfix/xxx
# 开 PR: hotfix/xxx → main（快速 review，网页合并）
```

### 将 release 分支发布到 main

> 触发条件：当前分支是 `release/vX.Y.Z`，用户说"发布"。

**执行步骤**：

1. 预发布检查：
```bash
git checkout release/vX.Y.Z && git pull --ff-only
git log main..release/vX.Y.Z --oneline  # 展示 commit 清单
```

2. 向用户展示 commit 清单，确认以下检查项（参照 `git-workflow.md` §4）：
   - 每个 feature PR 的 CI 状态（GitHub Actions 全绿）
   - CodeRabbit 审查结果均已解决或可忽略

3. 用户确认后，开 PR：`release/vX.Y.Z` → `main`（CI + CodeRabbit）
   - **PR 由用户在 GitHub 网页操作合并**，AI 不自动合并

4. 用户确认合并完成后，触发 `## 发布后步骤`

## 发布后步骤

> **触发时机**：PR 合并到 main 后自动执行，不需要用户指示。用户说"已经发布了"、"发布完了"、"已发布"等完成态表述时，立即告知用户将要执行以下步骤，用户确认后执行。

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`

如果是 release 分支发布，则额外执行：
4. `git push origin --delete release/vX.Y.Z`
5. 跟用户确认后续是否还有功能待发布，如确定有，则执行：
`git checkout main && git checkout -b release/v<next-version> && git push -u origin release/v<next-version>`（执行前确认完整版本号）
如没有，则跳过。

## 多 agent 并行（worktree）

> 核心原则、注意事项见 `git-workflow.md` §10-11。以下仅列操作命令。

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
