---
name: git-commit
description: Git 提交工作流（commit message 格式 + 本地 commit）。推送走 git-branch skill 的 push 段；代码质量 review 走 code-review skill；工具检查由 husky pre-commit 钩子自动跑。
---

# Git Commit 工作流

## 触发
用户要求提交代码、git commit，或完成任务后。

## 流程
1. 跑 `npm run check:all`（含 build）
2. 如失败：`npm run format` / `npm run lint` / `npm run stylelint` 修复后重跑
3. `git add -A && git commit -m "<type>(<scope>): <描述>"`
4. 完成后触发 `git-branch` skill 的 push 段（检查落后 → push）

> 工具检查（lint-staged）由 husky pre-commit 兜底。

## commit message 格式

`<type>(<scope>): <中文描述>`

|type|含义|scope|
|-|-|-|
|`feat`|新功能|`frontend`（web/）、`backend`（server/）、`docs`（docs/）|
|`fix`|修复 bug|同 feat|
|`docs`|仅文档|可省略|
|`refactor`|代码重构|可省略|
|`style`|代码格式|可省略|
|`chore`|构建/依赖|可省略|

**示例**：`feat(frontend): 添加消息列表自动滚动到底部`

## 特殊情况
- 多类型：用主类型，不拆分
- 用户指定分支：按指示
- 无变更：提示用户无变更可提交

## 汇报内容
- commit hash、message、当前分支
