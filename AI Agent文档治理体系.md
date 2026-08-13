# 现在的文档结构

```
chatbot/
├── AGENTS.md                          ✅ 已经很完整（11 个章节）
├── .cursorrules                       ✅ Cursor 规则
├── .agents/
│   ├── context/                       ❌ 已清空（2026-08-13）
│   ├── skills/
│   │   ├── karpathy-guidelines/       ✅
│   │   ├── skill-creator/             ✅
│   │   └── create-agent-first-docs/   ✅
│   └── ignore                         ✅ 忽略配置
├── docs/                              ✅ 文档体系（唯一事实来源）
│   ├── reference/                     ✅ 完整规范
│   │   ├── coding.md                  ✅ 编码规范
│   │   └── naming.md                  ✅ 命名规范
│   ├── harness/                       ✅ 架构约束
│   ├── knowledge/                     ✅ 技术知识
│   ├── specs/                         ✅ 需求规格
│   └── exec-plans/                    ✅ 执行计划
└── ISSUES/                            ✅ 问题追踪
```

这套体系把谁读什么分得很清楚：

人类看 docs/reference/（完整、有背景、有示例）
AI 启动时加载 .agents/context/（精简、结构化、易解析）
AI 需要深入某个规范时，再按需读取 docs/reference/ 原文

# 创建一个 skill

```
我想要一个prompt或者skill给到cursor或者qoder或者其他代码agent，这个prompt或者skill来干什么呢，就是就是参考刚才分析千问的以及你调查市面上的通用的等结合，为任何一个新项目或者老项目设计一个让 AI Agent 高效理解大型前端仓库"的文档治理体系，比如先分析项目，是否要分层设计啊，如何设计agent目录啊，设计理念需要有Agent-First Design、System of Record、Cheat Sheet 模式、Convention over Configuration、目录怎么拆解，需要有哪些context、skills、docs、workflow、archived-changesets/、读者分离原则                          │
│                                                     │
│  人类开发者: docs/reference/ (完整、有背景、有示例)    │
│  AI Agent:   .agents/context/ (精简、结构化、省token)  │
│  两者之间:     单向引用，不重复                         │
│                                                     │
│  修改只在 docs/reference/ 进行                        │
│  提炼到 .agents/context/ 供 AI 速查                   │
│  pnpm docs:check 校验一致性           、怎么写CLAUDE.md — 最接近的通用约定、Cursor Rules
```

## .agents/skills/ — 项目 Skill 清单

本项目共注册了 3 个 Skill（其余已删除）：

| #   | Skill 名称                    | 说明                                                                 |
| --- | ----------------------------- | -------------------------------------------------------------------- |
| 1   | `karpathy-guidelines`         | ✅ AI 编程行为准则，减少过度设计、越界改动，写代码前显式化假设      |
| 2   | `skill-creator`               | ✅ 创建新 Skill、修改改进现有 Skill、评估 Skill 效果                 |
| 3   | `create-agent-first-docs`     | ✅ Agent 优先文档创建工具                                             |
| 4   | `harsh-current-branch-review` | ❌ 已删除（2026-08-13）- 严厉审查当前工作区未提交的代码改动          |
| 5   | `eslint-autofix`              | ❌ 已删除（2026-08-13）- 修改代码后用 ESLint 自动修复格式问题        |

## .agents/context/ — 给 AI 看的速查层（已清空）

| 特点     | 说明                                                 |
| -------- | ---------------------------------------------------- |
| 状态     | ❌ 已清空（2026-08-13）                              |
| 受众     | AI Agent（机器优先）                                 |
| 格式     | 高度压缩的表格、代码片段、规则清单                   |
| 目的     | 让 AI 在对话开始时一次性加载关键约束，不占太多 token |
| 更新方式 | 人工维护，从 docs/reference 提炼                     |
| 内容量   | 精简到一页以内                                       |

> **历史**：context 下面曾提供 `coding-conventions.md` 作为 **精炼摘要** 供 `harsh-current-branch-review` 使用（两者均已删除，2026-08-13）

## .agents/docs/reference/ — 给人和 AI 看的完整规范（已迁移到 docs/reference/）

| 特点   | 说明                                                                    |
| ------ | ----------------------------------------------------------------------- |
| 状态   | ✅ 已迁移到 `docs/reference/`（2026-08-13）                            |
| 受众   | 人类开发者 + AI                                                         |
| 格式   | 完整文档，含目录、emoji 标记、详细示例、反例、背景说明                  |
| 目的   | 作为唯一事实来源（System of Record），新人 onboarding、Code Review 依据 |
| 内容量 | 完整展开，coding.md 和 naming.md 各自是独立长文档                       |

# 搭建面向 AI Agent 的仓库基础设施

设计思想：
| 模式 | 背景 | 特点 |
| -------- | ---------------- | ------------------------ |
| Agent-First Design | AI 编程时代的新范式 | 文档分为"给人看的"和"给 AI 看的"两层|
| System of Record | 企业架构治理（Gartner） | docs/ 是唯一事实来源|
| Cheat Sheet 模式 | 开发者文档最佳实践| .agents/context/ 是速查摘要|
| Convention over Configuration| Rails 哲学| 通过约定路径让 AI 自动发现上下文|

重点是写出来让 AI Agent 高效理解大型前端仓库"的文档治理体系

.agents/ 目录完整拆解（理想结构）

```
.agents/
├── context/ # 📋 AI 速查层（机器优先）
├── skills/ # 🛠️ 任务工作流
├── docs/ # 📝 Agent 内部文档
├── workflow/ # 🔄 通用工作流
├── archived-changesets/ # 📦 归档的变更集
└── ignore # 🚫 忽略配置
```

> **注意**：当前项目实际只保留了 `context/`、`skills/` 和 `ignore` 三个部分，其余为理想结构参考。
