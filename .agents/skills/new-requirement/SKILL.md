---
name: new-requirement
description: 新需求启动 + 自动路由。当用户描述新功能、新需求、加个 xxx、帮我做 xxx、做 xxx 时触发。先按规模自动判断走 L0 小（≤1 文件 ≤10 行）→ 直接改；L1 中（≤3 文件 ≤50 行）→ 简化 spec；L2 大 → 完整 spec + exec-plan。给每个级别说判断依据，用户可推翻。改/修 bug/查问题等不属于"新需求"的动作不要触发此 skill。
---

# New Requirement — 需求路由

## 原则

- 需求规模决定流程，不一刀切走完整 spec
- 判断要给出**依据**（影响文件数、代码量），用户可调整
- L0/L1/L2 中，**L2 是默认**，模糊地带向上选（更严谨）

## 路由

| 级别 | 触发条件 | 处理 | 产物 |
|------|----------|------|------|
| L0 小 | ≤1 文件 & ≤10 行代码 | 直接改，无需 spec | 无 |
| L1 中 | ≤3 文件 或 ≤50 行 | 简化 spec | `docs/specs/active/<name>-L1.md` |
| L2 大 | >3 文件 或 >50 行 | 完整 spec + exec-plan | `docs/specs/active/<name>.md` + `docs/exec-plans/active/<name>.md` |

判断后说："判定 **L?**（依据：xxx），如不准请告诉我"。

## 步骤

### 1. 接收需求
读 `AGENTS.md` 确认规范已加载，识别是"新需求"（非修 bug/小改/查问题）。

### 2. 路由 + 判断
- 预估影响文件数、代码量
- 给出级别 + 依据
- 用户确认或调整

### 3. 需求澄清

**L0**：跳过，直接改。

**L1/L2**：在写 spec 之前，先和用户确认以下问题（按需选择，不要全问）：
- 功能边界：做到什么程度算完成？哪些明确不做？
- 关键设计决策：涉及技术选型、数据存储、交互方式等需要用户拍板的问题
- 参考/约束：是否有设计稿、竞品参考、技术限制？

澄清结果写入 spec 的"设计决策"章节。用户说"按你想的来"则 agent 自行决策并记录依据。

### 4. 按级别生成产物

**L0**：直接改代码 → 汇报改动 → 等确认。

**L1**：写简化 spec → 用户确认 → 直接改 → 归档（移到 `docs/specs/completed/YYYY-MM/`）。

**L2**：写完整 spec（含设计决策）→ 用户确认 → 写 exec-plan → 用户确认 → 执行（每步打勾）→ 验收 → 归档。

模板见 `docs/specs/active/TEMPLATE-L2.md`、`docs/specs/active/TEMPLATE-L1.md`、`docs/exec-plans/active/TEMPLATE.md`。

### 5. 归档
验收通过后（用户明确说"验收通过"/"没问题"且 `npm run build:web` 通过）：
- 把 spec 内 `- [ ]` 替换为 `- [x]`
- 移到 `docs/specs/completed/YYYY-MM/`（exec-plan 同理）
- 汇报"已归档至 YYYY-MM"

**命名规范**：

| 类型 | 文件名 |
|------|--------|
| feature spec（含 L1）| `feature-<kebab>.md` |
| exec-plan | 与对应 spec 同名 |
| 月份 | 用完成日（不是启动日） |
| L0 | 不归档（无产物） |

例：`feature-realtime-datetime.md` + `docs/specs/completed/2026-08/`。

## 注意事项

- 不确定规模时默认 L2
- 修 bug 走 `create-bugfix` skill，不走本 skill
- 已有 spec 想要扩展不算"新需求"，直接修改现有 spec
