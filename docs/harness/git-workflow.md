# Git 分支规范

> 分支模型、路径约束、发布规则。人和 AI 共读。
> AI 执行流程见 `.agents/skills/git-branch/SKILL.md`。

## 分支模型

```text
main                       ← 唯一真相源，受保护，打 SemVer tag
 │  ↑ release → main + tag
 │  ↑ hotfix → main + tag（紧急快车道）
 │  ↓ main → develop 单向同步
release/vX.Y.Z             ← 预发布，多 feature 合入，code-review 门禁
 │  ↑ feature/fix PR
develop                    ← 集成沙箱，不作为发布源
 │  ↑ feature/fix PR
feature/* fix/*            ← 从 main 切，发布前不删
hotfix/*                   ← 从 main 切，紧急修复直达 main
```

## 路径规则

|分支|从哪切|去哪|门禁|
|-|-|-|-|
|feature/fix|main|release|CI + code-review|
|release/vX.Y.Z|main|main + tag|code-review 门禁|
|hotfix|main|直达 main + tag|CI + 快速 review|

## 禁止项

- **develop → main 禁止**：develop 是集成沙箱，任何情况下都不能直接合入 main，PR 也不行
- **feature/fix → main 禁止**：必须经 release 或 hotfix 路径
- **AI 不自主合并 PR**：合入 release 的功能选择、release → main 由人决定

## release 预发布规则

- release 分支从 main 切出，可存在多个版本（release/v1.1.0、v1.2.0 并存）
- 多个 feature/fix 可合并到同一 release，统一发布
- 发布前必须检查：列举当前 release 上所有已合入的 feature 分支 + 各 PR 状态（CI 是否通过、review 是否完成）
- 用户确认后才可 PR: release → main

## 发布后步骤

release → main 合并后，按顺序执行：

1. 本地同步 main：`git checkout main && git pull`
2. 打 tag：`git tag vX.Y.Z && git push origin vX.Y.Z`（只推 tag）
3. 同步 develop：`git checkout develop && git pull --ff-only origin develop && git merge main && git push origin develop`
4. 清理当前 release：`git push origin --delete release/vX.Y.Z`
5. 新建下一 release（如有后续功能待发布）：从 main 切出新 release 分支

## SemVer 版本号

|commit 类型|版本变化|例|
|-|-|-|
|fix|PATCH +1|v1.2.0 → v1.2.1|
|feat|MINOR +1|v1.2.0 → v1.3.0|
|feat! / BREAKING|MAJOR +1|v1.2.0 → v2.0.0|

## 关键约束

- main / release/* 受保护：pre-push 拦截 + GitHub ruleset，只能经 PR 进入
- feature/fix push 时自动同步 main：pre-push hook 检测，未同步则自动 rebase 并拒绝本次 push（重新 push 即可）
- develop 是沙箱：feature 分支发布前不删（真相源），develop 可随时从 main 重建
- PR 自动审查由 CodeRabbit 承担（配置见 `.coderabbit.yaml`）
