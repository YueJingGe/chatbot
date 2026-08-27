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

见 `docs/harness/architecture.md`。

**禁止随意新增顶级目录**：新增目录前评估是否应放入现有 workspace 或 docs/ 下。

## 通信

前后端通过 HTTP REST + SSE 通信，端点 `POST /api/chat`。
