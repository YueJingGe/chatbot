# 核心编码约定

本文件是 `docs/reference/coding.md` 和 `docs/reference/naming.md` 的精炼摘要，
供 AI 工具快速参考。完整规范详见原始文档。

## 命名

| 目标            | 风格                     | 示例                                    |
| --------------- | ------------------------ | --------------------------------------- |
| React 组件      | `PascalCase`             | `MessageList`、`InputArea`              |
| 函数/变量       | `camelCase`              | `sendMessage`、`isLoading`              |
| 接口/类型       | `PascalCase`             | `Message`、`MessageListProps`           |
| 常量            | `UPPER_SNAKE`            | `REQUEST_TIMEOUT`、`PORT`               |
| CSS class       | BEM kebab-case           | `.input-area`、`.send-button--loading`  |
| 布尔变量        | `is/has/can/should` 前缀 | `isLoading`、`hasMessages`              |

## 导入规范

```typescript
// 1. React 导入
import { memo, useState, useCallback, KeyboardEvent } from "react";

// 2. 组件导入
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";

// 3. 样式导入
import "./App.css";
```

- 组间保留空行
- 禁止 `export *`，使用默认导出

## React

- 组件用箭头函数定义，Props 接口显式声明（`XxxProps` 后缀）
- 所有叶子组件必须使用 `React.memo`
- 传递给子组件的 callback 必须使用 `useCallback` 包裹
- 涉及前值时使用函数式更新 `setX(prev => ...)`
- 使用 `ref` 保持最新状态值，避免闭包陷阱
- 禁止在 JSX 中传递内联对象（导致 `React.memo` 失效）
- 列表渲染必须提供稳定唯一的 `key`，禁止使用数组索引

## CSS

- 原生 CSS（不使用 CSS Modules、Tailwind、CSS-in-JS）
- BEM 命名风格：`block__element--modifier`
- 设计令牌使用 CSS 变量（`--color-primary`, `--space-md` 等）
- 间距以 8px 为基准（4/8/16/24/32）

## 后端 (server/)

- OpenAI 客户端模块级单例，不复用连接
- SSE 流式响应：`text/event-stream` + `for await...of` + `AbortController` 超时
- 环境变量通过 `.env` + `dotenv` 读取，启动时校验必需变量
- 禁止硬编码密钥

## 安全红线

- 禁止硬编码密钥/Token（`.env` + `process.env`）
- 禁止 `dangerouslySetInnerHTML`
- 禁止 `eval()` / `new Function()`
- 禁止 `var` 声明，统一 `const` / `let`
- 禁止提交 `.env` 文件

## 依赖约束

- 不使用状态管理库（Redux、Zustand、MobX 等）
- 不使用路由库（React Router 等）
- 不使用 CSS-in-JS（styled-components、Emotion 等）
- 不使用 UI 框架（Ant Design、MUI、Chakra 等）
- 不使用 Tailwind CSS

## 性能

- 所有叶子组件使用 `React.memo`
- 传递给子组件的 callback 使用 `useCallback`
- 禁止在 JSX 中传递内联对象
- SSE 首字节延迟 < 100ms

## Commit

格式：`<type>(<scope>): <description>`
类型：feat, fix, refactor, style, docs, test, chore, perf
