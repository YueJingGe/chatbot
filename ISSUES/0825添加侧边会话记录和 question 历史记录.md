# 完成事项

## 开发新需求——添加侧边会话记录和 question 历史记录

## 完善、完整 harness

### 不要列举具体动词（场景化），要列举工件类别（artifact-based）

关键差异：

- ❌ 错误（场景化）："加功能/建组件/改行为/优化/调整/处理"（关键词枚举，永远列不全）
- ✅ 正确（工件类别）："对 UI 组件、Hook、状态管理、API 契约、数据流的改动"（工件类别，意图匹配）

或者用**决策树**：

```plaintext
改动会影响什么？
├── 用户可见的行为/视觉/交互 → 走 brainstorming
├── 数据流/接口契约/状态管理 → 走 brainstorming
├── 架构/模块边界/依赖关系 → 走 brainstorming
├── 重构（不改行为） → 走 karpathy-guidelines
├── 配置/构建/CI → 直接做
└── 修 bug（小范围） → 直接做
```

### 把视觉验证的 5 步流程外移为一个SKILL

`.agents/skills/frontend-visual-verification`

### 用协议规则原则验证 harness

`.agents/context/harness-governance.md`

补充了：Guardrails、Defaults

Markus Eisele 的模板把 AGENTS.md 分为 5 个 section：

```plaintext
Defaults    ← 基线行为（你缺这个）
Behavior    ← 工作方式（Protocol 部分覆盖）
Uncertainty ← 不确定性处理
Memory      ← 跨 session 记忆（你有 .agents/context）
Guardrails  ← 硬性红线（你缺这个）
```

## AI 的问题

### Scope Drift（范围漂移）

问题：agent 从"改布局"滑到了"改交互"

解决：在 AGENTS.md 的 Default Protocol 之前加一个 ## Guardrails section，只放 3 条硬性红线

```md
## Guardrails

- 只做用户明确要求的事。布局交互，样式≠逻辑，修 bug≠重构。
- 涉及"改行为/改交互/改架构"的改动，必须先走 brainstorming 再动手。
- 不确定时问用户，不要自行决定。
```

### 让 AI 做布局验证实在太费 token 了

AI 先是用 `Browser agent` ，截图超时了，然后用 `Playwright` 脚本截图验证

> 做一个响应式布局的验证一次对话要100多个token
