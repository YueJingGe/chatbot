/**
 * **作用**：全项目只有这一份识别实现（`web/src/utils/browser.ts`），页面只消费识别结果，不自己写 `/android/i`。
 * **触点**：就是 `navigator.maxTouchPoints`——设备屏幕最多能同时识别几个触点，手机平板通常 5 个起，纯鼠标键盘是 0。它在项目里只干一件事：iPad 请求桌面网站时，UA 会装成 Mac，光看字符串认不出来；但它是触摸屏，触点大于 1，所以「`Macintosh` UA + 触点 > 1」一起看，就能认出它其实是 iOS。
 * **模板信号**：`window.__IS_HARMONY__` 是宿主在页面初始化时注入的一个开关，专门救「UA 被换成普通 Windows」这种情况——字符串认不出鸿蒙时，它严格等于布尔 `true`，就补判为鸿蒙 PC Web；`"true"`、`1` 这类值都不算数。
 * **宿主声明**：`host` 是给接入原生容器的业务预留的入口——容器最清楚自己是什么，可以直接传入 `os` / `pageType` / `runtime` 的有效值，最后逐字段覆盖识别结果；没传的照旧，非法值忽略。当前项目还没有真实宿主接入，这是为将来接 Native 能力预留的口子。
 */
type HarmonyWindow = Window & {
  /** 页面模板根据请求头同步注入；只有 Harmony PC Web 才会为 true。 */
  __IS_HARMONY__?: boolean;
  opera?: string;
};

/** 读取当前 UA：依次回退 navigator.userAgent、navigator.vendor、window.opera，无浏览器环境时返回空串。 */
function readUserAgent(): string {
  const browserNavigator = typeof navigator === "undefined" ? undefined : navigator;
  const browserWindow = typeof window === "undefined" ? undefined : (window as HarmonyWindow);
  return browserNavigator?.userAgent || browserNavigator?.vendor || browserWindow?.opera || "";
}

// Harmony 系统标记：UA 含 HarmonyOS / OpenHarmony / OHOS 即判定为鸿蒙系统，是所有 Harmony 终端细分的前提。
const HARMONY_USER_AGENT_REGEX = /HarmonyOS|OpenHarmony|OHOS/i;
// Harmony PC Native 终端特征：新版样机为 "(X11; OHOS x.y)"，旧版为 "OHOSHarmonyOS"；仅凭系统特征识别，不依赖桌面客户端标记。
const HARMONY_NATIVE_USER_AGENT_REGEX = /\(X11;\s*OHOS|OHOSHarmonyOS/i;
// Harmony PC 浏览器特征：华为浏览器 "(PC ;" 前缀、二合一设备 "2in1"、UU 浏览器 "(OHOS; OHOS x86_64)"，三者同为 pc-web。
const HARMONY_PC_WEB_USER_AGENT_REGEX = /\(PC\s*;|\b2in1\b|\(OHOS\s*;\s*OHOS\s+x86_64\s*\)/i;
// Harmony 手机浏览器特征：UA 携带独立的 Phone 或 Mobile 机型标记。
const HARMONY_PHONE_WEB_USER_AGENT_REGEX = /\bPhone\b|\bMobile\b/i;

/** 由 UA 特征与模板信号观测到的鸿蒙终端，供结果字段与维度映射共用。 */
export type HarmonyTerminal = "pc-native" | "pc-web" | "phone-web";

/** 纯 UA 标记判断：UA 含 HarmonyOS / OpenHarmony / OHOS 即为鸿蒙系统，不消费模板信号。 */
function isHarmonyUserAgent(candidateUserAgent: string): boolean {
  return HARMONY_USER_AGENT_REGEX.test(candidateUserAgent);
}

/**
 * 纯 UA 判断 Windows；排除 Harmony 标记是因为 Harmony PC Web 的 UA 携带 Windows NT 字样，
 * 不能据此判为 Windows。
 */
function isWindowsUserAgent(candidateUserAgent: string): boolean {
  return !isHarmonyUserAgent(candidateUserAgent) && /windows/i.test(candidateUserAgent);
}

// Harmony 桌面终端特征汇总（Native / PC 浏览器 / 2in1 / UU）：页面形态判定时先排除，防止鸿蒙桌面 UA 被 Mobile 标记误判为移动端。
const DESKTOP_USER_AGENT_REGEX =
  /\(X11;\s*OHOS|OHOSHarmonyOS|\(PC\s*;[^)]*(?:OpenHarmony|HarmonyOS)|\(OHOS\s*;\s*OHOS\s+x86_64\s*\)/i;
// 通用移动端标记：命中即视为 H5 页面形态；鸿蒙桌面 UA 已被上面的桌面特征先行排除。
const MOBILE_USER_AGENT_REGEX =
  /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone|\bphone\b/i;

/** 纯 UA 移动端判断：命中通用移动端标记即视为移动端，鸿蒙桌面 UA 先行排除。 */
function isMobileUserAgent(candidateUserAgent: string): boolean {
  // Harmony Native 和 Harmony PC 浏览器的 UA 都包含 Harmony，不能据此判断为移动端。
  if (DESKTOP_USER_AGENT_REGEX.test(candidateUserAgent)) return false;
  return MOBILE_USER_AGENT_REGEX.test(candidateUserAgent);
}

const PLATFORM_OPERATING_SYSTEMS = [
  "harmony",
  "windows",
  "macos",
  "android",
  "ios",
  "linux",
] as const;

export type PlatformOS = (typeof PLATFORM_OPERATING_SYSTEMS)[number] | "unknown";
export type PageType = "pc" | "h5" | "unknown";
export type PlatformRuntime = "native" | "web" | "unknown";

export interface PlatformInfo {
  os: PlatformOS;
  pageType: PageType;
  runtime: PlatformRuntime;
  /** 仅由 UA 特征与模板信号得出的鸿蒙终端观测值；宿主覆盖不改变该字段，分流判断以三维度为准。 */
  harmonyTerminal: HarmonyTerminal | null;
}

/** 由接入方从已确认的宿主协议中取得，不对应任何预设的全局变量或 bridge。 */
export interface PlatformHostHint {
  os?: Exclude<PlatformOS, "unknown">;
  pageType?: Exclude<PageType, "unknown">;
  runtime?: Exclude<PlatformRuntime, "unknown">;
}

export interface PlatformInput {
  userAgent: string;
  maxTouchPoints?: number;
  harmonyPcWebHint?: boolean;
  host?: PlatformHostHint;
}

/** 解析操作系统：Harmony 优先于其他标记，其次 Android/iOS，再次 Windows/macOS/Linux，无法识别返回 unknown。 */
function detectOperatingSystem(userAgent: string, maxTouchPoints: number): PlatformOS {
  if (isHarmonyUserAgent(userAgent)) return "harmony";
  if (/android/i.test(userAgent)) return "android";
  // iPad 桌面 UA 的兼容启发式，不作为可信设备证明。
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    return "ios";
  }
  if (isWindowsUserAgent(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macos";
  if (/linux/i.test(userAgent)) return "linux";
  return "unknown";
}

/** 纯 UA 解析鸿蒙终端形态：Native > PC Web > Phone Web 取第一个命中，证据不足返回 null；不读取模板信号与当前环境。 */
function detectHarmonyTerminal(userAgent: string): HarmonyTerminal | null {
  if (!isHarmonyUserAgent(userAgent)) return null;
  if (HARMONY_NATIVE_USER_AGENT_REGEX.test(userAgent)) return "pc-native";
  if (HARMONY_PC_WEB_USER_AGENT_REGEX.test(userAgent)) return "pc-web";
  if (HARMONY_PHONE_WEB_USER_AGENT_REGEX.test(userAgent)) return "phone-web";
  return null;
}

/** 纯解析：只消费传入数据，宿主有效字段优先；未识别的维度保持 unknown。 */
export function detectPlatform({
  userAgent,
  maxTouchPoints = 0,
  harmonyPcWebHint,
  host,
}: PlatformInput): PlatformInfo {
  const harmonyTerminal =
    detectHarmonyTerminal(userAgent) ?? (harmonyPcWebHint === true ? "pc-web" : null);
  let os = detectOperatingSystem(userAgent, maxTouchPoints);
  let pageType: PageType = "unknown";
  let runtime: PlatformRuntime = "unknown";

  if (harmonyTerminal !== null) {
    os = "harmony";
    pageType = harmonyTerminal === "phone-web" ? "h5" : "pc";
    runtime = harmonyTerminal === "pc-native" ? "native" : "web";
  } else if (os !== "harmony") {
    if (os === "android" || os === "ios" || isMobileUserAgent(userAgent)) {
      pageType = "h5";
    } else if (os === "windows" || os === "macos" || os === "linux") {
      pageType = "pc";
    }
  }

  // 校验运行时输入，避免 JavaScript 接入方的非法字段污染识别结果。
  if (host?.os && PLATFORM_OPERATING_SYSTEMS.includes(host.os)) os = host.os;
  if (host?.pageType === "pc" || host?.pageType === "h5") pageType = host.pageType;
  if (host?.runtime === "native" || host?.runtime === "web") runtime = host.runtime;

  return { os, pageType, runtime, harmonyTerminal };
}

/** 当前页面入口：每次读取环境。 */
export function getPlatformInfo(host?: PlatformHostHint): PlatformInfo {
  return detectPlatform({
    userAgent: readUserAgent(),
    maxTouchPoints: typeof navigator === "undefined" ? undefined : navigator.maxTouchPoints,
    harmonyPcWebHint:
      typeof window !== "undefined" && (window as HarmonyWindow).__IS_HARMONY__ === true,
    host,
  });
}
