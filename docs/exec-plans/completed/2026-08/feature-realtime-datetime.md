# Exec Plan: 对话功能增加实时日期时间能力

## 任务分解

|#|任务|依赖|验证方式|
|-|-|-|-|
|1|修改 `server/server.js`，在 system prompt 中注入实时日期时间|无|代码审查|
|2|执行 `npm run build` 验证构建通过|#1|构建无报错|

## 执行状态

- [x] #1 修改 system prompt 注入实时日期时间
- [x] #2 构建验证
