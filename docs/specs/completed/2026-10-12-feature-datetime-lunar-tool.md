# Spec: 实时日期与农历查询工具（get_datetime Function Calling）

> L2 完整规格 | 启动 2026-10-12 | 路由依据：影响 2 个源文件 + package.json / 新增约 70-100 行

## 背景

- 当前实现仅在 system prompt 注入公历时间（`server/server.js` 的 `getCurrentDateTime`），LLM 回答农历等派生日期信息时靠参数记忆，实测产生幻觉：用户问「今日农历日期」，机器人答「2026年10月12日 = 九月初一」，实际为**九月初三**（差两天，已通过多个万年历源交叉验证）。
- 根因：公历时间注入只解决「今天是几号」这类基准问题；农历/干支/生肖/节气及任意日期换算是确定性历法计算，LLM 不执行算法只会「猜」。
- 目标：为聊天机器人提供真实的日期查询能力——当前时刻完整历法信息 + 任意公农历日期互转。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|信息到达方式|Function Calling 工具 `get_datetime`|与天气工具同构；符合项目既定约束「新增工具能力走 Function Calling 而非 MCP」（MCP 与本聊天架构不匹配）|
|农历数据源|本地 npm 库 `solarlunar`（`server/` workspace 依赖）|历法是确定性计算而非实时数据，纯离线换算：无 API key、无额度、无网络故障点；覆盖 1900–2100 年；API 已验证支持双向互转、闰月、干支、生肖、节气|
|工具参数设计|可选 `year`/`month`/`day` 整数 + 可选 `lunar` 布尔；全部省略 = 查询当前时刻|无参覆盖高频「今天」类问题；带参顺带支持任意公农历互转，成本仅数行；整数参数比日期字符串对 LLM 更不易出错|
|实时性来源|`new Date()`（服务器系统时钟）|与现有注入同一来源；库只负责「确定的公历日期 → 农历」的换算，实时性与准确性分工明确|
|现有公历注入|保留不动|对「现在几点/今天几号」有效且已验证，符合最小改动原则|
|system prompt 调整|新增一条规则：涉及农历、干支、生肖、节气、任意日期换算时必须调用 `get_datetime` 工具，禁止凭记忆推算|防止 LLM 不触发工具直接幻觉作答（截图问题正是此类）|
|SSE 状态提示|复用现有 `status: tool_call` 事件，为 `get_datetime` 增加专属文案（如「📅 正在查询日期信息...」）|符合 backend-rules「工具执行前发送 SSE status 事件」，模式与天气一致|

### 工具定义（get_datetime）

- `description`：获取当前日期时间（公历 + 农历 + 干支 + 生肖 + 节气），或将指定日期在公历/农历间互转。凡涉及农历、干支、生肖、节气、星期、日期换算的问题必须调用本工具。
- `parameters`：
  - `year` (integer，可选)：公历年；`lunar` 为 true 时表示农历年
  - `month` (integer，可选)：月；`lunar` 为 true 时表示农历月
  - `day` (integer，可选)：日；`lunar` 为 true 时表示农历日
  - `lunar` (boolean，可选，默认 false)：输入日期是否为农历
- 返回：格式化文本（对标 `weather.js` 的 `formatWeatherData` 风格）
  - 当前时刻模式：公历日期 + 星期 + 时间 + 农历中文（年/月/日）+ 生肖 + 干支（年/月/日）+ 节气（当日有则返回）
  - 公历→农历：农历年月日中文 + 生肖 + 干支 + 节气
  - 农历→公历：对应公历年月日 + 星期

### 模块划分

- 新增 `server/datetime.js`：对标 `weather.js` 封装 `getDatetimeTool(args)`，含参数解析、solarlunar 换算、格式化；导出供 `server.js` 引用
- `server/server.js`：`TOOLS` 数组 + `TOOL_HANDLERS` 映射各加一项（backend-rules 要求两处同步）；system prompt 补规则；status 文案加分支

## 验收标准

- [x] 复验截图场景：问「今日农历日期」，回答与万年历一致（2026-10-12 = 丙午马年九月初三）
- [x] 公历→农历换算：问「1990年1月1日是农历多少」，结果与万年历一致
- [x] 农历→公历换算：问「2026年春节是公历几号」，能调用工具（lunar=true, 2026-1-1）得出正确公历日期
- [x] 无参调用返回当前时刻完整信息（公历 + 时间 + 农历 + 干支 + 生肖 + 节气）
- [x] 工具执行时前端展示 status 提示，流式回答正常结束（`[DONE]`）
- [x] 无效日期参数（如 13 月）返回友好错误信息，不中断服务
- [x] `npm run check:all` 通过
- [x] TDD：本需求仅改 server/**，前端无改动，不适用前端 TDD 门禁；以可复现的命令输出（solarlunar 换算冒烟验证 + 实际对话截图）作为验收证据

## 涉及模块

- 后端：`server/server.js`（工具定义 + handler + system prompt + status 文案）、新增 `server/datetime.js`
- 依赖：`server/package.json` 新增 `solarlunar`（版本以 lockfile 为准）；lockfile 由 `npm install` 更新
- 前端：无改动（复用现有 `status: tool_call` 事件渲染；验证阶段确认前端对 `get_datetime` 的 status 消息正常展示）

## 范围外

- 不接入 MCP server
- 不引入第三方在线万年历 API
- 不做时区参数化 / 前端本地时间上报（项目时区固定 Asia/Shanghai）
- 不新增 server 端测试框架（server 目前无测试基建，引入 vitest 属独立需求）
- 不做传统节日专门字段（正月初一=春节等常识由 LLM 基于返回的农历日期自行推断）
- 不动现有 `getCurrentDateTime` 注入逻辑与天气工具
