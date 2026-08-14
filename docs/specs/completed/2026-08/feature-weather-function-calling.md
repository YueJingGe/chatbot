# Feature: 实时天气能力 — OpenAI Function Calling

## 概述

为 AI 对话机器人增加实时天气查询能力。利用 OpenAI SDK 6 的 `tools` 参数定义 `get_weather` 工具，让 qwen-max 自主决定何时调用。后端封装完整的 tool calling 循环，前端通过扩展的 SSE 协议展示工具调用状态。

## 数据流

```
用户: "北京今天天气怎么样？"
  │
  ▼
前端 POST /api/chat  ──→  后端收到 messages
  │
  ▼
后端: 第 1 次调 LLM（stream: false, 带 tools 参数）
  │
  ├── LLM 返回 finish_reason: "tool_calls"
  │     │
  │     ▼
  │   后端发送 SSE status 事件 ──→  前端显示状态提示
  │     │
  │     ▼
  │   后端执行 get_weather：
  │     1. Open-Meteo Geocoding API → 经纬度
  │     2. Open-Meteo Weather API → 实时天气 + 未来预报
  │     │
  │     ▼
  │   后端: 第 2 次调 LLM（stream: true, 带 tool 结果）
  │     │
  │     ▼
  │   SSE chunk 流 ──→  前端逐字显示最终回答
  │
  └── LLM 返回 finish_reason: "stop"（不需要工具）
        │
        ▼
      直接 SSE 流式返回（stream: true）
```

## 后端设计

### Tool Schema

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "获取指定城市的实时天气和未来天气预报",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "城市名称，如：北京、上海、杭州"
        },
        "forecast_days": {
          "type": "integer",
          "description": "预报天数，0 表示仅实时天气，最大 7 天",
          "default": 0
        }
      },
      "required": ["location"]
    }
  }
}
```

### Tool 执行逻辑

1. **地理编码**：调用 Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`)，将城市名转为经纬度
2. **天气查询**：调用 Open-Meteo Forecast API (`https://api.open-meteo.com/v1/forecast`)，参数：
   - `current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`（实时天气）
   - `daily=weather_code,temperature_2m_max,temperature_2m_min`（每日预报）
   - `timezone=Asia/Shanghai`
   - `forecast_days` 由 LLM 参数决定
3. **天气码映射**：将 WMO weather_code 转为中文描述

### Tool Loop 实现

- 第 1 次 LLM 调用使用 `stream: false`（需要完整累积 tool_call 参数）
- 检测到 `finish_reason: "tool_calls"` 时执行工具
- 将 tool 结果以 `role: "tool"` 消息回传
- 第 2 次 LLM 调用使用 `stream: true`，流式返回最终回答
- Tool loop 上限 **5 次**，防止无限循环

### SSE 协议扩展

新增 `status` 事件类型（与现有 `chunk` 事件并存）：

```
data: { "status": "tool_call", "tool": "get_weather", "message": "🌤️ 正在查询北京天气..." }
data: { "chunk": "北京今天晴，气温..." }
data: [DONE]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | 事件类型，值为 `"tool_call"` |
| `tool` | string | 工具名称 |
| `message` | string | 展示给用户的状态文字 |

## 前端设计

### Message 接口扩展

```typescript
interface Message {
  id: string | number;
  role: string;
  content: string;
  statusMessage?: string;  // 新增：工具调用状态提示
}
```

### SSE 解析扩展

在现有 SSE 行解析中增加 `status` 字段处理：

```
if (data.status) → 更新当前 assistant 消息的 statusMessage
if (data.chunk) → 清除 statusMessage，累加 content
```

### MessageList 渲染

- 当 `message.statusMessage` 存在时，显示状态提示（带天气图标样式）
- 使用与 typing indicator 不同的视觉样式（如灰色斜体 + 天气图标）
- 当 `content` 开始到达时，`statusMessage` 自动清除

### 样式

- 状态提示使用 BEM 命名：`.message__status`
- 灰色文字 + 轻微动画效果，与气泡样式区分

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 地理编码失败（城市不存在） | 将错误信息作为 tool response 回传 LLM，让 LLM 生成友好错误提示 |
| 天气 API 超时/失败 | 同上，tool response 返回错误描述 |
| Tool loop 超过 5 次 | 终止循环，返回 "天气查询过程异常" 错误 |
| 总请求超时 | 复用现有 AbortController 超时机制，可适当增大超时时间 |

## 不涉及的范围

- 不修改现有 system prompt（天气能力由 tool schema 驱动）
- 不引入新的 npm 依赖（天气 API 使用原生 fetch 调用）
- 不改变现有非天气对话的行为
- 不引入前端状态管理库

## 验收标准

- [x] 用户发送天气相关问题，LLM 能自主决定调用 `get_weather` 工具
- [x] 后端正确执行 Open-Meteo API 获取天气数据
- [x] 前端在工具调用期间显示状态提示（如 "🌤️ 正在查询北京天气..."）
- [x] 最终回答以 SSE 流式方式逐字显示
- [x] 非天气对话行为不受影响（tool loop 不触发时走原有流式路径）
- [x] 天气 API 错误时 LLM 能生成友好的错误提示
- [x] `npm run build` 构建通过
