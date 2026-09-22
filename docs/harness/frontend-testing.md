# 前端测试规范

> 改新增或改变前端行为的代码时必读。工具链与 React 组件测试模式沿用经外部参考项目验证的 Vitest + Testing Library 组合，并按本项目规模裁剪。

## 工具链与命令

|用途|命令|说明|
|-|-|-|
|执行前端测试|`npm run test --workspace=web`|执行一次 Vitest 测试。|
|监听开发|`npm run test:watch --workspace=web`|监听文件变化并重新执行测试。|
|全量门禁|`npm run check:all`|格式、lint、stylelint、前端测试和构建均须通过。|

- 测试框架：Vitest；DOM 环境：jsdom。
- 组件测试：`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`。
- 测试初始化：`web/src/test-utils/vitest.setup.ts`。
- 测试发现配置：`web/vitest.config.ts`。

## 文件组织

|被测源码|测试文件|
|-|-|
|`web/src/utils/copy.ts`|`web/src/utils/copy.test.ts`|
|`web/src/components/MessageList/index.tsx`|`web/src/components/MessageList/index.test.tsx`|
|`web/src/components/Foo/index.tsx`|`web/src/components/Foo/index.test.tsx`|

- 测试文件必须与被测源码同目录，命名为 `*.test.ts` 或 `*.test.tsx`。
- 不使用 `__tests__/` 子目录。
- `*.test.*` 文件必须是有效 Vitest suite；临时示例目录不是测试配置的特殊依赖，删除它无需调整配置。

## 测试先行

新增或改变工具函数、hook、组件交互或数据行为时，按 Red-Green-Refactor 执行：

1. 先写一个只表达单项预期的测试，并确认因缺少目标行为而失败。
2. 编写满足该测试的最小实现，再确认测试通过。
3. 在保持全绿前提下重构；继续下一个行为。

纯布局、颜色或响应式样式变更不强制单元测试，仍按 `frontend-visual-verification` 完成视觉验证。发现 bug 时，先写能复现 bug 的失败测试，再修复代码。

## 测试层级

|对象|重点验证|避免验证|
|-|-|-|
|工具函数|输入、输出、异常分支|内部实现步骤。|
|hook|状态变化、返回 API、边界状态|React 内部实现。|
|组件|用户可见内容、可访问名称、`user-event` 交互和状态结果|CSS Module 哈希、私有 state 细节。|

- 优先使用 `getByRole`、`getByLabelText`、`getByText` 等面向用户的查询。
- 异步交互使用 `userEvent` 并等待可观察结果。
- 不以快照、覆盖率数字或 mock 调用次数替代行为断言。

## Mock 边界

默认使用真实实现。只有以下外部或已隔离边界可 mock：

- 浏览器 API（如 `navigator.clipboard`）、网络、时间、随机性。
- 第三方 UI 反馈或外部服务。
- 已由独立单元测试覆盖的适配层；组件测试可断言其以正确参数被调用。

禁止 mock 被测单元本身，或为了让测试通过而添加仅供测试使用的生产 API。

## 提交前检查

- [ ] 新增或改变的行为具有同目录测试，且已观察到预期的 Red → Green。
- [ ] `npm run test --workspace=web` 通过。
- [ ] `npm run check:all` 通过。
- [ ] 涉及 UI 结构或样式时，已完成对应等级的视觉验证。
