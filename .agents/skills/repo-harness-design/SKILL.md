---
name: repo-harness-design
description: 为任意前端项目（新项目或老项目）设计一套 Agent-First 文档治理体系。参考千问 monorepo 的 harness 架构和业界通用实践（CLAUDE.md、Cursor Rules），根据项目规模自动判断分层深度，输出完整的目录结构、文件内容和维护策略。适用于"为新项目搭建 Agent 文档体系"、"给老项目补 Agent 上下文"、"审查现有 AGENTS.md 是否合理"等场景。
---

# 项目文档治理体系设计

为任意前端项目设计一套让 AI Agent 高效理解的文档治理体系。

## 设计理念

本 Skill 基于以下五个核心设计理念：

### 1. Agent-First Design（面向 AI 设计）

文档不仅给人看，更给 AI Agent 看。AI 的读取方式和人类完全不同：
- 人类是**按需查找**，AI 是**启动时批量加载**
- 人类能跳过无关内容，AI 会把所有内容塞进上下文窗口
- 因此需要为 AI 专门准备**精简版速查文档**

### 2. System of Record（单一事实来源）

所有规范、架构决策、技术债记录只有一个权威位置（`docs/`），避免：
- 同一份规范在多处重复，更新时不同步
- AI 读到过期信息，给出错误建议

### 3. Cheat Sheet 模式（速查表）

完整规范（给人看）和速查表（给 AI 看）分离：
- `docs/reference/` — 完整文档，有背景、有示例、有反例
- `.agents/context/` — 压缩到一页以内的速查表，AI 启动时加载

### 4. Convention over Configuration（约定优于配置）

通过**约定路径**让 AI 自动发现上下文，不需要额外配置：
- `.agents/context/` 下的文件 → AI 自动加载
- `.agents/skills/` 下的 SKILL.md → AI 按任务匹配
- `docs/reference/` 下的文档 → 唯一事实来源

### 5. 读者分离原则

```
人类开发者: docs/reference/ (完整、有背景、有示例)
AI Agent:   .agents/context/ (精简、结构化、省 token)
两者之间:     单向引用，不重复

修改只在 docs/reference/ 进行
提炼到 .agents/context/ 供 AI 速查
```

---

## 何时使用

- 新项目初始化，需要搭建 Agent 文档体系
- 老项目重构，希望补全 Agent 上下文
- 现有 `AGENTS.md` 混乱，需要重新设计
- 审查当前项目的文档治理是否合理

---

## 执行流程

### 第一步：分析项目规模

运行以下命令收集项目信息：

```bash
# 1. 项目结构
find . -maxdepth 1 -type f -o -maxdepth 1 -type d | grep -v node_modules | grep -v .git

# 2. 代码文件数量（排除 node_modules 和 .git）
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l

# 3. 前端源文件数量
find ./src ./web ./app ./packages -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l

# 4. 是否有 monorepo 结构
cat package.json | grep -E "workspaces|packages"

# 5. 现有文档
find . -name "AGENTS.md" -o -name "CLAUDE.md" -o -name ".cursorrules" -o -name ".cursor/rules" 2>/dev/null
```

根据结果判断项目规模：

| 规模 | 代码文件数 | 端数量 | 特征 |
|---|---|---|---|
| **小型** | < 50 | 1 | 单体项目，个人/小团队 |
| **中型** | 50 - 500 | 1-2 | 有分包，有小团队 |
| **大型** | 500 - 5000 | 2-5 | Monorepo，多端，多团队 |
| **超大型** | > 5000 | 5+ | 企业级 monorepo，多端多团队 |

### 第二步：根据规模选择分层深度

#### 小型项目（< 50 文件）— 两层结构

```
project/
├── AGENTS.md              # 项目概述 + 规范 + 命令（全部放这里）
└── .agents/
    └── context/
        └── coding-conventions.md  # 速查表（从 AGENTS.md 提炼）
```

**不需要**：
- `docs/reference/`（AGENTS.md 就是事实来源）
- `.agents/skills/`（通用 Skill 够用）
- `pnpm docs:check`（手动维护）

#### 中型项目（50 - 500 文件）— 三层结构

```
project/
├── AGENTS.md              # 地图 + 协议 + 命令
├── docs/
│   └── reference/
│       ├── coding.md      # 完整编码规范
│       └── naming.md      # 完整命名规范
└── .agents/
    ├── context/
    │   └── coding-conventions.md  # 速查表（引用 docs/reference/）
    └── skills/
        ├── eslint-autofix/
        │   └── SKILL.md
        └── karpathy-guidelines/
            └── SKILL.md
```

#### 大型项目（500 - 5000 文件）— 四层结构

```
project/
├── AGENTS.md
├── docs/
│   ├── index.md           # 总入口
│   ├── reference/         # 长期规范
│   ├── runbooks/          # 操作手册
│   └── exec-plans/        # 执行计划
│       ├── active/
│       └── completed/
└── .agents/
    ├── context/           # AI 速查（7 个文件以内）
    │   ├── architecture-overview.md
    │   ├── coding-conventions.md
    │   └── tech-stack.md
    ├── skills/            # 任务工作流（10-20 个）
    └── workflow/          # 通用工作流
```

#### 超大型项目（> 5000 文件）— 完整千问式 harness

参考千问 monorepo 的完整体系，包含：
- `docs/` 下 5 个业务桶 + 2 个自动生成控制面
- `.agents/skills/` 下 30+ 个 Skill
- 各端专属 `.agents/context/` 和 `.agents/skills/`
- `pnpm docs:check` 强制校验

### 第三步：生成目录结构

根据第二步的判断，输出推荐的目录树。

### 第四步：编写核心文件

按以下顺序创建文件（详见下方的模板）：

1. `AGENTS.md` — 项目地图
2. `.agents/context/coding-conventions.md` — 速查表
3. `docs/reference/coding.md` — 完整规范（中型以上）
4. `docs/reference/naming.md` — 命名规范（中型以上）
5. `.agents/skills/*/SKILL.md` — 任务工作流

### 第五步：生成通用约定文件

根据项目使用的 AI 工具，生成对应的约定文件：

| 工具 | 文件 | 内容 |
|---|---|---|
| Claude | `CLAUDE.md` | 指向 AGENTS.md 的简短说明 |
| Cursor | `.cursorrules` 或 `.cursor/rules/` | 核心编码规则 |
| 通用 | 无 | AGENTS.md 本身即通用约定 |

---

## 文件模板

### AGENTS.md（通用模板）

```markdown
# AGENTS.md

## Project

{一句话描述项目}

## Map

{根据规模选择以下条目}
- `docs/index.md` — 仓库记录系统总入口（中型以上）
- `docs/reference/` — 架构、编码规范、命名规范
- `.agents/context/` — AI 速查摘要
- `.agents/skills/` — 任务工作流

## Default Protocol

- 先读地图，再读正文：优先从 `AGENTS.md`、`README.md` 入手
- 涉及规范时，查看 `docs/reference/coding.md`（中型以上）或本节（小型）
- 涉及任务流程时，查找对应 `.agents/skills/*/SKILL.md`

## Commands

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务 |
| `npm run build` | 构建生产包 |
| `npm run lint` | 运行 lint |
| `npm test` | 运行测试 |

## Security

- 不要修改 `.env` 文件
- 不要提交 secrets、API keys、tokens
```

### .agents/context/coding-conventions.md（速查表模板）

```markdown
# 核心编码约定

{小型项目：本文件是 AGENTS.md 的精炼摘要}
{中型以上：本文件是 docs/reference/coding.md 和 docs/reference/naming.md 的精炼摘要，供 AI 工具快速参考。完整规范详见原始文档。}

## 命名

| 目标 | 风格 | 示例 |
|---|---|---|
| React 组件 | `PascalCase` | `MessageList`、`InputArea` |
| 函数/变量 | `camelCase` | `sendMessage`、`isLoading` |
| 文件名 | kebab-case | `use-chat-state.ts` |
| CSS class | BEM kebab-case | `.input-area__submit` |

## 导入规范

{项目实际的导入顺序}

## React

{项目实际的 React 规范}

## CSS

{项目实际的 CSS 规范}

## 性能

{项目实际的性能规则}
```

### CLAUDE.md（Claude 专用）

```markdown
# CLAUDE.md

This project uses an agent-first documentation harness.

For full project context, conventions, and protocols, read:
- `AGENTS.md` — Project map and default protocols
- `.agents/context/` — Quick-reference summaries for AI
- `docs/reference/` — Complete specifications (if available)

Start by reading `AGENTS.md`, then navigate to the relevant section.
```

### .cursorrules（Cursor 专用）

```markdown
# Cursor Rules

## Core Constraints
- Use TypeScript strict mode
- Use functional components with React.memo
- Use useCallback for callbacks passed to children
- No var, use const/let
- No hardcoded secrets
- No dangerouslySetInnerHTML

## Style Guide
- 2 space indent
- Double quotes for strings
- Semicolons required
- PascalCase for components, camelCase for functions/variables

## Before Committing
- Run `npm run lint`
- Run `npm test` if tests exist
```

---

## Skill 选择指南

根据项目规模选择需要引入的 Skill：

### 所有项目都推荐

| Skill | 作用 |
|---|---|
| `karpathy-guidelines` | AI 编程行为准则，减少过度设计 |
| `eslint-autofix` | 代码修改后自动 lint 修复 |

### 中型以上项目追加

| Skill | 作用 |
|---|---|
| `harsh-current-branch-review` | 严厉代码审查 |
| `performance-guard` | 性能审查（内存泄漏、渲染优化）|

### 大型项目追加

| Skill | 作用 |
|---|---|
| `react-render-audit` | React 重渲染审计 |
| `release-build-chain` | 构建链路审查 |
| `unified-version-overrides` | 依赖版本统一 |

### 不推荐引入的 Skill（除非明确需要）

| Skill | 原因 |
|---|---|
| `skill-creator` | 用于维护 Skill 体系本身，不是给业务项目用的 |
| `figma-design-to-code` | 需要 Figma 集成 |
| `baozi-trace` 系列 | 千问专属，依赖内部基础设施 |

---

## 维护策略

### 小型项目

- 手动维护 `AGENTS.md` 和 `coding-conventions.md`
- 规范变更时同步更新两处
- 不需要自动化校验

### 中型以上项目

- 规范变更只在 `docs/reference/` 进行
- 变更后手动提炼到 `.agents/context/`
- 可选：编写简单的 `docs:check` 脚本校验引用路径

### 大型项目

- 使用 `pnpm docs:check` 强制校验
- 使用 `pnpm docs:index` 自动生成 catalog
- PR 中修改文档时必须通过校验

---

## 常见错误

| 错误 | 正确做法 |
|---|---|
| 把所有规范堆在 AGENTS.md 里 | 中型以上项目分层到 docs/reference/ |
| context 里写完整规范 | context 只写速查表，引用完整文档 |
| 在 .agents/ 下放完整规范 | .agents/ 只放速查和工作流，规范放 docs/ |
| 引入过多 Skill | 按规模选择，小型项目 2-3 个足够 |
| 路径引用不一致 | context 里引用的路径必须和实际文件位置一致 |
