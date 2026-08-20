# Exec Plan: 实时天气能力 — OpenAI Function Calling

> Spec: `docs/specs/active/feature-weather-function-calling.md`

## 任务分解

### Step 1: 后端 — 天气工具模块

- [x] 在 `server/` 下新建 `weather.js`，封装天气查询逻辑
- [x] 实现 `geocodeCity(location)` — 调用 Open-Meteo Geocoding API
- [x] 实现 `fetchWeather(latitude, longitude, forecastDays)` — 调用 Open-Meteo Forecast API
- [x] 实现 WMO weather_code → 中文描述映射
- [x] 导出 `getWeatherTool(location, forecastDays)` 统一入口函数

### Step 2: 后端 — Tool Schema 与 Tool Loop

- [x] 在 `server.js` 中定义 `TOOLS` 常量（tool schema）
- [x] 重构 `/api/chat` 路由：
  - 全程流式：`stream: true`，带 `tools` 参数
  - 流中累积 tool_calls 参数，流结束后检测 `finish_reason`
  - 发送 SSE `status` 事件
  - 将 tool 结果以 `role: "tool"` 回传，进入下一轮流式调用
  - Tool loop 上限 5 次
- [x] 非工具调用路径：内容已在流中转发，直接发送 `[DONE]`

### Step 3: 前端 — SSE 解析与状态展示

- [x] 扩展 `Message` 接口，增加 `statusMessage?: string`
- [x] SSE 解析增加 `data.status` 分支处理
- [x] 收到 `status` 事件时更新 assistant 消息的 `statusMessage`
- [x] 收到 `chunk` 事件时清除 `statusMessage`

### Step 4: 前端 — MessageList 渲染与样式

- [x] MessageList 增加 `statusMessage` 渲染逻辑
- [x] 新增 `.status` 样式（灰色斜体 + 脉动动画）
- [x] 确保 statusMessage 与 typing indicator 互斥

### Step 5: 验证与文档同步

- [x] `npm run build` 构建通过
- [x] 更新 `docs/knowledge/data-flow.md`（SSE 协议扩展）
- [x] 更新 `docs/knowledge/tech-stack.md`（新增外部 API 部分）

## 依赖关系

```
Step 1 (天气模块) ──→ Step 2 (Tool Loop)
Step 3 (前端 SSE) ──→ Step 4 (前端渲染)
Step 2 + Step 4 ──→ Step 5 (验证)
```

Step 1 和 Step 3 可并行，Step 2 依赖 Step 1，Step 4 依赖 Step 3。
