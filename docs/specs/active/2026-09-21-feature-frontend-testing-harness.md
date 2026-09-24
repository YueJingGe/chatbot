# Spec: 前端测试 Harness 引入

> L2 完整规格 | 启动 2026-09-21 | 路由依据：影响 AGENTS、context、harness 文档和根构建门禁，属于核心协作规则变更。

## 背景

消息复制功能已完成首批 Vitest 测试，但现有 harness 尚未定义测试策略，`.agents/context/frontend-context.md` 仍写有“暂无单元测试”，且 `npm run check:all` 不运行测试。需要将已验证的测试实践固化为可触发、可执行、可验证的前端测试规范。

## 参考与裁剪

|来源|采用内容|不直接照搬的内容与原因|
|-|-|-|
|外部参考项目|Vitest + Testing Library + jsdom 工具链、`vitest.setup.ts` 初始化、`render` / `user-event` 组件测试模式、测试先行作为验收方式|当前项目已具备这套最小工具链，直接沿用成熟实践。|
|当前项目|同目录 `*.test.ts(x)`、少 mock、无覆盖率阈值、以 `check:all` 统一门禁、AGENTS 动作触发|项目规模较小且用户明确要求同目录组织；不引入外部参考项目可能需要的 fixtures、mocks 分层、E2E 与覆盖率体系，避免过度设计。|

## 设计决策

|决策点|选择|理由|
|-|-|-|
|详细规范位置|新增 `docs/harness/frontend-testing.md`|测试原则与 checklist 是长期架构规则，不应塞入 60 行预算的 AGENTS。|
|稳定事实位置|`frontend-context.md` 记录工具链、配置、命名和命令|供每次前端修改前快速获取当前真实状态，不承载流程正文。|
|TDD 触发|AGENTS 在“新增或改变 `web/src/**` 行为”时要求调用 `test-driven-development` skill|保持现有动作触发模型；纯样式改动不强制编写单元测试。|
|质量门禁|根 `check:all` 在构建前运行 `npm run test --workspace=web`|测试失败不能被静态检查或构建掩盖。|
|测试目录|同目录 `*.test.ts(x)`|与独立“测试文件同目录改造”需求形成一致规范。|
|mock 边界|默认真实实现；仅 mock 浏览器/网络/时间/第三方 UI 等外部边界，或已单测的适配层|避免把 mock 调用次数误当作业务行为验证。|

## 验收标准

- [x] `docs/harness/frontend-testing.md` 明确工具链、目录命名、TDD、测试类型、mock 边界和执行命令。
- [x] `frontend-context.md` 删除“暂无单元测试”，并记录当前前端测试基础设施与同目录约定。
- [x] AGENTS Default Protocol 对新增或改变前端行为触发 TDD skill，且不把纯视觉样式改动扩大为单元测试义务。
- [x] 根 `npm run check:all` 包含 `npm run test --workspace=web`，并在构建前执行。
- [x] `npm run sync:agents`、`npm run check:all` 通过。
- [x] 用真实需求 prompt 进行 meta 验证，确认规则能导向 TDD、同目录测试和质量门禁。

## 涉及模块

- Harness 文档：`docs/harness/frontend-testing.md`。
- AI 入口与前端上下文：`AGENTS.md`、`.agents/context/frontend-context.md`；命令摘要：`README.md`。
- 构建门禁：根 `package.json`。
- 需求记录：本 spec 与对应 exec-plan。

## 范围外

- 不新增依赖、不改 Vitest 基础配置、不重写既有测试。
- 不增加后端测试、E2E 测试、覆盖率阈值、fixtures 或全局 mock 目录。
- 不改变 demo 目录的生命周期或为它增加特殊规则。
