# 前端上下文

> 写前端代码时必读。

## 数据流

```
用户输入 → App.tsx → POST /api/chat → SSE 流 → App.tsx 逐字更新 → MessageList 渲染
```
