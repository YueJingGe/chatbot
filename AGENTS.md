# AGENTS.md — AI 对话机器人项目级 Agent 规范

> 本文档定义 AI Agent 在本项目中生成、修改、审查代码时必须遵循的规范。
> 继承并扩展 `.cursorrules` 中的基础规则（禁止 `var`、有分号、双引号、禁止 `dangerouslySetInnerHTML`、禁止硬编码密钥）。

---

## 1. 项目概述

本项目是一个整合后的统一 AI 对话机器人项目，采用前后端分离架构，通过 SSE（Server-Sent Events）实现流式对话。

- **后端**：Express 5 服务器（端口 3000），持有 API Key，通过 OpenAI SDK 调用阿里云百炼 DashScope，将 LLM 流式响应以 SSE 格式转发给前端。
- **前端**：React 19 + Vite 7 单页应用（开发端口 5173），通过 `fetch` + `ReadableStream` 消费 SSE 流，实时渲染对话内容。
- **LLM**：阿里云百炼 DashScope OpenAI 兼容模式，模型为 `qwen-max`。
- **通信**：SSE（Server-Sent Events）流式传输，前端使用原生 `fetch` + `ReadableStream` 解析。

### 技术栈

| 层     | 技术                                                          |
| ------ | ------------------------------------------------------------- |
| 后端   | Node.js + Express 5 + OpenAI SDK 6 + dotenv + cors            |
| 前端   | React 19 + Vite 7 + ESLint 9                                  |
| LLM    | 阿里云百炼 DashScope OpenAI 兼容模式，qwen-max 模型           |
| 通信   | SSE（Server-Sent Events）流式传输，fetch + ReadableStream     |
| 工程化 | npm workspaces 单仓库 + concurrently 并发启动                 |

---

## 2. 目录结构

```
chatbot/
├── AGENTS.md
├── .cursorrules
├── .gitignore
├── package.json          # npm workspaces 根配置
├── README.md
├── server/               # 后端（Express, 端口 3000）
│   ├── .env              # API 密钥（gitignored）
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js         # 主服务器（单例 OpenAI 客户端 + SSE 转发）
│   └── public/           # 旧版前端（降级入口，express.static 托管）
└── web/                  # 前端（React + Vite, 端口 5173）
    ├── .gitignore
    ├── package.json
    ├── vite.config.js    # Vite 配置 + dev proxy → localhost:3000
    ├── index.html        # HTML 模板（含 Font Awesome CDN）
    ├── eslint.config.js
    └── src/
        ├── App.jsx       # 主组件（状态中心 + SSE 消费）
        ├── App.css       # 主组件样式
        ├── main.jsx      # 入口文件
        ├── index.css     # 全局重置样式
        └── components/
            ├── MessageList.jsx  # 消息列表（React.memo）
            └── InputArea.jsx    # 输入区域（React.memo）
```

### 核心文件保护清单（禁止删除/重命名）

以下文件为项目核心，**禁止删除或重命名**：

- `server/server.js` — 后端主入口，单例 OpenAI 客户端与 SSE 转发逻辑
- `server/.env` — API 密钥配置（同时禁止提交到版本控制）
- `web/src/App.jsx` — 前端状态中心与 SSE 消费逻辑
- `web/src/main.jsx` — 前端入口文件
- `web/vite.config.js` — Vite 配置与开发代理
- `web/index.html` — HTML 模板（含 Font Awesome CDN 引用）
- `package.json`（根目录）— npm workspaces 根配置

---

## 3. 开发命令

| 命令                  | 说明                                            |
| --------------------- | ----------------------------------------------- |
| `npm install`         | 安装所有依赖（workspaces 自动处理子包依赖）     |
| `npm run dev`         | 并发启动前后端（concurrently），后端 3000 + 前端 5173 |
| `npm run dev:server`  | 仅启动后端服务（端口 3000）                     |
| `npm run dev:web`     | 仅启动前端开发服务器（端口 5173）               |
| `npm run build`       | 构建前端生产包（输出到 `web/dist/`）            |
| `npm run lint`        | 对前端代码执行 ESLint 检查                      |

---

## 4. 安全红线

以下规则为绝对禁止，无任何例外：

| 红线                          | 说明                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| 硬编码密钥/Token              | 所有 API Key 必须通过 `.env` + `process.env` 读取，禁止在代码中出现   |
| 修改 `.env` 文件              | `.env` 包含敏感凭证，禁止提交到版本控制                               |
| 操作 `node_modules/`、`dist/` | 构建产物和依赖目录，禁止手动修改                                     |
| `dangerouslySetInnerHTML`     | 禁止使用，除非配合 `DOMPurify` 消毒                                   |
| `eval()` / `new Function()`   | 禁止动态执行代码，防止注入攻击                                        |
| `var` 声明                    | 禁止使用 `var`，统一使用 `const` / `let`                              |

---

## 5. Git 安全协议

- **禁止** `git push --force`（强制推送）。
- **禁止** 提交 `.env` 文件（`.gitignore` 已排除 `.env`）。
- **禁止** 使用 `--no-verify` 跳过 hooks。
- 每次 commit 前应运行 `npm run lint` 确认无错误。
- **禁止** 更新 git config（`git config --global` 等）。
- **禁止** 执行破坏性/不可逆 git 命令（如 hard reset），除非用户明确要求。

---

## 6. 验证门控

每次代码变更后必须执行的验证清单：

| 序号 | 验证步骤                                          | 预期结果                    |
| ---- | ------------------------------------------------- | --------------------------- |
| 1    | `npm run lint`                                    | ESLint 检查通过，无错误     |
| 2    | `npm run dev`                                     | 前后端同时启动成功          |
| 3    | 浏览器访问 `http://localhost:5173`                | 页面正常加载                |
| 4    | 发送测试消息                                      | SSE 流式响应正常，文字逐字显示 |
| 5    | `grep -r "sk-" server/server.js`                  | 无输出，确认无硬编码密钥    |

---

## 7. 依赖约束

### 跨层依赖隔离

- **前端（`web/`）禁止引入后端依赖**：express、cors、openai 等。
- **后端（`server/`）禁止引入前端依赖**：react、vite 等。

### 禁止引入的依赖类型

| 类别      | 禁止的库/工具                  | 原因                                        |
| --------- | ------------------------------ | ------------------------------------------- |
| 状态管理  | Redux、Zustand、MobX、Jotai 等 | 单页应用，`App.jsx` 集中管理状态，无需额外方案 |
| 路由      | React Router、wouter 等        | 单页面应用，无多页面路由需求                |
| CSS-in-JS | styled-components、Emotion 等  | 项目使用原生 CSS，保持一致性                |
| UI 框架   | Ant Design、MUI、Chakra 等     | 对话 UI 自定义程度高，使用原生 CSS 即可     |

### 新增依赖流程

新增任何依赖前必须确认必要性，并在本文件中记录。引入步骤：
1. 评估是否有原生实现方案。
2. 确认包体积与维护状态。
3. 在 `AGENTS.md` 中记录新增依赖及用途。

---

## 8. 代码规范

| 规则       | 规范                                                              |
| ---------- | ----------------------------------------------------------------- |
| 缩进       | 2 个空格，不使用 Tab                                              |
| 引号       | 字符串使用双引号，JSX 属性使用双引号                              |
| 分号       | 有分号风格                                                        |
| 命名       | 组件 `PascalCase`，函数/变量 `camelCase`，文件名与组件名一致      |
| 组件       | 函数式组件 + `React.memo` + props 解构 + 默认导出                 |
| 回调       | 传递给子组件的 callback 必须使用 `useCallback` 包裹               |
| 状态更新   | 涉及前值时使用函数式更新 `setX(prev => ...)`                      |
| 列表渲染   | 必须提供稳定唯一的 `key`，禁止使用数组索引                        |

---

## 9. 性能预算

### 时间预算

| 操作                          | 上限    |
| ----------------------------- | ------- |
| ESLint 检查                   | < 5s    |
| 前端构建（`npm run build`）   | < 5s    |
| SSE 首字节延迟                | < 100ms |
| 页面 LCP                      | < 2s    |

### 渲染性能规则

- **所有叶子组件必须使用 `React.memo`**：`MessageList` 和 `InputArea` 已添加 `React.memo`，新增叶子组件同样需要包裹。
- **传递给子组件的 callback 必须使用 `useCallback`**：配合子组件的 `React.memo` 避免无效重渲染。
- **禁止在 JSX 中传递内联对象**：内联对象会导致子组件 `React.memo` 失效，应将常量提取到组件外部或使用 `useMemo`。

---

## 10. 最佳实践分析

以下为项目整合过程中实施的关键改进：

| 序号 | 改进项             | 改进前                                    | 改进后                                          |
| ---- | ------------------ | ----------------------------------------- | ----------------------------------------------- |
| 1    | 密钥管理           | API Key 硬编码在 `server.js` 中           | 迁移到 `.env` + `dotenv` + `process.env`        |
| 2    | OpenAI 客户端      | 每次请求创建新的 OpenAI 实例              | 模块级单例，复用连接                             |
| 3    | 组件 memo 化       | 子组件无优化，每次父组件更新都全量重渲染  | `MessageList` 和 `InputArea` 添加 `React.memo`  |
| 4    | Font Awesome 加载  | `main.jsx` 中 DOM 动态注入 `<link>` 标签  | `index.html` 静态 CDN 引用，避免运行时 DOM 操作 |
| 5    | `.history` 管控    | `.history/` 目录纳入版本控制              | 添加到 `.gitignore`，不纳入版本控制             |
| 6    | npm workspaces     | 前后端独立仓库，依赖分别管理              | 统一 `npm workspaces` + `concurrently` 并发开发 |
| 7    | 依赖清理           | 包含未使用的 `crypto-js` 和 `node-fetch`  | 移除冗余依赖，减小包体积                        |

---

## 11. 代码模板

### 新组件模板

```jsx
import { memo } from "react";
import "./MyComponent.css";

const MyComponent = memo(({ title, onSubmit }) => {
  return (
    <div className="my-component">
      <h2 className="my-component__title">{title}</h2>
      <button className="my-component__btn" onClick={onSubmit}>
        提交
      </button>
    </div>
  );
});

export default MyComponent;
```

**要点**：函数式组件 + props 解构 + `memo` + 默认导出 + 原生 CSS。

### 新 CSS 文件模板

```css
.my-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-component__title {
  font-size: 1.25rem;
  font-weight: 600;
}

.my-component__btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

**要点**：原生 CSS + BEM 命名风格（`block__element--modifier`）。

### App.jsx 中 callback 模板

```jsx
import { useState, useCallback } from "react";

const handleSend = useCallback((message) => {
  setMessages(prev => [...prev, { role: "user", content: message }]);
}, []);
```

**要点**：`useCallback` 包裹 + 函数式更新 `setX(prev => ...)`。

---

> **最后更新**：本文档随项目架构演进同步更新，Agent 在每次代码变更前应重新阅读本文件以确保遵循最新规范。
