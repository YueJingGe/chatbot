---
level: living
owner: "@tech-lead"
last_reviewed: 2026-08-12
review_cycle: monthly
auto_enforced: true
---

# 编码红线

> 编写新代码时必读。详细编码规范请参见 `docs/reference/coding.md`。

## 格式红线

| 规则 | 规范 |
|------|------|
| 缩进 | 2 个空格，不使用 Tab |
| 引号 | 字符串使用双引号，JSX 属性使用双引号 |
| 分号 | 有分号风格 |
| 变量声明 | 禁止 `var`，统一使用 `const` / `let` |

## 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 组件 | `PascalCase` | `MessageList`, `InputArea` |
| 函数/变量 | `camelCase` | `sendMessage`, `isLoading` |
| 接口/类型 | `PascalCase` | `Message`, `MessageListProps` |
| 常量 | `UPPER_SNAKE` | `REQUEST_TIMEOUT`, `PORT` |
| 事件处理 | `handleXxx` | `handleKeyPress`, `handleSend` |

## 组件红线

- **函数式组件 + `React.memo` + props 解构 + 默认导出**
- **所有叶子组件必须使用 `React.memo`**
- **传递给子组件的 callback 必须使用 `useCallback`**
- **禁止在 JSX 中传递内联对象**（导致 `React.memo` 失效）

## TypeScript 红线

- **禁止使用 `any`**
- **禁止隐式 `any`**
- **禁止 `non-null` 断言（`!`）**，除非确实必要
- 接口命名以 `Props` 结尾（组件 props）

## 状态更新红线

- **涉及前值时使用函数式更新**：`setX(prev => ...)`
- **使用 ref 保持最新状态值**，避免闭包陷阱

## 列表渲染红线

- **必须提供稳定唯一的 `key`**
- **禁止使用数组索引作为 key**

## CSS 红线

- **使用 CSS 变量（Design Tokens）**，定义在 `:root` 中
- **BEM 命名风格**（`block__element--modifier`）
- **类名使用 kebab-case**
- **禁止 CSS-in-JS**（styled-components、Emotion 等）

## 详细规范

更详细的编码规范请参见：
- `docs/reference/coding.md` — React 组件、CSS、后端 SSE、TypeScript 等完整规范
- `docs/reference/naming.md` — 命名规范（变量、函数、组件、文件、CSS 类、Git 提交）
