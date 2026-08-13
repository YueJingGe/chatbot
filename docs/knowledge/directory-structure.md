---
level: guideline
owner: "@YueJingGe"
last_reviewed: 2026-08-12
review_cycle: per-pr
auto_enforced: false
---

# 目录职责说明

## 顶层结构

```
chatbot/
├── AGENTS.md              # Agent 规范入口
├── .cursorrules           # Cursor 规则
├── package.json           # npm workspaces 根配置
├── server/                # 后端 workspace
├── web/                   # 前端 workspace
└── docs/                  # 项目文档
```

## 后端（server/）

| 路径           | 职责                                      |
| -------------- | ----------------------------------------- |
| `server.js`    | 主服务器（单例 OpenAI 客户端 + SSE 转发） |
| `.env`         | API 密钥配置（gitignored）                |
| `.env.example` | 环境变量模板                              |
| `public/`      | 旧版前端（降级入口，express.static 托管） |

## 前端（web/）

| 路径              | 职责                                   |
| ----------------- | -------------------------------------- |
| `src/App.tsx`     | 主组件（状态中心 + SSE 消费）          |
| `src/main.tsx`    | 前端入口文件                           |
| `src/index.css`   | 全局重置样式                           |
| `src/components/` | 叶子组件目录                           |
| `vite.config.ts`  | Vite 配置 + dev proxy → localhost:3000 |
| `index.html`      | HTML 模板（含 Font Awesome CDN）       |

## 文档（docs/）

| 路径               | 职责                                  |
| ------------------ | ------------------------------------- |
| `docs/harness/`    | 约束层（架构、编码、安全红线）        |
| `docs/knowledge/`  | 知识库层（技术栈、目录、数据流）      |
| `docs/specs/`      | 需求规格文档                          |
| `docs/exec-plans/` | 执行计划                              |
| `docs/reference/`  | 团队自定义编码/命名规范（优先级最高） |

## 禁止随意新增顶级目录

新增目录前需评估是否应放入现有 workspace 或 docs/ 下。
