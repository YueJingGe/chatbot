# 完成事项

## 分支发布相关的 harness 设计场景总览

### 场景 1：feature/fix 分支推送到远程（`git push origin feature/xxx`） —— 直接推送

**流程：**

1. `pre-push` hook 自动触发，检测当前分支是否为 `feature/*` 或 `fix/*`
2. 自动 `fetch origin main`，检查当前分支是否已包含 main 的所有 commit
3. **若已同步** → 放行，正常 push
4. **若未同步** → 自动执行 `git rebase origin/main`，然后**拒绝本次 push**，提示用户重新执行推送命令
5. rebase 后的推送策略：远端分支已存在 → `git push --force-with-lease`；远端不存在 → `git push -u origin`
6. push 成功后，`pre-commit` hook 自动跑 `lint-staged` 代码质量检查

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push) 实现了自动同步机制，[git-commit SKILL.md](../.agents/skills/git-commit/SKILL.md) 覆盖了 rebase 后的推送指引。

---

### 场景 2：feature/fix 分支 到 develop（集成测试）—— 直接合并推送

**流程：**

1. 在 GitHub 网页创建 PR：`feature/xxx → develop` ⚠️**需要手动创建，AI不会自动创建**
2. CI 自动运行 + CodeRabbit 自动审查
3. 测试通过后合并 ⚠️**需要手动合并，AI不会自动合并**

**harness 支持度：** 有规范但较薄。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L36-L37) 提到"开 PR: feature/xxx → develop（CI + 测试）"，但没有详细的执行步骤。develop 作为集成沙箱，`pre-push` hook **不拦截** develop 分支的直推（设计上允许快速迭代）。

---

### 场景 3：feature/fix 分支 到 release/vX.Y.Z（发布门禁）—— 拦截，提示走 PR

**流程：**

1. 在 GitHub 网页创建 PR：`feature/xxx → release/vX.Y.Z` ⚠️**需要手动创建，AI不会自动创建**
2. CI 运行 + code-review 门禁（CodeRabbit 审查）
3. review 通过后，网页合并 ⚠️**需要手动合并，AI不会自动合并**
4. **选择哪些 feature 进 release 由人决定**，AI 不自主合并

**harness 支持度：** 完整覆盖。[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L23-L27) 定义了路径规则，[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L69) 有 PR 操作规则（必须提供 PR 标题和描述）。

---

### 场景 4：release/vX.Y.Z 分支推送到远程 —— 拦截，提示走 PR

**流程：**

1. `pre-push` hook 检测目标分支是否为 `release/*`
2. **创建分支**（remote OID 全 0）→ 放行
3. **删除分支**（local OID 全 0）→ 放行
4. **直接推提交到已有 release 分支** → 拦截，提示走 PR

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push#L15-L21) 精确区分了创建/删除/推提交三种操作。

---

### 场景 5：release → main 发布（正式发版） —— 拦截，提示走 PR

**流程：**

1. 预发布检查：`git checkout release/vX.Y.Z && git pull --ff-only`（快进同步，分叉则停止）
2. 展示 commit 清单：`git log main..release/vX.Y.Z --oneline`
3. 展示各 PR 状态（CI 是否通过、review 是否完成）
4. **用户确认后才继续**
5. 在 GitHub 网页创建 PR：`release/vX.Y.Z → main` ⚠️**需要手动创建，AI不会自动创建**
6. CI + CodeRabbit 审查
7. 网页合并 ⚠️**需要手动合并，AI不会自动合并**

**发布后步骤（自动执行，不需用户指示）：**

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`
4. `git push origin --delete release/vX.Y.Z`
5. 如有后续功能：从 main 切出新 release 分支

**harness 支持度：** 完整覆盖。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L52-L86) 有完整的 release 流程和发布后步骤，[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L35-L50) 有预发布规则和发布后步骤。

---

### 情况 6：hotfix → main（紧急修复快车道）

**流程：**

1. `git checkout main && git pull`
2. `git checkout -b hotfix/xxx`
3. 修复 + 提交 + push（push 时 pre-push hook 自动同步 main）
4. 在 GitHub 网页创建 PR：`hotfix/xxx → main`（快速 review）
5. 网页合并

**发布后步骤（自动执行）：**

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`

**harness 支持度：** 完整覆盖。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L88-L104) 有完整 hotfix 流程。

---

### 情况 7：直接 push 到 main

**流程：**

1. `pre-push` hook 拦截 → 完全禁止，提示走 PR 流程

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push#L11-L13) 硬拦截 + GitHub ruleset 双重保护。

---

### 情况 8：feature/fix 直接 PR 到 main（绕过 release）

**规范：** 禁止。必须经 release 或 hotfix 路径。

**harness 支持度：** 规范层完整覆盖（[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L32) 明确禁止），但 **本地 hook 不拦截**——这个约束依赖 GitHub ruleset 和 AI 行为规则来保证。

---

### 情况 9：develop → main

**规范：** 任何情况下都禁止，PR 也不行。

**harness 支持度：** 同上，规范层禁止，本地 hook 不拦截 develop 分支的 push。

---

### 情况 10：任务开始前在 main/release 分支上

**流程：**

1. AGENTS.md Default Protocol 要求：`git rev-parse --abbrev-ref HEAD` 确认分支
2. 若在 main / release/* → 按 git-branch SKILL 切到 feature 分支再开发

**harness 支持度：** 完整覆盖。[AGENTS.md](../AGENTS.md#L52) 有明确的动作触发规则。

---

### 情况 11：分支切换 / 合并后

**流程：**

1. `post-checkout` hook 触发 → `npm run sync:agents`
2. `post-merge` hook 触发 → `npm run sync:agents`
3. 自动同步 `.agents/` 到 `.claude/` 等副本

**harness 支持度：** 完整覆盖。[post-checkout](../.husky/post-checkout) 和 [post-merge](../.husky/post-merge) 都配了自动同步。

---

### 情况 12：冲突处理

**分级策略：**

|冲突类型|处理方|harness 支持|
|-|-|-|
|`package-lock.json`|AI 删掉重跑 `npm install`|有|
|同步产物（`.claude/skills/` 等）|AI 重跑 `npm run sync:agents`|有|
|不同文件的改动|Git 自动|无需干预|
|同文件不同区域|AI 保留双方|有|
|**同一函数双方都改**|**人决策**|有（AI 停下等人）|
|**语义冲突**|**人决策**|有（AI 只提示风险）|

**harness 支持度：** 完整覆盖。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L113-L122) 有冲突分级表。

---

## 整体评估

**覆盖度：** 12 个场景全部有文档覆盖，核心流程（feature → release → main、hotfix、禁止项、发布后步骤）都有完整的规范 + 执行指引。

**潜在薄弱点：**

1. **develop 分支无本地 hook 保护** — develop → main 的禁止只靠 GitHub ruleset 和 AI 行为规则，没有本地 pre-push 拦截。如果人直接操作 `git push origin develop` 然后网页合并到 main，本地不会拦。不过 develop 本身是沙箱，这个风险可控。

2. **feature/fix → main 的禁止无本地 hook** — 同上，依赖 GitHub ruleset。如果 GitHub ruleset 没配好，本地不会拦。

3. **feature → develop PR 的流程较薄** — 只有一行描述，没有像 release 流程那样有详细的预检查步骤。不过 develop 是沙箱，不需要那么严格的门禁也合理。

4. **多 agent 并行（worktree）** — [git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L128-L135) 有基本指引，但没有说明 worktree 场景下的 pre-push hook 行为、sync:agents 是否会冲突等细节。
