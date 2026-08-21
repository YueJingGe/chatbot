# Git 分支模型（参考事实）

> 分支结构、版本号规则的稳定事实。**怎么操作**见 `.agents/skills/git-branch/SKILL.md`。

## 分支模型

```text
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

|分支|从哪切|去哪|门禁|
|-|-|-|-|
|`feature/*`|main|develop → release|CI + code-review|
|`fix/*`|main|develop → release|CI + code-review|
|`hotfix/*`|main|直达 main + tag|CI + 快速 review|
|`release/vX.Y.Z`|main|main + tag|code-review 门禁|

## 版本号（SemVer）

|commit 类型|版本变化|例|
|-|-|-|
|`fix`|PATCH +1|v1.2.0 → v1.2.1|
|`feat`|MINOR +1|v1.2.0 → v1.3.0|
|`feat!` / BREAKING|MAJOR +1|v1.2.0 → v2.0.0|

## 关键约束

- main / release/* 受保护:pre-push 拦截 + GitHub ruleset,只能经 PR 进入
- AI 不自主合并 PR;合到 release 的功能选择、release → main 由人决定
- develop 是沙箱:feature 分支发布前不删(真相源),develop 可随时从 main 重建
- PR 自动审查由 CodeRabbit 承担(配置见 `.coderabbit.yaml`)
