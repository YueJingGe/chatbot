# AI 对话机器人

基于阿里云百炼 DashScope qwen-max 大模型的 AI 对话机器人项目。采用前后端分离架构，后端通过 SSE（Server-Sent Events）流式转发 LLM 响应，前端实时渲染对话内容，提供流畅的流式交互体验。

本项目由两个独立项目整合而来：
- `my-chatbot` → `server/`（Express 后端）
- `chatbot-web` → `web/`（Vite + React 前端）

整合后通过 npm workspaces 实现统一依赖管理，concurrently 并发启动前后端开发服务器。

---

## 技术栈

| 层     | 技术                                                          |
| ------ | ------------------------------------------------------------- |
| 后端   | Node.js + Express 5 + OpenAI SDK 6 + dotenv + cors            |
| 前端   | React 19 + Vite 7 + ESLint 9                                  |
| LLM    | 阿里云百炼 DashScope OpenAI 兼容模式，qwen-max 模型           |
| 通信   | SSE（Server-Sent Events）流式传输，fetch + ReadableStream     |
| 工程化 | npm workspaces 单仓库 + concurrently 并发启动                 |

---

## 目录结构

```
chatbot/
├── AGENTS.md           # Agent 执行协议
├── .cursorrules        # 安全红线规则
├── package.json        # npm workspaces 根配置
├── README.md
├── server/             # 后端（Express，端口 3000）
│   ├── .env            # API 密钥（gitignored）
│   ├── .env.example    # 环境变量示例
│   ├── server.js       # 主服务器（单例 OpenAI 客户端 + SSE 转发）
│   └── public/         # 旧版前端（降级入口）
└── web/                # 前端（React + Vite，端口 5173）
    ├── vite.config.js  # Vite 配置 + 开发代理
    ├── index.html      # HTML 模板（含 Font Awesome CDN）
    └── src/
        ├── App.jsx     # 主组件（状态中心 + SSE 消费）
        ├── main.jsx    # 入口文件
        └── components/
            ├── MessageList.jsx  # 消息列表
            └── InputArea.jsx    # 输入区域
```

---

## 快速开始

### 1. 环境配置

复制环境变量示例文件并填入你的 API Key：

```bash
cd server
cp .env.example .env
```

编辑 `server/.env`，填入阿里云百炼 DashScope API Key：

```
DASHSCOPE_API_KEY=your-api-key-here
```

### 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

npm workspaces 会自动安装 `server/` 和 `web/` 的子包依赖。

### 3. 启动开发服务器

```bash
npm run dev
```

该命令通过 `concurrently` 并发启动：
- 后端服务：`http://localhost:3000`
- 前端开发服务器：`http://localhost:5173`（自动代理 `/api` 请求到后端）

打开浏览器访问 `http://localhost:5173` 即可开始对话。

---

## 开发命令

| 命令                  | 说明                                        |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | 并发启动前后端（concurrently）              |
| `npm run dev:server`  | 仅启动后端服务（端口 3000）                 |
| `npm run dev:web`     | 仅启动前端开发服务器（端口 5173）           |
| `npm run build`       | 构建前端生产包（输出到 `web/dist/`）        |
| `npm run lint`        | 对前端代码执行 ESLint 检查                  |

---

## Harness 系统

本项目配备 Better Harness 文档系统，为 AI Agent 协作开发提供规范保障：

- **`AGENTS.md`** — Agent 执行协议，定义了项目架构、代码规范、安全红线、性能预算、验证门控等 11 个方面的完整规范。Agent 在每次代码变更前应阅读此文件。
- **`.cursorrules`** — 安全红线规则，简洁的项目级约束，被 AI 编辑器自动加载。包含目录边界、代码规范、安全红线和输出要求。

两者协同工作：`.cursorrules` 提供即时加载的基础约束，`AGENTS.md` 提供深度完整的执行规范。
