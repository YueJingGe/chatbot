---
level: guideline
owner: "@YueJingGe"
last_reviewed: 2026-08-14
review_cycle: per-pr
auto_enforced: false
---

# 技术栈详细说明

## 后端

| 依赖    | 版本 | 用途                                        |
| ------- | ---- | ------------------------------------------- |
| express | 5    | HTTP 服务器框架                             |
| openai  | 6    | 阿里云百炼 DashScope SDK（OpenAI 兼容模式） |
| dotenv  | -    | 环境变量加载                                |
| cors    | -    | 跨域中间件                                  |

## 前端

| 依赖       | 版本 | 用途                         |
| ---------- | ---- | ---------------------------- |
| react      | 19   | UI 框架                      |
| vite       | 7    | 构建工具                     |
| typescript | -    | 类型系统                         |
| @vitejs/plugin-react | -    | Vite React 插件                 |

## LLM 服务

| 配置项   | 值                   | 说明                           |
| -------- | -------------------- | ------------------------------ |
| 服务商   | 阿里云百炼 DashScope | OpenAI 兼容模式                |
| 模型     | qwen-max             | 通过 `MODEL_NAME` 环境变量配置 |
| 通信方式 | SSE 流式传输         | `fetch` + `ReadableStream`     |

## 外部 API

| API 服务 | 用途 | 说明 |
| -------- | ---- | ---- |
| Open-Meteo Geocoding | 城市名 → 经纬度 | 免费，无需 API Key |
| Open-Meteo Forecast | 实时天气 + 预报 | 免费，通过 `server/weather.js` 封装调用 |

## 工程化

| 工具           | 用途             |
| -------------- | ---------------- |
| npm workspaces | 单仓库管理前后端 |
| concurrently   | 并发启动前后端   |
