---
name: git-commit
description: Git 提交工作流（commit message 格式 + 本地 commit）。commit 前和 push 前均需用户显式确认；推送走 git-branch skill 的 push 段；代码质量 review 走 code-review skill；工具检查由 husky pre-commit 钩子自动跑。
---

# Git Commit 工作流

## 触发
用户要求提交代码、git commit、提交、commit等。

## 流程

1. 跑 `npm run check:all`（含 build）
2. 如失败：用 `npm run format` / `npm run lint` / `npm run stylelint` 修复后重跑
3. 如改动涉及核心路径（`web/src/hooks/`、`web/src/types/`、`server/`、`.agents/`、`docs/harness/`），提醒用户检查或填写 `docs/ledger/CORE-LEDGER.md`
4. 展示当前 `git status --short` 与变更摘要
5. **第一次确认**：询问用户"是否提交？"，等待明确回复（如"是"/"提交"/"yes"）
6. 用户确认后执行：`git add -A && git commit -m "<type>(<scope>): <中文描述>"`
7. 汇报 commit hash、message、当前分支
8. **第二次确认**：询问用户"是否推送？"，等待明确回复
9. 用户确认后，执行 `git-branch` skill 的 push 段（检查落后 → 确定目标分支 → push）

> 工具检查（lint-staged）由 husky pre-commit 钩子兜底。
> 任何一步用户未确认或回复"否"/"不"，则停止，不继续后续动作。

## commit message 格式

`<type>(<scope>): <中文描述>`

|type|含义|scope|
|-|-|-|
|`feat`|新功能|`frontend`（web/）、`backend`（server/）、`docs`（docs/）|
|`fix`|修复 bug|同 feat|
|`docs`|仅文档|可省略|
|`refactor`|代码重构|可省略|
|`style`|代码格式|可省略|
|`perf`|性能优化|可省略|
|`test`|测试相关|可省略|
|`chore`|构建/依赖/辅助工具|可省略|
|`ci`|CI 相关|可省略|

**示例**：`feat(frontend): 添加消息列表自动滚动到底部`

## 特殊情况

- 多类型：用主类型，不拆分
- 用户指定分支：按指示
- 无变更：提示用户无变更可提交
- 用户未确认提交或推送：停止并说明原因

## 汇报内容

- commit hash、message、当前分支
- 是否已推送、目标分支
