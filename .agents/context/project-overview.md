# 项目概况

> 引入新依赖、改构建配置、改目录结构时必读。

## 项目是什么

AI 对话机器人，前后端分离，通过 SSE 流式转发 LLM 响应。

## 技术栈

|端|技术|
|-|-|
|前端|React 19 + Vite 7 + TypeScript|
|后端|Express 5 + OpenAI SDK 6|
|LLM|阿里云百炼 DashScope（qwen-max）|
|外部 API|Open-Meteo（天气 + 地理编码，免费无需 Key）|
|工程化|npm workspaces + concurrently|

## 目录结构

```
chatbot/
├── .agents/                          # AI 知识库（SSOT）
│   ├── context/                      # 项目上下文（3 个 .md）
│   ├── skills/                       # 任务 workflow（5 个 skill）
│   └── ignore                        # 跨 agent ignore
├── docs/                             # harness 文档
│   ├── harness/                      # 编码红线（必须遵守）
│   ├── reference/                    # 详细写法参考
│   ├── specs/                        # 需求规格
│   └── exec-plans/                   # 执行计划
├── server/                           # 后端：Express
│   ├── public/                       # 旧版前端（降级入口）
│   ├── server.js                     # 主服务器（SSE 转发）
│   ├── weather.js                    # 天气工具（Open-Meteo）
│   └── package.json
├── web/                              # 前端：React + Vite
│   ├── src/                          # 源码（App + 组件）
│   ├── public/                       # 静态文件
│   ├── vite.config.ts
│   └── package.json
├── scripts/                          # 工具脚本（sync-ignore、sync-skills）
├── AGENTS.md                         # AI 规范入口
└── package.json                      # npm workspaces 根配置
```

**禁止随意新增顶级目录**：新增目录前评估是否应放入现有 workspace 或 docs/ 下。

## 通信

前后端通过 HTTP REST + SSE 通信，端点 `POST /api/chat`。
