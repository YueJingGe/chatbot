# 完成事项

✅css 代码按组件拆分
✅css 模块化改造
✅css 改成 less

✅ mcp 学习使用

给 AI Agent 的 mcp.json 配置：

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["--with", "mcp\u003c2", "mcp-server-fetch"]
    },
    "nws_weather": {
      // 美国天气
      "command": "npx",
      "args": ["-y", "@h1deya/mcp-server-weather"]
    },
    "open_meteo": {
      // 所有的天气、空气质量、海洋天气、洪水风险、预测气候等
      "command": "npx",
      "args": ["-y", "-p", "open-meteo-mcp-server", "open-meteo-mcp-server"]
    }
  }
}
```

✅对话功能增加实时日期、时间

本质上是在服务器上获取，然后在 system prompt 中追加实时日期时间信息，然后当用户询问的时候，LLM 可以基于真实时间回答。

✅对话功能增加实时天气

利用 OpenAI Function Calling ，OpenAI 的 tools 参数增加一个 get_weather 工具 schema，让 qwen-max 自主决定何时调用。

流程：用户问天气 → LLM 返回 tool_call → 后端调用天气 API → 将结果作为 tool_response 回传 LLM → LLM 生成最终回答 → SSE 流式返回前端

天气API选择：Open-Meteo	完全免费，无需 Key	推荐，全球天气，RESTful，支持实时+预报

支持：支持当前天气 + 未来几天天气预报，工具参数更复杂

支持：调用天气工具时，显示“🌤️ 正在查询天气...”的状态提示，让用户知道系统在做什么
