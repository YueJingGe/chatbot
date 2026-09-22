---
name: git-commit
description: Git 提交工作流（commit message 格式 + 本地 commit）。commit 前须以交互式提问确认 message 与文件清单，push 前须再次确认；推送走 git-branch skill 的 push 段；代码质量 review 走 code-review skill；工具检查由 husky pre-commit 钩子自动跑。
---

# Git Commit 工作流

## 触发
用户要求提交代码、git commit、提交、commit等。

## 流程

1. 跑 `npm run check:all`（含 build）
2. 如失败：用 `npm run format` / `npm run lint` / `npm run stylelint` 修复后重跑
3. 如改动涉及核心路径（`web/src/hooks/`、`web/src/types/`、`server/`、`.agents/`、`docs/harness/`），提醒用户检查或填写 `docs/ledger/CORE-LEDGER.md`
4. 提交前核查：确认当前分支（`git rev-parse --abbrev-ref HEAD`），展示 `git status --short`（标注暂存/未暂存/未跟踪）与变更摘要；审查变更内容，发现疑似临时内容（临时注释、调试代码）或与本任务无关的改动时，先向用户指出并询问处理方式
5. 草拟 commit message：对照 `.commitlintrc.cjs` 的 type/scope 白名单选择，并说明选择依据
6. **message 确认（必做）**：展示「拟提交文件清单 + message 全文 + 依据说明」，以带选项的交互式提问请用户确认（支持提问面板的环境用面板，否则用编号选项）：A 按此提交 / B 修改（按补充意见重新草拟并再次确认）/ C 取消提交。发起提问后必须停下等待答复：用户给出的"提交/commit"指令只是流程入口，不代替本步骤的确认。
7. 用户确认后，按确认的文件范围执行 `git add`（默认 `git add -A`；用户要求排除部分文件时用显式路径），再执行 `git commit -m "<type>(<scope>): <中文描述>"`
8. 汇报 commit hash、message、当前分支
9. **推送确认**：询问用户"是否推送？"，等待明确回复
10. 用户确认后，执行 `git-branch` skill 的 push 段（检查落后 → 确定目标分支 → push）

> 工具检查（lint-staged）由 husky pre-commit 钩子兜底。
> 任何一步用户未确认或回复"否"/"不"，则停止，不继续后续动作。
> 步骤 6 的 message 确认未通过前，不得执行 commit；反例：收到"提交"后直接列出文件与 message 并 commit（未做交互式确认）。

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
