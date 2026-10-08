# Harmony PC 前端适配指南

本文说明当前 chatbot 项目的 Harmony 终端识别、PC/H5 分流和 Native API 能力检测规则，不定义外部项目的业务协议。

## 配套 Skill

- 入口文件：[`.agents/skills/harmony-frontend-adaptation/SKILL.md`](../../.agents/skills/harmony-frontend-adaptation/SKILL.md)
- 使用方式：在需求中说明 Harmony 终端判断、PC/H5 分流或 Native API 能力检测与降级问题，或明确要求使用 `harmony-frontend-adaptation` Skill。

## 1. 统一识别终端

公共工具位于 [`web/src/utils/browser.ts`](../../web/src/utils/browser.ts)，导出 `getHarmonyTerminal`、`isHarmonyUserAgent`、`isMobileUserAgent`、`isMobile`、`isWindowsUserAgent`、`isWindows` 和 `HarmonyTerminal` 类型。不要在业务代码中重复写 UA 正则。

导入路径须相对于调用文件；以下示例位于 `web/src/App.tsx`，其他位置应调整路径：

```ts
import { getHarmonyTerminal } from "./utils/browser";

const terminal = getHarmonyTerminal();
// 'pc-native' | 'pc-web' | 'phone-web' | null

const isHarmony = terminal !== null;
const isHarmonyPC = terminal === "pc-native" || terminal === "pc-web";
const isHarmonyH5 = terminal === "phone-web";
```

公共方法只消费同步信号：先解析明确 UA；当前页面 UA 无法识别时，仅当页面模板注入 `window.__IS_HARMONY__ === true` 才补判为 `pc-web`。显式调用 `getHarmonyTerminal(userAgent)` 时只解析传入 UA，不读取当前页面的模板变量。`isHarmonyUserAgent()` 始终是纯 UA 判断，不能代替当前运行环境的终端判断。

### 终端与 UA

|终端|UA 关键特征|`getHarmonyTerminal()`|页面形态|
|-|-|-|-|
|Harmony PC Native|`OHOS`（新版）或 `OHOSHarmonyOS`（旧版）、`TONGYI_DESKTOP/x.y.z`|`pc-native`|Desktop|
|Harmony PC Web|`(PC; OpenHarmony x.y; ...)`、`ArkWeb`，或 UU 浏览器的 `OHOS x86_64`|`pc-web`|Desktop Web|
|Harmony Phone Web|`Phone`、`OpenHarmony x.y`、`Mobile`|`phone-web`|H5|

真机 UA 示例：

```text
# Harmony PC Native（新版）
Mozilla/5.0 (X11; OHOS 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 TONGYI_DESKTOP/4.1.0.175

# Harmony PC Native（旧版，继续兼容）
Mozilla/5.0 (OHOSHarmonyOS aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 TONGYI_DESKTOP/4.1.0.175

# Harmony PC Web
Mozilla/5.0 (PC; OpenHarmony 6.1; Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.115 HuaweiBrowser/6.1.7.302

# Harmony PC Web（UU 浏览器）
Mozilla/5.0 (OHOS; OHOS x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36

# Harmony Phone Web
Mozilla/5.0 (Phone; OpenHarmony 6.1; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.117 Mobile HuaweiBrowser/6.1.1.352
```

判断顺序必须是 Harmony Native → Harmony PC Web → Harmony Phone Web → Android/iOS → Windows/macOS。Harmony PC Web 的 UA 包含 `Windows NT`，Harmony Phone Web 的 UA 包含 `Android`，顺序错误会导致误判。

新版 Native UA 的 `X11` 不能作为 Linux 分流依据；应先识别 `OHOS` 和 `TONGYI_DESKTOP`。旧的 `/HarmonyOS|OpenHarmony/` 判断无法识别新版 UA，现有平台适配应使用包含 `OHOS` 的公共判断。

UU 浏览器没有 `PC`、`OpenHarmony` 或 `ArkWeb` 标记，公共方法使用其明确的 `(OHOS; OHOS x86_64)` 特征识别为 `pc-web`。不要把任意包含 `OHOS` 的 UA 都判成 PC Web，Native 和 Phone 仍应按各自特征优先识别。

如果 PC Web 的 UA 完全伪装成普通 Windows Chrome，只有宿主已根据可信请求信号同步注入 `window.__IS_HARMONY__ = true` 时，无参调用 `getHarmonyTerminal()` 才能补判为 `pc-web`。当前项目未实现该注入，普通 Windows UA 在无注入时返回 `null`；不能据此宣称已能识别伪装 UA，也不使用 Worker、iframe、字体、GPU、CPU 或 `navigator.platform` 猜测 Harmony。

## 2. 页面形态

页面只按下面的规则判断 Desktop/H5：

```ts
const terminal = getHarmonyTerminal();
const isHarmonyMobile = terminal === "phone-web";
const isHarmonyDesktop = terminal === "pc-native" || terminal === "pc-web";
```

- `pc-native`、`pc-web` 必须走 PC 布局。
- `phone-web` 必须走 H5 布局。
- 不要用 `navigator.platform` 判断 Harmony，Harmony PC Web 实测可能返回 `Linux x86_64`。
- 不要直接使用 `/windows/i` 或 `/android/i` 判断，优先调用公共方法。

已有移动端判断应使用 `isMobileUserAgent()` / `isMobile()`，已有 Windows 判断应使用 `isWindowsUserAgent()` / `isWindows`。

## 3. 请求与业务边界

当前前端通过 `POST /api/chat` 发送 `messages` 并消费 SSE 响应，具体契约以 [`App.tsx`](../../web/src/App.tsx) 与 [`server.js`](../../server/server.js) 为准。请求异常先检查 Network 中实际的 URL、请求体、响应状态和 SSE 数据，再定位前后端处理逻辑。

本项目未接入鉴权、埋点或双 CMS。`fr`、`device`、`chat_client`、`getFr()` 等外部项目约定不属于当前接口要求，不得因终端识别而自行补入。未来接入时需先确认真实接口与宿主能力。

## 4. Native API 能力检测

Harmony Native 不保证具有 Mac/Windows 客户端的全部 `chrome.*`、`ucapi` 或 `quantum` API。必须从安全的全局对象入口检查到具体方法，不能直接访问可能未声明的 `chrome`。

以下借用 CMS 方法名演示能力检测，不代表本项目已有 CMS 接入，也不是完整调用示例；用 `unknown` 描述待检测成员，不假定其签名：

```ts
const host = globalThis as typeof globalThis & {
  chrome?: {
    cmsPrivate?: {
      getAvailableCMSResource?: unknown;
    };
  };
};

const canReadNativeCms = typeof host.chrome?.cmsPrivate?.getAvailableCMSResource === "function";
```

namespace 不存在、method 不存在、Promise pending、Promise reject 应分别记录。接入 Native Promise API 时必须有超时与 Web 降级；方法存在但一直 pending 时，应结合客户端日志检查 IPC channel 和 handler 是否回包，不能仅凭 pending 断言具体原因。

## 5. 常见问题速查

|现象|优先检查|
|-|-|
|对话回复异常|检查 `/api/chat` 的实际 `messages`、响应状态和 SSE 数据；按真实前后端契约定位，不套用外部项目协议|
|Harmony PC 显示移动端页面|检查 `getHarmonyTerminal()` 和 `isMobile()`；确认 PC UA 没有被 `Windows`、`Android` 或 `Harmony` 关键字提前判成移动端；|
|Harmony PC Web 被识别成 Windows|禁止直接 `/windows/i`，改用 `isWindowsUserAgent()`|
|Native 功能没有反应|从安全全局入口检查具体方法；区分缺失、pending 和 reject，并核查超时、降级及客户端日志|
|UA 是普通 Windows Chrome|确认宿主是否注入 `window.__IS_HARMONY__ === true`；当前项目未实现注入，无信号时返回 `null`，不继续猜测|

## 6. 提交前检查

- Harmony PC Native：`pc-native`、非移动端、非 Windows。
- Harmony PC Web：`pc-web`、非移动端、非 Windows。
- Harmony Phone Web：`phone-web`、移动端；需要 Harmony 分支时不再进入 Android 业务分支。
- Windows、macOS、Android、iOS 原有判断不回归。
- Native API 缺失或超时不会阻断页面。
- 鉴权和业务请求符合 Native=`ohos`、PC Web=`pc`、Phone Web=`h5`。
- Web CMS 请求在 PC Native 使用 `fr=ohos`，PC Web 使用 `fr=pc&model=ohos`，Phone Web 保持 `fr=h5`。
- 埋点、业务请求和 CMS 分别遵守自己的终端约定，不因字段同名而强行统一。
