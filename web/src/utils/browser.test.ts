import { afterEach, describe, expect, it, vi } from "vitest";

import { getHarmonyTerminal, isHarmonyUserAgent } from "./browser";

const HARMONY_NATIVE_UA =
  "Mozilla/5.0 (X11; OHOS 5.0) AppleWebKit/537.36 Chrome/144.0.0.0 Safari/537.36 TONGYI_DESKTOP/4.1.0.175";
const HARMONY_OLD_NATIVE_UA =
  "Mozilla/5.0 (OHOSHarmonyOS aarch64) AppleWebKit/537.36 Chrome/144.0.0.0 Safari/537.36 TONGYI_DESKTOP/3.7.0.134";
const HARMONY_PC_UA =
  "Mozilla/5.0 (PC; OpenHarmony 6.1; Windows NT 10.0) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.115 HuaweiBrowser/6.1.7.302";
const HARMONY_UU_PC_UA =
  "Mozilla/5.0 (OHOS; OHOS x86_64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36";
const HARMONY_PHONE_UA =
  "Mozilla/5.0 (Phone; OpenHarmony 6.1; Android 10) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.117 Mobile HuaweiBrowser/6.1.1.352";
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0";

const harmonyCases = [
  ["新版 Native", HARMONY_NATIVE_UA, "pc-native"],
  ["旧版 Native", HARMONY_OLD_NATIVE_UA, "pc-native"],
  ["PC Web", HARMONY_PC_UA, "pc-web"],
  ["UU PC Web", HARMONY_UU_PC_UA, "pc-web"],
  ["Phone Web", HARMONY_PHONE_UA, "phone-web"],
  ["二合一设备", "Mozilla/5.0 (2in1; OpenHarmony 6.1)", "pc-web"],
] as const;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function loadBrowser(userAgent: string, hint?: unknown) {
  vi.resetModules();
  vi.stubGlobal("navigator", { userAgent, vendor: "" });
  vi.stubGlobal("window", { __IS_HARMONY__: hint });
  return import("./browser");
}

describe("getHarmonyTerminal", () => {
  it.each(harmonyCases)("识别 Harmony %s", (_name, userAgent, terminal) => {
    expect(getHarmonyTerminal(userAgent)).toBe(terminal);
    expect(isHarmonyUserAgent(userAgent)).toBe(true);
  });

  it.each([
    ["Windows", WINDOWS_UA],
    ["macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"],
    ["Android", "Mozilla/5.0 (Linux; Android 14) Mobile"],
    ["iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile"],
    ["普通桌面客户端", `${WINDOWS_UA} TONGYI_DESKTOP/4.1.0`],
    ["空 UA", ""],
  ])("不把 %s 猜测为 Harmony", (_name, userAgent) => {
    expect(getHarmonyTerminal(userAgent)).toBeNull();
    expect(isHarmonyUserAgent(userAgent)).toBe(false);
  });

  it("只有 Harmony 标记而无终端特征时返回 null", () => {
    expect(isHarmonyUserAgent("Mozilla/5.0 (OHOS 5.0)")).toBe(true);
    expect(getHarmonyTerminal("Mozilla/5.0 (OHOS 5.0)")).toBeNull();
  });

  it("Native 识别优先于 PC 和 Phone 特征，且忽略大小写", () => {
    expect(
      getHarmonyTerminal(`${HARMONY_PC_UA} TONGYI_DESKTOP/4.1 Phone Mobile`.toLowerCase())
    ).toBe("pc-native");
  });

  it("PC 特征优先于 Phone 特征", () => {
    expect(getHarmonyTerminal(`${HARMONY_PC_UA} Phone Mobile`)).toBe("pc-web");
  });

  it("无参调用使用当前页面 UA", async () => {
    const browser = await loadBrowser(HARMONY_NATIVE_UA);
    expect(browser.getHarmonyTerminal()).toBe("pc-native");
    expect(browser.isHarmonyUserAgent()).toBe(true);
  });

  it("模板标记仅对无参终端判断兜底，不影响纯 UA 判断", async () => {
    const browser = await loadBrowser(WINDOWS_UA, true);
    expect(browser.getHarmonyTerminal()).toBe("pc-web");
    expect(browser.getHarmonyTerminal(WINDOWS_UA)).toBeNull();
    expect(browser.getHarmonyTerminal("")).toBeNull();
    expect(browser.isHarmonyUserAgent()).toBe(false);
  });

  it.each([undefined, false, "true", 1])("模板标记为 %s 时不兜底", async (hint) => {
    const browser = await loadBrowser(WINDOWS_UA, hint);
    expect(browser.getHarmonyTerminal()).toBeNull();
  });

  it.each([
    [HARMONY_NATIVE_UA, "pc-native"],
    [HARMONY_PHONE_UA, "phone-web"],
  ])("明确 UA 优先于模板标记：%s", async (userAgent, terminal) => {
    const browser = await loadBrowser(userAgent, true);
    expect(browser.getHarmonyTerminal()).toBe(terminal);
  });

  it.each([
    [HARMONY_PC_UA, ""],
    ["", HARMONY_PC_UA],
    ["", ""],
  ])("保留 vendor / opera / 空串的 UA 回退：%s %s", async (vendor, opera) => {
    vi.resetModules();
    vi.stubGlobal("navigator", { userAgent: "", vendor });
    vi.stubGlobal("window", { opera });
    const browser = await import("./browser");
    expect(browser.getHarmonyTerminal()).toBe(vendor || opera ? "pc-web" : null);
  });
});
