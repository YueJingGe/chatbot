# Plan: 实时日期与农历查询工具（get_datetime Function Calling）

> 对应 spec：`docs/specs/active/2026-10-12-feature-datetime-lunar-tool.md` | 启动 2026-10-12

## 任务分解

- [x] 任务 1：确认当前分支（`git rev-parse --abbrev-ref HEAD`），用户指定不开新分支，直接在当前分支实施
- [x] 任务 2：安装依赖 `npm install solarlunar -w server`（版本以 lockfile 为准，不手改 lock 文件）
- [x] 任务 3：新增 `server/datetime.js`——对标 `weather.js` 四段式：参数解析（无参 = 当前时刻；带参 = 换算，`lunar` 控制输入历法）→ solarlunar 换算 → 格式化（公历 + 星期 + 时间 + 农历中文 + 生肖 + 干支 + 节气）→ 对外 `getDatetimeTool`；无效日期（如 13 月、超出 1900–2100）返回友好错误文本不抛出
- [x] 任务 4：`server/server.js` 接线——`TOOLS` 增加 `get_datetime` schema、`TOOL_HANDLERS` 增加分派（两处同步）；system prompt 追加「涉及农历/干支/生肖/节气/日期换算必须调用工具」规则；status 文案为 `get_datetime` 加 📅 分支
- [x] 任务 5：验证——solarlunar 换算冒烟（node 命令输出）+ `npm run check:all` + dev 启动实际对话复验验收标准场景
- [x] 任务 6：用户验收通过后归档 spec/exec-plan 至 `docs/specs/completed/`、`docs/exec-plans/completed/`（扁平 `YYYY-MM-DD-` 前缀，日期用完成日；勾选验收项）

> 注：commit 走 `git-commit` skill，须用户显式指令触发，不列入本计划自动执行。

## 依赖关系

- 任务 1 最先（确认当前分支，不开新分支，所有改动在当前分支进行）
- 任务 3 依赖 任务 2（模块实现需要 solarlunar 已安装）
- 任务 4 依赖 任务 3（server.js 引用 datetime.js 导出）
- 任务 5 依赖 任务 3 + 任务 4
- 任务 6 依赖 任务 5 且须用户明确验收

## 验证方式

- [x] solarlunar 换算冒烟：node 命令输出锚点比对——2026-10-12 = 丙午年九月初三（复验截图场景）、农历 2026 正月初一 → 公历 2026-02-17（春节）、1990-01-01 与万年历比对一致
- [x] `npm run check:all` 通过（含 `check:harness`、`check:frontend-tdd`；本需求前端无改动，不适用前端 TDD 门禁）
- [x] 手动测试（dev 启动后实际对话，留输出/截图为证）：
  - 「今日农历日期」→ 与万年历一致且触发工具（前端出现 📅 status 提示）
  - 「1990年1月1日是农历多少」→ 公历转农历正确
  - 「2026年春节是公历几号」→ 农历转公历正确
  - 「现在几点」→ 原注入路径不受影响
  - 无效日期问题（如诱导 13 月）→ 友好错误信息，服务不中断，流式正常 `[DONE]` 结束
