import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getHarmonyTerminal,
  isHarmonyUserAgent,
  isMobileUserAgent,
  isWindowsUserAgent,
} from "./browser";

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

describe("isMobileUserAgent", () => {
  it.each(harmonyCases)("正确区分 Harmony %s 的移动端形态", (_name, userAgent, terminal) => {
    expect(isMobileUserAgent(userAgent)).toBe(terminal === "phone-web");
  });

  it.each([
    ["Android", "Mozilla/5.0 (Linux; Android 14) Mobile", true],
    ["iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile", true],
    ["iPad", "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", true],
    ["Windows", WINDOWS_UA, false],
    ["macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", false],
    ["Linux", "Mozilla/5.0 (X11; Linux x86_64)", false],
    ["空 UA", "", false],
    ["仅 Harmony 标记", "Mozilla/5.0 (OHOS 5.0)", false],
  ] as const)("保留 %s 的判断", (_name, userAgent, expected) => {
    expect(isMobileUserAgent(userAgent)).toBe(expected);
  });

  it.each([
    HARMONY_NATIVE_UA,
    HARMONY_OLD_NATIVE_UA,
    HARMONY_PC_UA,
    HARMONY_UU_PC_UA,
    `${WINDOWS_UA} TONGYI_DESKTOP/4.1.0`,
  ])("桌面特征优先于 Mobile/Android 且忽略大小写：%s", (userAgent) => {
    expect(isMobileUserAgent(`${userAgent} Mobile Android`.toLowerCase())).toBe(false);
  });
});

describe("isMobile", () => {
  it.each(harmonyCases)("根据当前 UA 判断 Harmony %s", async (_name, userAgent, terminal) => {
    const browser = await loadBrowser(userAgent);
    expect(browser.isMobile()).toBe(terminal === "phone-web");
  });

  it("每次调用重新读取 UA，不使用模块初始化时的快照", async () => {
    const browser = await loadBrowser(WINDOWS_UA);
    expect(browser.isMobile()).toBe(false);
    vi.stubGlobal("navigator", { userAgent: HARMONY_PHONE_UA, vendor: "" });
    expect(browser.isMobile()).toBe(true);
  });

  it.each([
    [HARMONY_PHONE_UA, "", true],
    ["", HARMONY_PHONE_UA, true],
    ["", "", false],
  ] as const)("保留 vendor / opera / 空串回退：%s %s", async (vendor, opera, expected) => {
    const browser = await loadBrowser(WINDOWS_UA);
    vi.stubGlobal("navigator", { userAgent: "", vendor });
    vi.stubGlobal("window", { opera });
    expect(browser.isMobile()).toBe(expected);
  });

  it("只消费 UA，不读取 Harmony 模板信号", async () => {
    const browser = await loadBrowser("Mozilla/5.0 (Linux; Android 14) Mobile", true);
    expect(browser.getHarmonyTerminal()).toBe("pc-web");
    expect(browser.isMobile()).toBe(true);
  });
});

describe("isWindowsUserAgent / isWindows", () => {
  it.each(harmonyCases)("不把 Harmony %s 识别为 Windows", async (_name, userAgent) => {
    expect(isWindowsUserAgent(userAgent)).toBe(false);
    const browser = await loadBrowser(userAgent);
    expect(browser.isWindows).toBe(false);
  });

  it.each([
    ["Windows", WINDOWS_UA, true],
    ["小写 Windows", WINDOWS_UA.toLowerCase(), true],
    ["Windows 客户端", `${WINDOWS_UA} TONGYI_DESKTOP/4.1.0`, true],
    ["macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", false],
    ["Android", "Mozilla/5.0 (Linux; Android 14) Mobile", false],
    ["iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile", false],
    ["空 UA", "", false],
  ] as const)("保留 %s 的判断", async (_name, userAgent, expected) => {
    expect(isWindowsUserAgent(userAgent)).toBe(expected);
    const browser = await loadBrowser(userAgent);
    expect(browser.isWindows).toBe(expected);
  });

  it("isWindows 保留模块初始化时的纯 UA 快照，不消费模板信号", async () => {
    const browser = await loadBrowser(WINDOWS_UA, true);
    expect(browser.getHarmonyTerminal()).toBe("pc-web");
    expect(browser.isWindows).toBe(true);
    expect(browser.isWindowsUserAgent(WINDOWS_UA)).toBe(true);
    vi.stubGlobal("navigator", { userAgent: HARMONY_PC_UA, vendor: "" });
    expect(browser.isWindows).toBe(true);
  });
});
