# Git 分支规范

> 本文件定义分支模型、路径约束、发布规则及禁止项。AI 执行流程见 `.agents/skills/git-branch/SKILL.md`。

## 1. 分支模型

```text
main                       ← 唯一真相源，受保护，打 SemVer tag
 │  ↑ release → main + tag（发布门禁）
 │  ↑ hotfix → main + tag（紧急快车道）
 │  ↓ main → develop 单向同步（仅通过 merge 从 main 到 develop）
release/vX.Y.Z             ← 预发布，多开发分支合入，code-review 门禁
 │  ↑ feature/fix PR       ← CI + review 通过后可合入
develop                    ← 集成沙箱，不作为发布源
 │  ↑ feature/fix PR
feature/* fix/*            ← 从 main 切，功能完成后先合入 release（不直接合 main）
hotfix/*                   ← 从 main 切，紧急修复，绕过 release，直达 main
```

## 2. 路径约束（准入/准出）

|分支类型|从哪切|可合入目标|必需门禁|
|-|-|-|-|
|`feature/*`|`main`|`release/*`|CI 全绿 + CodeRabbit 无阻断|
|`fix/*`|`main`|`release/*`|CI 全绿 + CodeRabbit 无阻断|
|`release/v*`|`main`|`main`|CI 全绿 + CodeRabbit + 人工审批|
|`hotfix/*`|`main`|`main`|CI 全绿 + 快速 review（可跳过部分）|
|`develop`|`main`|（仅接受 merge）|无门禁，仅为集成测试沙箱|

**禁止项：**

- 禁止 `develop` → `main`：任何情况下都不能直接合入 main，PR 也不行
- 禁止 `feature/*` → `main`（必须经 `release` 或 `hotfix` 路径）
- 禁止 AI 自主执行 `release/*` → `main` 的合并操作

## 3. 版本号与 Tag 规则

- 遵循 **SemVer 2.0.0**：
  - `fix` → PATCH（+1）
  - `feat` → MINOR（+1）
  - `feat!` / `BREAKING CHANGE` → MAJOR（+1）
- Tag 命名：`vX.Y.Z`，仅打在 `main` 上。
- 每个 Tag 必须关联一个 `release/*` 或 `hotfix/*` 的合并提交。

## 4. 发布 main 前检查清单（强制人工确认）

在 `release/*` → `main` 的 PR 合并前，必须：

- [ ] 列出此 release 包含的所有 feature/fix 分支（`git log main..release/vX.Y.Z --oneline`）
- [ ] 确认每个 feature PR 的 CI 状态（GitHub Actions 全绿）
- [ ] 确认 CodeRabbit 审查结果均为“已解决”或“可忽略”
- [ ] 确认测试环境（staging）已部署并通过冒烟测试

## 5. 发布 main 后同步规范（不可逆）

`release/*` 或 `hotfix/*` 合入 `main` 后，**必须按顺序**执行：

1. 本地同步 main：`git checkout main && git pull`
2. 打 tag：`git tag vX.Y.Z && git push origin vX.Y.Z`（只推 tag）
3. 同步 develop：`git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`
4. 询问是否清理当前 release：若是，则`git push origin --delete release/vX.Y.Z`，如不是，则跳过此步骤。
5. 询问是否需要新建一个 release 分支：若有，则从当前 `main` 下新建一个 `release/*` 分支（版本号由人确定）；若没有或暂不确定，则跳过此步骤。

> 若 `develop` 与 `main` 有冲突，须由人工解决（禁止 AI 自动合并）。

## 6. 异常场景处理原则

- **回滚发布**：若 Tag 后发现问题，删除 Tag + 回退 `main` 到上一 Tag，并重新开 `hotfix` 修复。
- **多 release 并行**：允许 `release/v1.1.0` 与 `release/v1.2.0` 并存，但每个 feature 只能属于一个 release。
- **紧急修复冲突**：hotfix 合并回 `develop` 时若冲突，按“先接受 main，再修复 develop 代码”的原则处理。

## 7. 分支命名规范

- `feature/<jira-id>-<short-desc>`，如 `feature/AB-123-login-improve`
- `fix/<jira-id>-<short-desc>`
- `hotfix/<jira-id>-<short-desc>`
- `release/v<major>.<minor>.<patch>`

## 8. 保护策略（GitHub Ruleset / pre-push hook）

- `main` 和 `release/*` 禁止直接 push，仅允许通过 PR 合入。
- `feature/*`、`fix/*`、`hotfix/*` push 前自动执行 `git rebase main`（hook 实现），若落后则拒绝 push，提示重新推送。

## 9. 冲突处理规则

|冲突类型|处理方|做法|
|-|-|-|
|`package-lock.json`|AI|删掉重跑 `npm install`|
|同步产物（`.claude/skills/`、`.cursorignore`）|AI|重跑 `npm run sync:agents`|
|不同文件的改动|Git 自动|无需干预|
|同文件不同区域|AI|保留双方|
|**同一函数双方都改**|**人**|AI 停下，列出双方意图，等人决策|
|**语义冲突**（无文本冲突但逻辑打架）|**人**|AI 只提示风险，不自作主张|

## 10. worktree 并行规范

- 一任务一 worktree：每个功能一个独立工作目录，不在同一目录切换分支
- 任务必须独立：不同 worktree 不应大量修改同一文件，否则合并时冲突无法自动解决
- 独立依赖：每个 worktree 有自己的 `node_modules`，需单独 `npm install`
- 独立端口：dev server 端口不能冲突（如 5173 / 5174 / 5175）
- 独立 review：每个 worktree 产出独立 diff，各自开 PR 各自审查

### 10.1 目录结构示例

```text
Desktop/ai/
├── chatbot/              ← 主仓库（main / develop）
├── chatbot-featA/        ← worktree：feature/a
├── chatbot-featB/        ← worktree：feature/b
└── chatbot-hotfix/       ← worktree：hotfix/xxx
```

## 11. 注意事项

|项目|说明|
|:-|:-|
|node_modules|不共享，每个 worktree 独立 `npm install`|
|端口冲突|主仓库用 5173/3000，其他 worktree 需改端口|
|内存占用|每个 worktree + dev server 约 500MB–1GB，建议不超过 3–4 个并行|
|.env|每个 worktree 独立，需各自配置|
|合并顺序|先合的 PR 可能影响后合的——后合的需 rebase main|
|清理|功能合并后及时 `git worktree remove`，避免目录堆积|

## 12. 职责划分总结

|内容|放在哪|
|-|-|
|路径约束表、分支命名、SemVer、保护策略|`git-workflow.md`（已有）|
|冲突处理规则（类型 → 处理方 → 做法）|`git-workflow.md`（**新增**）|
|worktree 核心原则|`git-workflow.md`（**新增**）|
|意图识别如何“查”路径表|`SKILL.md`|
|AI 遇到冲突时的交互方式|`SKILL.md`|
|worktree 操作命令|`SKILL.md`|
|发布后步骤的具体命令|`SKILL.md`|
