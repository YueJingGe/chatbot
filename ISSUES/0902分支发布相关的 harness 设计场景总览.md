# 完成事项

## 分支发布相关的 harness 设计场景总览

### 场景 1：feature/fix 分支推送到远程（`git push origin feature/xxx`） —— 直接推送

**流程：**

1. `pre-push` hook 自动触发，检测当前分支是否为 `feature/*` 或 `fix/*`
2. 自动 `fetch origin main`，检查当前分支是否已包含 main 的所有 commit
3. **若已同步** → 放行，正常 push
4. **若未同步** → 自动执行 `git rebase origin/main`，然后**拒绝本次 push**，提示用户重新执行推送命令
5. rebase 后的推送策略：远端分支已存在 → `git push --force-with-lease`；远端不存在 → `git push -u origin`
6. `pre-commit` hook 在 commit 时自动跑 `lint-staged` 代码质量检查

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push) 实现了自动同步机制，[git-commit SKILL.md](../.agents/skills/git-commit/SKILL.md) 覆盖了 commit + push 全流程。

---

### 场景 2：feature/fix 分支 到 develop（集成测试）—— 直接合并推送

**流程：**

1. 在 GitHub 网页创建 PR：`feature/xxx → develop` ⚠️需要手动创建，AI不会自动创建
2. CI 自动运行 + CodeRabbit 自动审查
3. 测试通过后合并 ⚠️需要手动合并，AI不会自动合并

**harness 支持度：** 有规范但较薄。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L36-L49) 提到"开 PR: feature/xxx → develop（CI + 测试）"，但没有详细的执行步骤。develop 作为集成沙箱，`pre-push` hook **不拦截** develop 分支的直推（设计上允许快速迭代）。

---

### 场景 3：feature/fix 分支 到 release/vX.Y.Z（发布门禁）—— 拦截，提示走 PR

**流程：**

1. 在 GitHub 网页创建 PR：`feature/xxx → release/vX.Y.Z` ⚠️需要手动创建，AI不会自动创建
2. CI 运行 + code-review 门禁（CodeRabbit 审查）
3. review 通过后，网页合并 ⚠️需要手动合并，AI不会自动合并
4. **选择哪些 feature 进 release 由人决定**，AI 不自主合并

**harness 支持度：** 完整覆盖。[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L23-L27) 定义了路径规则，[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L36-L49) 有 PR 操作规则（必须提供 PR 标题和描述）。

---

### 场景 4：release/vX.Y.Z 分支推送到远程 —— 拦截，提示走 PR

**流程：**

1. `pre-push` hook 检测目标分支是否为 `release/*`
2. **创建分支**（remote OID 全 0）→ 放行
3. **删除分支**（local OID 全 0）→ 放行
4. **直接推提交到已有 release 分支** → 拦截，提示走 PR

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push#L19-L25) 精确区分了创建/删除/推提交三种操作。

---

### 场景 5：release → main 发布（正式发版） —— 拦截，提示走 PR

**流程：**

1. 预发布检查：`git checkout release/vX.Y.Z && git pull --ff-only`（快进同步，分叉则停止）
2. 展示 commit 清单：`git log main..release/vX.Y.Z --oneline`
3. 展示各 PR 状态（CI 是否通过、review 是否完成）
4. **用户确认后才继续**
5. 在 GitHub 网页创建 PR：`release/vX.Y.Z → main` ⚠️需要手动创建，AI不会自动创建
6. CI + CodeRabbit 审查
7. 网页合并 ⚠️需要手动合并，AI不会自动合并

**发布后步骤（告知用户后面步骤，用户确认后开始执行）：**

```bash
git checkout main && git pull # 1. 更新本地 main 保持和远程一致
git tag vX.Y.Z && git push origin vX.Y.Z # 2. 打tag
git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop # 3. 确保 develop 同步 main 代码
git push origin --delete release/vX.Y.Z # 4. 删除 release 分支
# 5. 如有后续功能待发布（执行前确认完整版本号）：从 main 切出新 release 分支
```

**harness 支持度：** 完整覆盖。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L108-L142) 有完整的 release 流程和发布后步骤，[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L35-L50) 有预发布规则和发布后步骤。

---

### 场景 6：hotfix → main（紧急修复快车道）

**前置判断：**

用户说「发布/上线/发版」时，先判断是否紧急：

- 紧急 → hotfix 流程（直达 main）
- 非紧急 → release 流程
- 不确定就问用户

**流程：**

1. `git checkout main && git pull`
2. `git checkout -b hotfix/xxx`
3. 修复 + 提交 + push（push 时 pre-push hook 自动同步 main）
4. 在 GitHub 网页创建 PR：`hotfix/xxx → main`（快速 review） ⚠️需要手动创建，AI不会自动创建
5. 网页合并 ⚠️需要手动合并，AI不会自动合并

**发布后步骤（告知用户后面步骤，用户确认后开始执行）：**

1. `git checkout main && git pull`
2. `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`

**harness 支持度：** 完整覆盖。[git-branch SKILL.md](../.agents/skills/git-branch/SKILL.md#L144-L154) 有完整 hotfix 流程。

---

### 场景 7：直接 push 到 main —— 拦截，提示走 PR

**流程：**

1. `pre-push` hook 拦截 → 完全禁止，提示走 PR 流程

**harness 支持度：** 完整覆盖。[pre-push](../.husky/pre-push#L12-L17) 硬拦截（错误信息列出两条合法路径 + 显式标注 develop → main 也禁止） + GitHub ruleset 双重保护。

---

### 场景 8：feature/fix 直接 PR 到 main（绕过 release） —— 拦截，提示走 PR

**规范：** 禁止。必须经 release 或 hotfix 路径。

**harness 支持度：** 本地 hook 拦截所有对 main 的直接 push（不管当前在哪个分支）；但 **PR 合并**是 GitHub 服务器端操作，不走本地 hook，需依赖 GitHub ruleset（要求 PR 审查）来保证 feature/fix 不能绕过 release/hotfix 路径直接合入 main。

---

### 场景 9：develop → main —— 禁止

**规范：** 任何情况下都禁止，PR 也不行。

**harness 支持度：** 本地 hook 拦截所有对 main 的直接 push（包括从 develop 执行 `git push origin main`）；但 **PR 合入 main** 是 GitHub 服务器端操作，需依赖 GitHub ruleset 来阻止 develop → main 的 PR。

---

### 场景 10：任务开始前在 main/release 分支上

**流程：**

1. AGENTS.md Default Protocol 要求：`git rev-parse --abbrev-ref HEAD` 确认分支
2. 若在 main / release/* → 按 git-branch SKILL 切到 feature 分支再开发

**harness 支持度：** 完整覆盖。[AGENTS.md](../AGENTS.md#L52) 有明确的动作触发规则。

---

### 场景 11：分支切换 / 合并后

**流程：**

1. `post-checkout` hook 触发 → `npm run sync:agents`
2. `post-merge` hook 触发 → `npm run sync:agents`
3. 自动同步 `.agents/` 到 `.claude/` 等副本

**harness 支持度：** 完整覆盖。[post-checkout](../.husky/post-checkout) 和 [post-merge](../.husky/post-merge) 都配了自动同步。

---

### 场景 12：冲突处理

**分级策略：**

|冲突类型|处理方|harness 支持|
|-|-|-|
|`package-lock.json`|AI 删掉重跑 `npm install`|有|
|同步产物（`.claude/skills/` 等）|AI 重跑 `npm run sync:agents`|有|
|不同文件的改动|Git 自动|无需干预|
|同文件不同区域|AI 保留双方|有|
|**同一函数双方都改**|**人决策**|有（AI 停下等人）|
|**语义冲突**|**人决策**|有（AI 只提示风险）|

**harness 支持度：** 完整覆盖。[docs/harness/git-workflow.md](../docs/harness/git-workflow.md#L84-L93) 有冲突分级表。

---
