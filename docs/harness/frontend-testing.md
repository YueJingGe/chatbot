> 不只是口头提倡 TDD，而是把 Red-Green-Refactor 写进 AI 协作入口，让它在正确的时间被自动触发。

## 一、什么是测试先行

测试先行（Test-Driven Development，TDD）不是**先写代码再补测试**，而是：

1. 先写一个会失败的测试（Red）。
2. 运行它，确认它因为目标行为缺失或 bug 存在而失败。
3. 写最少代码让测试通过（Green）。
4. 在测试全绿的前提下重构（Refactor）。

一句话概括：**没有先失败的测试，就不写生产代码。**

在我的项目里，TDD 被写进了 `.agents/skills/test-driven-development/SKILL.md`，作为 AI 协作的默认动作之一。它不是为了追求覆盖率，而是为了在 AI 频繁参与编码时，把"改动必须可验证"变成机械习惯。

<!-- 截图：TDD skill 首页的 Red-Green-Refactor 流程图与铁律 "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST" -->

## 二、为什么 AI 协作项目更需要 TDD

AI 写代码很快，但也容易：

- 顺手改多：你以为它只修了一个按钮状态，结果它把附近三四个文件都动了。
- 证据缺失：它说"修复完成"，但你不知道它有没有先复现 bug。
- 回归隐蔽：实现通过了，但旧行为被悄悄破坏。

TDD 的"先失败、再实现"正好克制这些问题：

- **测试是契约**：AI 在动手前必须先理解"期望行为是什么"。
- **失败是证据**：没有 Red 输出，就不能声称 bug 已修复。
- **回归被即时捕获**：每次改完跑全量测试，break 立刻暴露。

## 三、为测试先行做了哪些设计

### 1. 工具链：和 Vite 同生态

前端测试栈选的是 Vitest + `@testing-library/react` + `@testing-library/jest-dom` + jsdom。

```ts
// web/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-utils/vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
  },
});
```

```ts
// web/src/test-utils/vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

<!-- 截图：web/vitest.config.ts 与 test-utils/vitest.setup.ts 的 IDE 并排视图 -->

### 2. 文件组织：测试与源码同目录

不建 `__tests__/` 目录，测试文件和被测源码放一起：

<!-- 截图：VS Code 资源管理器展示 utils/、components/InputArea/、components/MessageList/ 下同目录的 .test 文件 -->

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/7482f99eb9394f378b6ca1909e366a6d~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgcmV2aWV3NDQ1NDM=:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMjUyNDEzNDQyNjgxOTIzMCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1790326554&x-orig-sign=3U2TUba6QiG5WEUs3xIgwf6xqKU%3D)

这样找测试不需要跳转目录，AI 在改源码时也能立刻看到同目录的测试约束。

### 3. 规则落点：Skill + 门禁 + 文档/计划三层互锁

`AGENTS.md` 是 AI 进入项目时的入口，里面用 **按改动类型触发** 的方式规定：

> - 改 web/src/** 逻辑：读 `.agents/context/frontend-context.md` + `docs/harness/frontend-rules.md`；新增、修改或修复组件、hook、工具函数、状态或交互行为时调 `test-driven-development` skill，并补/改同目录 `*.test.ts(x)`

TDD 不是一份 Skill 文件就能讲完的事，而是**三层互锁**：

|层级|含义|职责|载体|
|-|-|-|-|
|Skill 层|即时行为指令：执行 Red-Green-Refactor|怎么做|`.agents/skills/test-driven-development/SKILL.md`|
|门禁层|机器兜底：提交前检查逻辑文件是否带同目录测试|有没有做|`scripts/check-frontend-tdd.mjs` + husky pre-commit/pre-push|
|文档/计划层|保留上下文与验收标准，引用 Skill 和门禁而不重复规则|为什么这么做|`docs/harness/frontend-testing.md`、spec/exec-plan 模板|

### 4. 质量门禁：check:all 与 TDD 专检

根目录的 `package.json` 把测试串进聚合门禁：

```json
"check:all": "npm run check:harness && npm run check:frontend-tdd && npm run format:check && npm run lint:check && npm run stylelint:check && npm run test --workspace=web && npm run build:web"
```

`check:frontend-tdd` 是 TDD 专检：对本次 git 变更中 `web/src/**` 的逻辑文件，检查同目录是否存在 `*.test.ts(x)`；`fix` 类提交还必须带有测试文件变更。它被挂在 `.husky/pre-commit` 和 `.husky/pre-push` 上，作为机器兜底。

任何改动完成，必须通过 harness 自检、TDD 专检、Prettier、ESLint、Stylelint、前端测试和构建，才算闭环。

<!-- 截图：终端执行 npm run check:all 全绿的输出 -->

## 四、TDD 什么时候被触发

项目里判定是否走 TDD：**不看用户 prompt 里有没有出现"TDD"三个字，而是看代码改动的性质**。

必须走 TDD 的情况：

- 新增功能 / 新组件 / 新工具函数
- 修复 bug（含恢复预期行为）
- 修改行为、交互或数据流
- 重构

不强制单元测试的情况：

- 纯样式 / 布局 / 响应式改动（改走 `frontend-visual-verification` 视觉验证）
- 配置改动
- 类型声明改动
- 文档改动

这个口径被写进了 `AGENTS.md` 和 `docs/harness/frontend-testing.md`，避免 AI 因为用户措辞不同而漏执行。

<!-- 截图：docs/harness/frontend-testing.md 中"测试先行"与"Bug Fix 的 TDD 要求"章节 -->

## 五、触发之后都做了什么

一旦判断需要 TDD，AI 会按下面的顺序执行：

1. **读上下文**：先读 `frontend-context.md` + `frontend-rules.md` + `test-driven-development/SKILL.md`。
2. **写测试**：根据需求或 bug 写一个最小测试。如果是 bug，测试要能复现 bug。
3. **跑测试拿 Red**：运行单文件测试，确认失败原因是"行为缺失"或"bug 存在"，而不是拼写错误。保留失败输出。
4. **写最小实现**：只写让测试通过的代码，不提前设计。
5. **跑测试拿 Green**：确认测试通过，且其他测试没坏。
6. **重构（可选）**：在测试全绿下清理代码。
7. **跑 check:all**：通过完整质量门禁。

整个过程的核心不是"有测试"，而是**测试必须先失败，并且失败原因被确认**。

<!-- 截图：终端中先失败（Red）再成功（Green）的测试输出对比 -->

## 六、四个验收场景

下面是项目里真实跑过的 4 个场景，分别对应新增函数、修 bug、改组件行为、重构。

### 场景 1：新增纯工具函数

任务：新增 `truncateText(text, maxLength)`，文本超过 `maxLength` 时截断并追加省略号。

过程：

- 先写 `web/src/utils/truncateText.test.ts`，4 个用例：短于阈值、等于阈值、超长截断、空字符串。
- 运行 `cd web && npm run test -- src/utils/truncateText.test.ts`，Red：模块不存在，失败。
- 实现 `web/src/utils/truncateText.ts`：当 `text.length <= maxLength` 时原样返回，否则 `text.slice(0, maxLength) + "…"`。
- 复跑测试，Green：4 passed。
- 跑 `npm run check:all`，全绿。

这里还暴露了一个需求歧义：省略号是否计入 `maxLength`？写测试时就必须拍板。项目采用字面解释——截满 `maxLength` 个字符后再追加省略号，结果总长为 `maxLength + 1`，并在交付时显式声明该假设。

```ts
// web/src/utils/truncateText.test.ts（示意）
import { describe, expect, it } from "vitest";
import { truncateText } from "./truncateText";

describe("truncateText", () => {
  it("returns original text when shorter than maxLength", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  it("returns original text when equal to maxLength", () => {
    expect(truncateText("hello", 5)).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateText("hello world", 5)).toBe("hello…");
  });

  it("returns empty string for empty input", () => {
    expect(truncateText("", 5)).toBe("");
  });
});
```

<!-- 截图：truncateText 先 Red（模块不存在）再 Green（4 passed）的终端输出 -->

### 场景 2：Bug 修复

任务：修复 `copyToClipboard`，当 `navigator.clipboard.writeText` 抛错时，降级使用 `document.execCommand('copy')`。

原 `copy.ts` 只走现代 Clipboard API，一旦 `writeText` 被拒绝就直接抛错，没有降级路径。

过程：

- 在 `copy.test.ts` 新增两个失败测试：writeText reject 时走 execCommand、execCommand 返回 false 时抛"复制失败"。
- 运行 `npm test -- copy.test.ts`，Red：测试直接抛出 `Error: denied`。
- 改 `copy.ts`：writeText 成功走原路径；抛错时进入 `copyWithExecCommand` 降级——创建离屏 textarea、选中文本、执行 `document.execCommand("copy")`、移除 textarea、恢复原有选区；execCommand 返回 false 时显式抛错，避免静默失败。
- 复跑测试，Green：4 个用例全过。
- 跑 `npm run check:all`。

```ts
// web/src/utils/copy.test.ts（新增用例示意）
it("falls back to document.execCommand when writeText rejects", async () => {
  const writeText = vi.fn().mockRejectedValue(new Error("denied"));
  Object.assign(navigator, { clipboard: { writeText } });
  const execCommand = vi.fn().mockReturnValue(true);
  Object.assign(document, { execCommand });

  await copyToClipboard("hello");

  expect(execCommand).toHaveBeenCalledWith("copy");
});
```

<!-- 截图：copy.test.ts 中 execCommand 降级用例的 Red 与 Green 终端输出，保留失败证据 -->

### 场景 3：组件行为变化

任务：改造 `MessageList` 组件，让 AI 回复中的 markdown 在气泡里正常渲染（换行、列表点、粗体、代码块）。

原实现把 `message.content` 直接当纯文本输出，HTML 会折叠换行符，markdown 标记也不解析。

过程：

- 先写 `web/src/components/MessageList/index.test.tsx`，追加 3 个用例：无序列表产出 `li`、代码块产出 `pre+code`、粗体产出 `strong`。
- 运行单文件测试，Red：内容仍以纯文本形式输出，缺少对应节点。
- 实现：引入 `react-markdown`，把消息内容交由其渲染。
- 复跑测试，Green：7 passed。
- 样式补充：`.bubble` 下新增 p 段间距、ul/ol 缩进与列表标记、li 行距、a 链接色、blockquote 左边框。
- 跑 `npm run check:all`。

最严格的一步是：用户后来要求"按 TDD 重新做一遍"，于是用 `git checkout` 只回滚 `index.tsx` 与 `index.module.less` 两个实现文件、保留测试文件，构造出真实的"有测试无实现"状态。再次运行测试，3 个 markdown 渲染用例失败；重新实现后又 7 passed。这才是可验证的红→绿。

```tsx
// web/src/components/MessageList/index.test.tsx（新增用例示意）
it("renders unordered list items from markdown dashes", () => {
  const markdown = "- 第一项\n- 第二项";
  render(<MessageList messages={[{ id: "md-list", role: "assistant", content: markdown }]} />);

  const listItems = screen.getAllByRole("listitem");
  expect(listItems).toHaveLength(2);
  expect(listItems[0]).toHaveTextContent("第一项");
});
```

<!-- 截图：MessageList 测试 Red（3 个 markdown 用例失败）到 Green（7 passed）的对比，含二次重做那次的终端输出 -->

### 场景 4：重构

任务：从 `App.tsx` 中抽取滚动到底部判断逻辑，复用到多个地方。

过程：

- 写 `web/src/utils/scroll.test.ts`，覆盖 30px 阈值边界：已在底部、阈值内、31px 外、远离底部、滚过底部。
- Red：`scroll.ts` 不存在，失败。
- 抽取 `checkIsAtBottom` 到 `web/src/utils/scroll.ts`。
- 更新 `App.tsx` 导入并使用新工具函数。
- Green：单文件测试通过，再跑 `npm run check:all`。

```ts
// web/src/utils/scroll.test.ts
import { checkIsAtBottom } from "./scroll";

function createElement(scrollHeight: number, scrollTop: number, clientHeight: number): HTMLElement {
  return { scrollHeight, scrollTop, clientHeight } as HTMLElement;
}

describe("checkIsAtBottom", () => {
  it("returns true when within the 30px threshold", () => {
    const element = createElement(1000, 670, 300);
    expect(checkIsAtBottom(element)).toBe(true);
  });

  it("returns false when 31px away from the bottom", () => {
    const element = createElement(1000, 669, 300);
    expect(checkIsAtBottom(element)).toBe(false);
  });
});
```

```ts
// web/src/utils/scroll.ts
export function checkIsAtBottom(element: HTMLElement) {
  const threshold = 30;
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}
```

<!-- 截图：scroll.test.ts 边界用例与 Red→Green 的终端输出 -->

## 七、门禁层：机器兜底

TDD 治理有机器兜底：`scripts/check-frontend-tdd.mjs`。

它检查两件事：

1. 本次变更的 `web/src/**` 逻辑文件是否带同目录 `*.test.ts(x)`。
2. `fix` 类提交是否同时变更了测试文件。

检查范围排除了入口文件、`.d.ts`、测试文件本身和纯类型/样式改动。pre-commit 检查工作区/暂存区变更，pre-push 检查 `origin/main..HEAD` 区间变更，两者共用同一份脚本。

门禁能证明"测试存在 + 测试通过"，但证明不了"测试先失败"。Red 证据仍由 Skill 执行层和计划验收层负责。

## 八、验收效果

4 个场景跑完后，项目里的测试与质量门禁状态：

|场景|Red 证据|Green 证据|check:all|
|-|-|-|-|
|新增 truncateText|模块不存在|4 passed|通过|
|修复 copy 降级|直接抛出 Error: denied|4 passed|通过|
|MessageList markdown 渲染|3 个用例失败（纯文本输出）|7 passed|通过|
|抽取 scroll 工具|模块不存在|边界用例通过|通过|

更深层的效果：

- **需求歧义在 Red 阶段就暴露**：写测试时就会发现"超长截断加省略号"到底包不包含省略号在内。
- **AI 不会顺手改多**：测试只描述期望行为，AI 只写让测试通过的代码，越界改动自然变少。
- **回归有门**：每次提交前 `lint-staged` 会跑 `npm run test:changed`，CI 再跑全量 `check:all`。

<!-- 截图：四个场景验收表的汇总图，可拼接 4 个终端输出为一张长图 -->

## 九、踩坑与反思

### 1. 触发条件按改动性质判定

TDD 是否触发，不看 prompt 里有没有出现"测试""TDD"等词，只看代码改动的性质。新增功能、修 bug、改行为、重构必须走 TDD；纯样式、配置、类型、文档改动不强制单元测试。

### 2. 必须保留 Red 证据

口头说"我先写了测试再实现"不足信。项目要求：修 bug 时必须保留测试失败的命令输出或截图，否则不算 TDD。`MessageList` 那次重做就是典型案例——首轮虽实际先写了测试，但因为没单独展示红灯输出，被要求回滚实现重新跑一次。

### 3. Mock 用多了会测假行为

`.agents/skills/test-driven-development/testing-anti-patterns.md` 里专门列了反模式：

- 不要测 mock 行为。
- 不要为测试专门加生产方法。
- 不要"为了保险"乱 mock。

项目目前工具函数简单，默认用真实实现；只有浏览器 API、网络、时间等边界才 mock。

<!-- 截图：testing-anti-patterns.md 中 Iron Laws 与反模式表格 -->

## 十、结语

测试先行在这个项目里不是"提倡"，而是一套可被机器执行的协作规则：

- 入口规则（AGENTS.md）决定**什么时候触发**。
- 专项 skill（test-driven-development/SKILL.md）决定**触发后怎么做**。
- 门禁层（`check-frontend-tdd`）决定**有没有被绕过**。
- 文档/计划层决定**验收时引用什么**。
- 质量门禁（`check:all`）决定**最终能否通过**。
- 失败证据决定**是否真正先测后写**。

对于 AI 参与编码的团队，这套机制的价值不在于写更多测试，而在于把"可验证"前置为默认动作。当 AI 每次改代码前都必须先回答"期望行为是什么"，它离乱动就差了一步测试的距离。

---

**项目信息**：AI 对话机器人前端，React + TypeScript + Vite，Vitest + Testing Library 测试栈，monorepo 由 npm workspaces 管理。
