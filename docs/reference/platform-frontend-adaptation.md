# 前端设备与平台适配指南

配套 Skill：[platform-frontend-adaptation](../../.agents/skills/platform-frontend-adaptation/SKILL.md)。用户表达设备适配、平台兼容、系统识别、PC/H5 分流或 Native/WebView 降级意图时使用，不要求点名 Harmony。

## 1. 范围与模型

本指南覆盖 Harmony、Windows、macOS、Android、iOS、Linux 的前端识别与适配。公共实现位于 [`web/src/utils/browser.ts`](../../web/src/utils/browser.ts)，不负责原生工程构建、设备安装、证书代理或硬件识别。

|维度|字段|值|
|-|-|-|
|操作系统|`os`|`harmony / windows / macos / android / ios / linux / unknown`|
|默认页面形态|`pageType`|`pc / h5 / unknown`|
|运行容器|`runtime`|`native / web / unknown`|
|Harmony 终端观测|`harmonyTerminal`|`pc-native / pc-web / phone-web / null`|

pc/h5 是「页面形态」，与「运行容器」（native/web）是两个正交维度，不是互斥的平台列表。Android Native 内的移动 Web 页面可以同时是 `h5` 和 `native`。手机与平板默认归入 H5；页面形态不是实时视口宽度，也不代表设备品牌、机型或物理屏幕尺寸。

`unknown` 表示证据不足，不等于 PC、Web 或非 Native。UA 和宿主字段都只用于前端适配，不作为鉴权、安全或可信设备证明。任意 UA 完全伪装时，没有额外信号就无法可靠还原真实系统。

职责：`browser.ts` 只提供识别结果；页面组织展示文案；具体功能检查所需 API；业务层维护自己的请求协议。

## 2. 公共接口

### 调用方式

调用方参考示例（实际消费方式见 [`App.tsx`](../../web/src/App.tsx)，其他目录调整相对路径）：

```ts
import { detectPlatform, getPlatformInfo } from "./utils/browser";

const platform = getPlatformInfo();
const isHarmony = platform.os === "harmony";
const isAndroid = platform.os === "android";
const isIOS = platform.os === "ios";
const isMacOS = platform.os === "macos";
const isWindows = platform.os === "windows";
const isPC = platform.pageType === "pc";
const isH5 = platform.pageType === "h5";
const isNative = platform.runtime === "native";

const parsed = detectPlatform({
  userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile",
});
// { os: "android", pageType: "h5", runtime: "unknown", harmonyTerminal: null }
```

不在调用方重复 UA 正则；需要多个判断时消费同一个 `getPlatformInfo()` 结果，避免混用实时 UA 和宿主信号。

### 输出契约

模块导出 `PlatformOS`、`PageType`、`PlatformRuntime`、`HarmonyTerminal`、`PlatformInfo`、`PlatformHostHint`、`PlatformInput` 类型，契约如下：

```ts
interface PlatformInfo {
  os: PlatformOS;
  pageType: PageType;
  runtime: PlatformRuntime;
  harmonyTerminal: HarmonyTerminal | null;
}

interface PlatformHostHint {
  os?: Exclude<PlatformOS, "unknown">;
  pageType?: Exclude<PageType, "unknown">;
  runtime?: Exclude<PlatformRuntime, "unknown">;
}

interface PlatformInput {
  userAgent: string;
  maxTouchPoints?: number;
  harmonyPcWebHint?: boolean;
  host?: PlatformHostHint;
}
```

- `detectPlatform(input)` 是纯解析，只读取传入数据；不读取页面 UA、模板变量、视口或 bridge。
- `getPlatformInfo(host?)` 每次读取当前 `navigator.userAgent`，为空时依次回退 `navigator.vendor`、`window.opera`、空串；同时读取 `maxTouchPoints` 与 `window.__IS_HARMONY__ === true`，再调用同一解析核心。
- 无 `navigator/window` 时可安全导入和调用；没有其他输入时返回未知结果。
- `PlatformHostHint` 是接入方显式传参契约，不是已存在的全局注入字段。异步宿主信息由实际接入方获取后再传入，工具不自动订阅或调用未知接口。
- `harmonyTerminal` 仅由 UA 特征与模板信号得出；宿主覆盖不改变该字段，分流判断以三维度为准，避免混用产生矛盾结论。

### 宿主契约

宿主 = 页面所在的原生容器；它的价值在于 UA 不足信时，提供一个比 UA 更可信、但需要接入方自己取得并显式传入的信息来源。

因为 UA 会撒谎。典型例子：鸿蒙 PC 浏览器把 UA 完全伪装成普通 Windows Chrome，前端光看字符串不可能还原真实系统。但如果宿主（原生客户端）通过自己的可信渠道（bridge、注入的请求信号等）知道真实环境，接入方就能把确认结果显式传给识别工具，覆盖 UA 的误判 —— 这就是 `PlatformHostHint`。

当前 chatbot 项目还没有真实宿主接入（`host` 参数是零业务使用状态），这套契约是为接入预留的。

### 优先级

1. UA 先识别 Harmony，再识别 Android/iOS、Windows/macOS/Linux。
2. 未识别到明确 Harmony 终端时，只有 `window.__IS_HARMONY__ === true` 才补判 Harmony PC Web；字符串 `"true"` 等无效。明确 Harmony Native/Phone 等优先于该模板信号。
3. 最后逐字段应用显式宿主声明，仅覆盖有效的 `os/pageType/runtime` 值；非法字段忽略，未提供的维度保留前面的结果。宿主改变系统不自动改变页面形态，应传全实际要覆盖的维度。

## 3. 平台识别表

|输入特征|os|pageType|runtime|
|-|-|-|-|
|Harmony PC Native 特征（`X11; OHOS` / `OHOSHarmonyOS`）|harmony|pc|native|
|Harmony PC / 2in1 / UU PC 特征|harmony|pc|web|
|Harmony Phone / Mobile 特征|harmony|h5|web|
|只有 Harmony 系统标记|harmony|unknown|unknown|
|未识别到明确 Harmony 终端 + 模板信号 `window.__IS_HARMONY__ === true`|harmony|pc|web|
|Android UA，含平板|android|h5|unknown|
|iPhone / iPad / iPod UA|ios|h5|unknown|
|Macintosh 且 `maxTouchPoints > 1`|ios|h5|unknown|
|Windows 桌面 UA|windows|pc|unknown|
|Macintosh / Mac OS X 桌面 UA|macos|pc|unknown|
|Linux 桌面 UA|linux|pc|unknown|
|Windows / macOS / Linux UA + 移动端标记（如 `Windows Phone`）|windows / macos / linux|h5|unknown|
|未知系统但有移动端 UA 特征|unknown|h5|unknown|
|无可识别特征或空 UA|unknown|unknown|unknown|
|Android UA + 宿主声明 `host.runtime: "native"`|android|h5|native|

注意：

- 表中的行序与 UA 识别优先级一致，同一 UA 特征命中多行时取靠前行的结果
- 匹配规则/输入格式——所有 UA 匹配忽略大小写，宿主字段使用表中小写枚举
- 可信度边界——iPad 桌面 UA + 多触点只是兼容启发式，不是可信设备证明
- 固定 UA 分析不传触点时仍可能得到 macOS，宿主可以明确覆盖
- 禁止信号源边界——不要用 `navigator.platform` 识别 Harmony，也不要只靠触摸能力判断所有设备
- 证据不足——普通 Chrome/Safari 样式 UA、Android `wv` 或缺少 Safari 标记，都不能可靠确认 Native/Web 容器，没有足够证据时返回 `unknown`
- 当前 `web` 来自识别表中已确认的 Harmony Web 终端规则、模板信号或显式宿主声明，并非通用浏览器鉴真

## 4. 页面分流与响应式

- 确认需要独立 PC/H5 页面分流时使用 `platform.pageType`。`pc` 走 PC 分支，`h5` 走 H5 分支，`unknown` 保留调用方原有回退。
- Harmony 的 PC Native / PC Web 页面形态均为 PC，Phone Web 为 H5。
- 页面分流只消费 `pageType`，不用移动端判断取反得到 PC；未知系统也可能有移动端 UA 特征。
- CSS 媒体查询负责空间约束和响应式。PC 窗口缩窄仍是 PC，手机横屏不会变成 Windows。识别结果不用于关闭所有窄屏适配。
- 工具不会自动改 CSS、切换路由或注入业务字段；必须核对实际调用方。本项目页脚消费结果不代表整页已实现独立 PC/H5 分流。
- 展示文案由页面映射。例如 `macos + pc + unknown` 显示 `macOS · PC`，不无依据地显示 `PC Web`。

## 5. Native/WebView 宿主与能力降级

明确、已验证的 Native 宿主可提供 `PlatformHostHint`。以下是输入演示，不代表当前项目已对接 Android 客户端：

```ts
const platform = detectPlatform({
  userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile",
  host: { os: "android", pageType: "h5", runtime: "native" },
});
```

当前项目不提供通用宿主注入器，不自动访问 `ucapi`、`quantum` 或其他 bridge，也不把 `window.chrome` 存在当作 Native。

Harmony Native 不保证具有 Mac/Windows 客户端的全部 `chrome.*`、`ucapi` 或 `quantum` API，其他系统同理。`runtime === "native"` 与“目标 API 可调用”是两件事；`runtime === "unknown"` 也不应阻止具体能力检测。

必须从安全的全局对象入口检查到具体方法，用 `unknown` 表示尚未核实签名的成员。

namespace 缺失、method 缺失、Promise pending、Promise reject 应分别记录。接入调用前确认真实签名、调用上下文与权限；Native Promise 调用应有超时和 Web 降级，避免 pending 阻断页面。超时不等于已取消底层 IPC，也不保证写操作没有发生，不能盲目重复执行有副作用的操作。pending 时结合客户端日志核查 IPC channel、handler 与回包。

本模块仅识别环境，不提供未知业务 API 的通用调用器或假成功返回值；具体降级放在实际功能边界，并配套测试。

## 6. Harmony 专项

### 终端与 UA

|终端|UA 关键特征|`harmonyTerminal`|页面形态|
|-|-|-|-|
|Harmony PC Native|`(X11; OHOS x.y)`（新版）或 `OHOSHarmonyOS`（旧版）|`pc-native`|`pc`|
|Harmony PC Web|`(PC; OpenHarmony x.y; ...)`、`ArkWeb`，或 UU 浏览器的 `OHOS x86_64`|`pc-web`|`pc`|
|Harmony Phone Web|`Phone`、`OpenHarmony x.y`、`Mobile`|`phone-web`|`h5`|

真机 UA 示例：

```text
# Harmony PC Web
Mozilla/5.0 (PC; OpenHarmony 6.1; Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.115 HuaweiBrowser/6.1.7.302

# Harmony PC Web（UU 浏览器）
Mozilla/5.0 (OHOS; OHOS x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36

# Harmony Phone Web
Mozilla/5.0 (Phone; OpenHarmony 6.1; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.117 Mobile HuaweiBrowser/6.1.1.352
```

UA 判断顺序为 Harmony Native → Harmony PC Web → Harmony Phone Web → Android/iOS → Windows/macOS/Linux。Harmony PC Web 的 `Windows NT`、Phone Web 的 `Android` 和新版 Native 的 `X11` 都不能先作为普通系统分流依据。新版 Native 必须识别 `OHOS`，旧的 `/HarmonyOS|OpenHarmony/` 不足以覆盖。

UU 浏览器无 `PC/OpenHarmony/ArkWeb` 标记，使用其明确的 `(OHOS; OHOS x86_64)` 特征。不要把任意包含 `OHOS` 的 UA 都判为 PC Web。`2in1` 是已有 PC 终端特征；Native 优先于 PC，PC 优先于 Phone/Mobile。

### 模板兜底

PC Web 完全伪装成 Windows Chrome 时，仅当页面模板按可信请求信号同步注入 `window.__IS_HARMONY__ = true` 才能补判为 Harmony PC Web。当前 chatbot 未实现该注入，无信号时统一入口按 Windows UA 解析，终端为 `null`。

不使用 Worker、iframe、字体、GPU、CPU 或 `navigator.platform` 猜测 Harmony；Harmony PC Web 实测 `navigator.platform` 可能为 `Linux x86_64`。UA 标记判断始终是纯解析，不能代替当前环境识别。

## 7. 请求与业务协议边界

请求异常先核对真实 URL、请求体、状态码及返回内容，再回到实际数据流定位，不自动归因于系统识别。本项目通过 `POST /api/chat` 发送 `messages` 并消费 SSE，契约以 [`App.tsx`](../../web/src/App.tsx) 和 [`server.js`](../../server/server.js) 为准。

chatbot 未接入鉴权或埋点。`fr`、`device`、`chat_client`、`getFr()` 不属于公共识别结果，不因为设备适配而新增接口字段，也不自动接入外部业务协议。

## 8. 常见问题与提交前检查

|现象|检查方向|
|-|-|
|Harmony PC 被当作 Windows/Android/Linux|核对统一入口结果和识别优先级，不绕过公共方法|
|iPad 桌面 UA 被判 macOS|核对触点输入和宿主声明，说明启发式边界|
|PC 窗口变窄后布局异常|分别检查 `pageType` 与 CSS 断点，不把视口当作系统|
|只有 UA 无法判断 Native/Web|保留 `unknown`，核对实际宿主契约和具体能力|
|Native 功能无响应|区分 namespace/method 缺失、pending、reject，并检查超时与降级|
|对话请求异常|检查实际请求和 SSE，不套用其他项目业务协议|
|普通 Windows UA 怀疑为 Harmony|检查模板信号，无信号时不继续猜测|

提交前按本次改动范围核对：

- Harmony PC Native / PC Web / Phone Web 及 UU、2in1 识别不回归。
- Windows、macOS、Android、iOS、Linux、iPad 桌面 UA 的系统和页面形态符合`平台识别表`。
- 显式宿主字段、模板优先级和非法字段均有测试；未知值不会被强行归类。
- 纯解析不读取全局；当前入口实时读取；无浏览器环境可导入。
- 页面确实消费公共结果，文案在展示层；CSS 与平台分流分别验证。
- 本次若接入 Native API，缺失、超时或拒绝不阻断页面，Web 降级有验证证据。
- 业务请求遵循本项目真实契约，不套用其他项目的终端约定。
- 区分单元测试、模拟 UA、真实设备和真实宿主验证；只完成工具测试时不声称实机适配完成。

运行工具单测：`npm run test --workspace=web -- src/utils/browser.test.ts`。仓库逻辑改动执行 TDD；涉及视觉/交互时执行 [前端视觉验证](../../.agents/skills/frontend-visual-verification/SKILL.md)。Skill 改动后运行 `npm run sync:agents`、`npm run check:all`，并在重新加载技能目录的会话验证真实触发。

## 9. 文档修改之后检查

1. 是否与 `browser.ts` 实现保持一致
2. 是否需要同步修改 `.agents/skills/platform-frontend-adaptation/SKILL.md`
