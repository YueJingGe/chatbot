# 完成事项

背景：

当前项目 Git 工作流已具备分支保护与自动 rebase 能力，但缺少对核心模块变更的轻量治理手段。随着 web/src/hooks/、web/src/types/、server/ 等核心路径承载的契约越来越多，希望引入一套低成本、可渐进增强的提交前治理机制：

- 改动核心路径时，作者需显式记录变更理由（Ledger）。
- 提供轻量/严格双模式，默认不阻塞快速迭代，严格模式可用于发布前或核心重构。
- 对复杂度敏感文件（如状态管理、协议层、API 契约）自动识别并提升检查强度。
- 首次 push 时交互式询问是否启用严格模式，并持久化到本地 git config。

## 引入轻量级的 Ledger 理念

ledger 本质是让作者显式说明“为什么必须加这段代码”。

🌈：尤其是对于项目的核心数据流和 API 契约，改动时如果随手记一笔，后续 review 和回溯会轻松很多

### 引入 LEDGER.md

在 docs/ 下加一个 LEDGER.md 模板，在 .agents/skills/git-commit/SKILL.md 里提醒：改动核心文件时顺手更新 ledger

### 引入双模式检查

背景：当前 npm run check:all 已经比较重：Prettier + ESLint + Stylelint + Build。

借鉴的 lightweight/strict 思路：

- 默认模式：pre-commit / pre-push 只做基础检查（lint-staged + 分支保护）
- 严格模式：CHATBOT_STRICT=1 或 git config --local chatbot.strict 1 时跑完整 check:all

🌈：快速迭代时不卡人，正式发布前强制完整检查。

### 关键路径分组 + 友好提示

不是所有文件都卡，只有状态逻辑、类型契约、API 契约、写作规范、架构规则等关键路径变更时，`pre-push` 给出提示而非阻塞

```
⚠️ 本次改动涉及核心 hooks / API 契约。
   如属于重要变更，请在 LEDGER.md 中记录变更理由。
   继续 push 请执行：git push
```
