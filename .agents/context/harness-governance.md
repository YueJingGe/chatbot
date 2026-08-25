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
2. `npm run sync:agents` — 同步到 `.claude/` 等副本
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

## 协议本身

本文件是 harness 的「karpathy-guidelines」。**修改本文件也要走上面流程**（鸡生蛋除外——首次创建 HCR 协议本身是 bootstrap 例外）。

---

**This file works if**: agent 改 harness 前会先想「该不该改 / 怎么改 / 改完怎么验证」。
