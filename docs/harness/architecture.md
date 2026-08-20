# 架构约束

> 引入新依赖、改 workspace 边界时必读。

## Monorepo 边界

|规则|说明|
|-|-|
|前端禁止引入后端依赖|`web/` 中禁止 `express`/`cors`/`openai`|
|后端禁止引入前端依赖|`server/` 中禁止 `react`/`vite`|
|禁止跨 workspace 直接 import|前后端通过 HTTP API 通信|
