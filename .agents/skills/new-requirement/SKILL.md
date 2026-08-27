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

**L1**：
1. **写文件**：按模板生成 spec 文件到 `docs/specs/active/<name>-L1.md`（必须落盘，禁止仅内联展示）
2. 用户确认 spec
3. 直接改代码
4. 归档（移到 `docs/specs/completed/YYYY-MM-DD-<name>-L1.md`）

**L2**：
1. **写文件**：按模板生成 spec 文件到 `docs/specs/active/<name>.md`（必须落盘，禁止仅内联展示）
2. 用户确认 spec
3. **写文件**：按模板生成 exec-plan 到 `docs/exec-plans/active/<name>.md`
4. 用户确认 exec-plan
5. 执行（每步打勾）
6. 验收
7. 归档

**硬规则**：L1/L2 在 spec 文件落盘之前，禁止进入代码改动阶段。

模板见 `docs/specs/active/TEMPLATE-L2.md`、`docs/specs/active/TEMPLATE-L1.md`、`docs/exec-plans/active/TEMPLATE.md`。

### 5. 归档
验收通过后（用户明确说"验收通过"/"没问题"且 `npm run build:web` 通过）：
- 把 spec 内 `- [ ]` 替换为 `- [x]`
- 重命名并移到 `docs/specs/completed/YYYY-MM-DD-<name>.md`（exec-plan 同理）
- 汇报"已归档至 completed/"

**命名规范**：

| 类型 | 文件名 |
|------|--------|
| feature spec（含 L1）| `YYYY-MM-DD-feature-<kebab>.md` |
| exec-plan | 与对应 spec 同名，日期前缀一致 |
| 日期 | 用完成日（不是启动日），格式 `YYYY-MM-DD` |
| L0 | 不归档（无产物） |

例：`2026-08-25-feature-sidebar-conversation-history.md` 放在 `docs/specs/completed/` 下。

## 注意事项

- 不确定规模时默认 L2
- 修 bug 走 `create-bugfix` skill，不走本 skill
- 已有 spec 想要扩展不算"新需求"，直接修改现有 spec
