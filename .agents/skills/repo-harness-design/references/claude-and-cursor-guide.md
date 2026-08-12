# CLAUDE.md 与 Cursor Rules 编写指南

---

## CLAUDE.md

### 是什么

`CLAUDE.md` 是 Anthropic Claude 系列 Agent 的**仓库级约定文件**。当 Claude 打开一个项目时，会自动读取根目录的 `CLAUDE.md`。

### 定位

**最小可行方案**：一个文件告诉 AI 这个仓库的基本信息。适合中小项目。

### 写法原则

1. **不要重复 AGENTS.md 的内容**，而是指向它
2. **保持简短**（< 30 行），Claude 每次对话都会加载
3. **只写 Claude 特有的指令**，通用规范放 AGENTS.md

### 模板

#### 小型项目（没有 AGENTS.md）

```markdown
# CLAUDE.md

This is a React + TypeScript project using Vite.

## Tech Stack
- React 19, TypeScript 5, Vite 7
- ESLint 9, no external UI library

## Rules
- Use functional components with React.memo
- Use useCallback for callbacks passed to children
- No var, use const/let
- No hardcoded secrets
- 2 space indent, double quotes, semicolons

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint check
```

#### 中型以上项目（有 AGENTS.md）

```markdown
# CLAUDE.md

This project uses an agent-first documentation harness.

For full context, read `AGENTS.md` first, then navigate to the relevant section.

Key files:
- `AGENTS.md` — Project map and protocols
- `.agents/context/` — Quick-reference for AI
- `docs/reference/` — Complete specifications
```

### 不要做的事

| 错误 | 原因 |
|---|---|
| 把完整规范写进 CLAUDE.md | 和 AGENTS.md 重复，维护成本高 |
| 写超过 50 行 | Claude 每次对话都加载，浪费 token |
| 项目特定路径写死 | 重构后失效 |

---

## Cursor Rules

### 是什么

Cursor IDE 的自定义规则系统，支持两种格式：

1. **`.cursorrules`** — 单个文件（旧格式，向后兼容）
2. **`.cursor/rules/`** — 按文件组织（新格式，推荐）

### 定位

**IDE 级规则**：只在 Cursor IDE 中生效，不影响其他 Agent。

### 写法原则

1. **只写编码规则**，不写项目架构
2. **按主题拆分**（使用 `.cursor/rules/`）
3. **用 `.mdc` 后缀**（Cursor 的 Markdown 组件格式）

### 推荐结构

```
.cursor/rules/
├── naming.mdc        # 命名规范
├── react.mdc         # React 规则
├── styling.mdc       # 样式规则
├── security.mdc      # 安全红线
└── testing.mdc       # 测试要求
```

### 单文件模板（.cursorrules）

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

## CSS
- Native CSS only (no CSS-in-JS, no Tailwind)
- BEM naming: block__element--modifier
- Use CSS variables for design tokens

## Before Committing
- Run `npm run lint`
- Run `npm test` if tests exist
```

### 分文件模板（.cursor/rules/）

**naming.mdc**
```markdown
---
description: Naming conventions
globs: *.ts,*.tsx,*.js,*.jsx
---
# Naming

- Components: PascalCase (`MessageList`)
- Functions/variables: camelCase (`sendMessage`)
- Files: kebab-case (`use-chat-state.ts`)
- CSS classes: BEM kebab-case (`.input-area__submit`)
- Booleans: is/has/can prefix (`isLoading`)
```

**react.mdc**
```markdown
---
description: React component rules
globs: *.tsx
---
# React

- Functional components only
- Wrap leaf components with React.memo
- Use useCallback for callbacks passed to children
- Use functional updates: setX(prev => ...)
- Use ref to keep latest state values
- No inline objects in JSX (breaks React.memo)
```

**styling.mdc**
```markdown
---
description: CSS and styling rules
globs: *.css
---
# Styling

- Native CSS only
- BEM naming: block__element--modifier
- CSS variables for all design tokens
- 8px spacing scale (4/8/16/24/32)
```

**security.mdc**
```markdown
---
description: Security rules
alwaysApply: true
---
# Security

- No hardcoded secrets/API keys
- No dangerouslySetInnerHTML
- No eval() or new Function()
- No var declarations
```

---

## 三者关系

```
CLAUDE.md          → 只给 Claude 看
.cursorrules       → 只给 Cursor 看
AGENTS.md          → 给所有 Agent 看（通用）

优先级：AGENTS.md > CLAUDE.md / .cursorrules
```

### 最佳实践

1. **AGENTS.md 是核心**，所有 Agent 都读
2. **CLAUDE.md 指向 AGENTS.md**，不重复内容
3. **.cursorrules 只写 Cursor 特有的 IDE 规则**（如代码补全偏好）
4. **不要在三处写同一份规范**
