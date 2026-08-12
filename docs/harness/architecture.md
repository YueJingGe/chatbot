---
level: iron
owner: "@tech-lead"
last_reviewed: 2026-08-12
review_cycle: quarterly
auto_enforced: false
---

# 架构约束

> 修改构建配置、路由、状态管理或 Monorepo 结构时必读。

## Monorepo 结构

本项目为 **npm workspaces** Monorepo，包含两个 workspace：

```
chatbot/
├── package.json          # npm workspaces 根配置
├── server/               # 后端 workspace（Express, 端口 3000）
└── web/                  # 前端 workspace（React + Vite, 端口 5173）
```

### Workspace 边界

| 规则                             | 说明                                                     |
| -------------------------------- | -------------------------------------------------------- |
| **前端禁止引入后端依赖**         | `web/` 中禁止引入 `express`、`cors`、`openai` 等后端依赖 |
| **后端禁止引入前端依赖**         | `server/` 中禁止引入 `react`、`vite` 等前端依赖          |
| **禁止跨 workspace 直接 import** | 前后端通过 HTTP API 通信，禁止直接 `import` 对方代码     |

### 端口约定

| 服务     | 端口 | 说明                   |
| -------- | ---- | ---------------------- |
| 后端     | 3000 | Express 服务器         |
| 前端开发 | 5173 | Vite 开发服务器        |
| 前端生产 | -    | 构建输出到 `web/dist/` |

## 构建约束

- **构建工具锁定**：前端使用 Vite 7，禁止更换构建工具
- **包管理器锁定**：使用 npm，禁止切换 pnpm/yarn
- **构建产物禁止修改**：`node_modules/`、`dist/` 禁止手动修改

## 通信协议

- **前后端通信**：HTTP REST API + SSE（Server-Sent Events）流式传输
- **SSE 端点**：`POST /api/chat`
- **SSE 数据格式**：`data: { "chunk": "内容" }`，结束标志 `data: [DONE]`
- **前端消费方式**：原生 `fetch` + `ReadableStream`，禁止使用第三方 SSE 库

## 状态管理约束

- **单页应用，App.tsx 集中管理所有状态**
- **禁止引入状态管理库**：Redux、Zustand、MobX、Jotai 等
- **禁止引入路由库**：React Router、wouter 等（单页面应用，无多页面路由需求）

## 禁止引入的依赖类型

| 类别      | 禁止的库/工具                  | 原因                               |
| --------- | ------------------------------ | ---------------------------------- |
| 状态管理  | Redux、Zustand、MobX、Jotai 等 | 单页应用，App.tsx 集中管理状态     |
| 路由      | React Router、wouter 等        | 单页面应用，无多页面路由需求       |
| CSS-in-JS | styled-components、Emotion 等  | 项目使用原生 CSS                   |
| UI 框架   | Ant Design、MUI、Chakra 等     | 对话 UI 自定义程度高，使用原生 CSS |
