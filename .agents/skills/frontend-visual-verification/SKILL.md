---
name: frontend-visual-verification
description: 前端布局/样式/响应式/交互改动的视觉验证流程，分 4 档执行。改 web/src/** 涉及视觉/布局/样式/交互后必跑，check:all 通过 ≠ 视觉无 bug，本 skill 补齐视觉关卡。
---

# Frontend Visual Verification（4 档）

## 何时使用

满足以下**任一条件**即必须跑本 skill：

- 改 web/src/** 涉及布局/样式/响应式/交互
- 改 `*.module.less` / `index.css` / 内联样式
- 改 flex/grid/width/height/position/breakpoint
- 改 hover/focus/active 等交互态样式
- 改组件 JSX 结构且影响视觉

**不触发**（只需 `npm run check:all`）：

- 仅改动业务逻辑（无样式变化）
- 仅新增/修改类型定义
- 仅修改 hook 内部逻辑且 UI 行为不变

## 4 档选择

| 档位 | 工具 | 何时用 | Token 成本 |
|------|------|--------|----------|
| **T1：DOM 探针** | `playwright` evaluate | 默认档。验证元素位置/尺寸/可见性 | 极低（无截图）|
| **T2：单截图** | `chrome --headless --screenshot` 或 playwright 1 context | 只需确认一个视口的整体效果 | 低 |
| **T3：多断点** | playwright 3 context（1440/900/480）| 改响应式 / 不确定各视口表现 | 中 |
| **T4：完整交互** | T3 + hover / 展开 / 收起 | 改交互态 / 浮动面板 / 抽屉 | 高 |

**默认从 T1 开始，发现可疑升级到 T2，再升级到 T3/T4**。不要默认开 T3/T4。

---

## T1：DOM 探针（默认档）

不启动 dev server，用 page.evaluate 直接读 DOM。

**适用**：纯布局/尺寸验证，agent 推理可信

**页面来源**：连接已运行的 dev server（`npm run dev:web`，端口 5173）或构建产物（`npm run build:web && npm run preview --workspace=web`，端口 4173）。

```js
// 1. 确认服务在跑（dev server 用 5173，preview 用 4173）
// 2. page.goto 加载页面（按实际来源选端口）
await page.goto('http://localhost:4173/');  // preview 产物
// await page.goto('http://localhost:5173/');  // dev server
// 3. playwright evaluate 读关键元素的 boundingClientRect
const rects = await page.evaluate(() => ({
  sidebar: document.querySelector('aside')?.getBoundingClientRect(),
  container: document.querySelector('[class*="container"]')?.getBoundingClientRect(),
  // ...按需添加
}));
```

**判定**：所有 rect.w/h 与预期一致即通过

---

## T2：单截图

```bash
# 启动 dev server（后台运行）
npm run dev:web &
sleep 3

# 单视口截图
node -e "
  const { chromium } = require('playwright');
  (async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173/');
    await page.screenshot({ path: '/tmp/t2.png' });
    await browser.close();
  })();
"
```

读图判断整体效果，OK 即过。

---

## T3：多断点

1440 / 900 / 480 三断点各截一张：

```bash
# 参考早期写好的 visual-verify.js 脚本模式
# 脚本路径: scripts/visual-verify.js（如不存在则用下方内联命令）
# 三 viewport 串行，每个 waitForTimeout(2000) 后截图
node -e "
  const { chromium } = require('playwright');
  (async () => {
    const browser = await chromium.launch();
    const viewports = [{w:1440,h:900},{w:900,h:900},{w:480,h:900}];
    for (const v of viewports) {
      const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
      await page.goto('http://localhost:5173/');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/t3-' + v.w + '.png' });
      await page.close();
    }
    await browser.close();
  })();
"

对比三张图，按需调整。

---

## T4：完整交互

T3 基础上加：

- hover 触发器（如问题历史面板）
- 展开/收起动画
- 表单 focus 态
- 任何用户操作后的状态变化

每个状态都截图 + DOM 探针双重确认。

---

## 流程（按档执行）

1. **确认 dev server**：`npm run dev:web &` 后台运行；或确认是构建产物
2. **选档**：T1 默认；按需升级
3. **执行**：跑对应档
4. **判定**：与需求/原设计对比
5. **升级或通过**：发现可疑 → 升档再验；否则通过
6. **静态检查关卡**：通过后跑 `npm run check:all`

## 失败处理

| 现象 | 处理 |
|------|------|
| T1 测出尺寸异常 | 修代码，回到步骤 2（可能升 T3 确认）|
| T2 截图与需求不符 | 升 T3 看多视口 |
| T3 某断点异常 | 修 @media，回到 T1 重测 |
| T4 交互异常 | 修事件/状态机，回到 T1 |
| check:all 报错 | 先修静态，再回 T1 |
| dev server 起不来 | 检查端口/依赖 |
| playwright 不可用 | 降级：`curl localhost:4173`（preview）或 `curl localhost:5173`（dev）+ 提示用户自查 |

## 关键原则

- **默认 T1，怀疑才升档**。一次布局 bug 修复不需要 T3 全套
- **check:all 通过 ≠ 视觉无 bug**。静态检查看不到布局/遮挡/响应式问题
- **修复后再测**。升档测试时多断点 + 交互态都重测
- **截图成本高**。三断点 × 三状态 = 9 张图/token，能 T2 解决就别上 T3

---

**This skill works if**: 改完前端代码后，agent 主动想「该跑视觉验证了」，并能根据场景选对档位。
