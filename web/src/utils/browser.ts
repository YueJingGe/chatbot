type HarmonyWindow = Window & {
  /** 页面模板根据请求头同步注入；只有 Harmony PC Web 才会为 true。 */
  __IS_HARMONY__?: boolean;
  opera?: string;
};

const ua = navigator.userAgent || navigator.vendor || (window as HarmonyWindow).opera || "";

const HARMONY_USER_AGENT_REGEX = /HarmonyOS|OpenHarmony|OHOS/i;
const HARMONY_NATIVE_USER_AGENT_REGEX = /TONGYI_DESKTOP\//i;
const HARMONY_PC_WEB_USER_AGENT_REGEX = /\(PC\s*;|\b2in1\b|\(OHOS\s*;\s*OHOS\s+x86_64\s*\)/i;
const HARMONY_PHONE_WEB_USER_AGENT_REGEX = /\bPhone\b|\bMobile\b/i;

export type HarmonyTerminal = "pc-native" | "pc-web" | "phone-web";

export function isHarmonyUserAgent(candidateUserAgent: string = ua): boolean {
  return HARMONY_USER_AGENT_REGEX.test(candidateUserAgent);
}

/**
 * 识别 UA 明确暴露的 Harmony 终端形态。
 *
 * 无参调用用于当前页面：优先解析 UA，无法识别时再读取模板同步注入的
 * `window.__IS_HARMONY__`，该值为 true 时补判为 Harmony PC Web。
 * 显式传入 UA 时保持纯 UA 解析，不读取当前页面的模板变量。
 */
export function getHarmonyTerminal(candidateUserAgent?: string): HarmonyTerminal | null {
  const targetUserAgent = candidateUserAgent ?? ua;

  if (isHarmonyUserAgent(targetUserAgent)) {
    if (HARMONY_NATIVE_USER_AGENT_REGEX.test(targetUserAgent)) return "pc-native";
    if (HARMONY_PC_WEB_USER_AGENT_REGEX.test(targetUserAgent)) return "pc-web";
    if (HARMONY_PHONE_WEB_USER_AGENT_REGEX.test(targetUserAgent)) return "phone-web";
  }

  if (
    candidateUserAgent === undefined &&
    typeof window !== "undefined" &&
    (window as HarmonyWindow).__IS_HARMONY__ === true
  ) {
    return "pc-web";
  }

  return null;
}
