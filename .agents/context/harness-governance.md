# Harness Modification Protocol

改 harness 自身（AGENTS.md、`.agents/`、`docs/harness/`）时，遵循本协议。

## 何时适用

- `AGENTS.md` 的 Guardrails 或 Default Protocol
- `.agents/skills/*`（新增/删除/重命名/改内容）
- `.agents/context/*`（含本文件）
- `.agents/ignore`
- `docs/harness/*`
- `package.json` 的 harness script
- `.husky/*`

**不适用**（日常开发可自行改）：

- `web/src/**` 或 `server/**`（业务代码）
- `docs/specs/` 或 `docs/exec-plans/`
- `README.md`
- 测试用例

## 改之前

1. **说清楚要改什么** — 哪个文件、哪一段、为什么
2. **列出可能影响** — 哪些 skill/context/AGENTS.md 协议会变；sync 后哪些 AI 工具会变
3. **确认范围** — 用户明确要求才改；agent 自己提的改动走二击原则（同一问题第二次出现才提）
4. **拒绝诱惑** — 不顺手「改进」周边代码、不删看似无用但用户可能想要的内容

## 改之后

1. `npm run check:all` — 静态检查
2. `npm run sync:agents` — 同步 `.agents/ignore` 和 `.agents/skills/` 到 `.claude/` 等副本（注：`.agents/context/` 不在 sync 范围内，需手动分发）
3. **meta-验证** — 用一个真 prompt 验证规则真的被触发（不验证 = 实施失败）
4. 改完告诉用户改了什么、为什么

## 原则

- **最小改动**：只改该改的，不扩展
- **显式假设**：不确定就问，不静默选
- **可验证**：每条规则都要有办法验证它生效
- **可回滚**：5 分钟内能 revert

## Anti-pattern

- ❌ 删 Commands/sections 因为「觉得没用」— 用户加的有原因
- ❌ 改 AGENTS.md 改字面表述当「优化」— 字面变含义可能变
- ❌ 加规则「以防万一」— 每条规则都有认知成本
- ❌ 改完不跑 sync:agents — `.claude/` 等副本会与 `.agents/` 漂移
- ❌ 改完不 meta-验证 — `check:all` 通过 ≠ 规则真的被触发

## 设计约束

### AGENTS.md 行数硬上限

**60 行**。超过即违反 harness 设计。任何 ≥ 3 步的规则必须外移到 `.agents/skills/` 或 `.agents/context/`。每加一条 Protocol 规则自检：

> 这能压成 1 行吗？压不成 → 外移。

### 文件职责

|文件|职责|不放什么|
|-|-|-|
|`README.md`|给人和 AI 共读的入口|详细规范|
|`AGENTS.md`|给 AI 的导航入口（< 60 行）|细节正文|
|`.agents/context/`|稳定事实：技术栈、架构、工作流|任务 workflow|
|`.agents/skills/`|任务 workflow（按需触发）|稳定事实|
|`docs/harness/`|前后端架构规范|AI 入口|
|`docs/reference/`|写法参考：命名 / markdown / css|架构规范|
|`docs/specs/` / `docs/exec-plans/`|需求规格 / 执行计划|规范正文|

## 规则演进

- **二击原则**（Anthropic 官方建议）：同一错误出现第二次才写规则。第一次出现记入 session 笔记，第二次出现提升为正式规则
- **季度审查**：每季度过一遍 AGENTS.md，删除过时规则、合并重复规则
- **失效规则**：标 `dormant` 状态（未来可能恢复）而非直接删除

## 协议本身

本文件是 harness 的「karpathy-guidelines」。**修改本文件也要走上面流程**（鸡生蛋除外——首次创建 HCR 协议本身是 bootstrap 例外）。

---

**This file works if**: agent 改 harness 前会先想「该不该改 / 怎么改 / 改完怎么验证」。
