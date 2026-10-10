import { afterEach, describe, expect, it, vi } from "vitest";

import { detectPlatform, getPlatformInfo, type PlatformHostHint } from "./browser";

const HARMONY_NATIVE_UA =
  "Mozilla/5.0 (X11; OHOS 5.0) AppleWebKit/537.36 Chrome/144.0.0.0 Safari/537.36";
const HARMONY_OLD_NATIVE_UA =
  "Mozilla/5.0 (OHOSHarmonyOS aarch64) AppleWebKit/537.36 Chrome/144.0.0.0 Safari/537.36";
const HARMONY_PC_UA =
  "Mozilla/5.0 (PC; OpenHarmony 6.1; Windows NT 10.0) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.115 HuaweiBrowser/6.1.7.302";
const HARMONY_UU_PC_UA =
  "Mozilla/5.0 (OHOS; OHOS x86_64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36";
const HARMONY_PHONE_UA =
  "Mozilla/5.0 (Phone; OpenHarmony 6.1; Android 10) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36 ArkWeb/6.1.0.117 Mobile HuaweiBrowser/6.1.1.352";
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0";
const MACOS_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14) Mobile";
const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile";
const UNKNOWN_PLATFORM = {
  os: "unknown",
  pageType: "unknown",
  runtime: "unknown",
  harmonyTerminal: null,
};

const harmonyCases = [
  ["新版 PC Native", HARMONY_NATIVE_UA, "pc-native"],
  ["旧版 PC Native", HARMONY_OLD_NATIVE_UA, "pc-native"],
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

describe("detectPlatform", () => {
  it.each(harmonyCases)("统一识别 Harmony %s 的三个维度", (_name, userAgent, terminal) => {
    expect(detectPlatform({ userAgent })).toEqual({
      os: "harmony",
      pageType: terminal === "phone-web" ? "h5" : "pc",
      runtime: terminal === "pc-native" ? "native" : "web",
      harmonyTerminal: terminal,
    });
  });

  it("Native 特征优先于 PC 和 Phone 标记，且忽略大小写", () => {
    expect(
      detectPlatform({
        userAgent: `Mozilla/5.0 (X11; OHOS 5.0) ${HARMONY_PC_UA} Phone Mobile`.toLowerCase(),
      })
    ).toEqual({
      os: "harmony",
      pageType: "pc",
      runtime: "native",
      harmonyTerminal: "pc-native",
    });
  });

  it("PC 特征优先于 Phone 标记", () => {
    expect(detectPlatform({ userAgent: `${HARMONY_PC_UA} Phone Mobile` })).toEqual({
      os: "harmony",
      pageType: "pc",
      runtime: "web",
      harmonyTerminal: "pc-web",
    });
  });

  it.each([HARMONY_NATIVE_UA, HARMONY_OLD_NATIVE_UA, HARMONY_PC_UA, HARMONY_UU_PC_UA])(
    "Harmony 桌面特征优先于 Mobile/Android 标记且忽略大小写：%s",
    (userAgent) => {
      expect(
        detectPlatform({ userAgent: `${userAgent} Mobile Android`.toLowerCase() }).pageType
      ).toBe("pc");
    }
  );

  it.each([
    [WINDOWS_UA, "windows", "pc"],
    [MACOS_UA, "macos", "pc"],
    [ANDROID_UA, "android", "h5"],
    [IOS_UA, "ios", "h5"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "ios", "h5"],
    ["Mozilla/5.0 (iPod; CPU iPhone OS 18_0 like Mac OS X)", "ios", "h5"],
    ["Mozilla/5.0 (X11; Linux x86_64)", "linux", "pc"],
    ["Mozilla/5.0 (Linux; Android 14; Tablet)", "android", "h5"],
  ] as const)("解析系统和页面形态，不凭普通 UA 确认容器：%s", (userAgent, os, pageType) => {
    expect(detectPlatform({ userAgent })).toEqual({
      os,
      pageType,
      runtime: "unknown",
      harmonyTerminal: null,
    });
  });

  it.each([
    HARMONY_NATIVE_UA,
    HARMONY_OLD_NATIVE_UA,
    HARMONY_PC_UA,
    HARMONY_PHONE_UA,
    WINDOWS_UA,
    MACOS_UA,
    ANDROID_UA,
    IOS_UA,
  ])("识别忽略大小写：%s", (userAgent) => {
    expect(detectPlatform({ userAgent: userAgent.toLowerCase() })).toEqual(
      detectPlatform({ userAgent })
    );
  });

  it.each(["", "unrecognized-agent"])("未知 UA 不强行归类为 PC：%s", (userAgent) => {
    expect(detectPlatform({ userAgent })).toEqual(UNKNOWN_PLATFORM);
  });

  it("识别结果恰好含四个字段", () => {
    expect(Object.keys(detectPlatform({ userAgent: WINDOWS_UA })).sort()).toEqual([
      "harmonyTerminal",
      "os",
      "pageType",
      "runtime",
    ]);
  });

  it("只有 Harmony 系统标记时不猜页面形态和容器", () => {
    expect(detectPlatform({ userAgent: "Mozilla/5.0 (OHOS 5.0; Android 10)" })).toEqual({
      ...UNKNOWN_PLATFORM,
      os: "harmony",
    });
  });

  it.each([
    [WINDOWS_UA, "windows"],
    [MACOS_UA, "macos"],
  ] as const)("桌面客户端标记不等于 Harmony，也不单独判定 Native：%s", (userAgent, os) => {
    expect(detectPlatform({ userAgent: `${userAgent} TONGYI_DESKTOP/4.1` })).toEqual({
      os,
      pageType: "pc",
      runtime: "unknown",
      harmonyTerminal: null,
    });
  });

  it.each([undefined, 0, 1, 5])("按触点信息兼容 iPad 桌面 UA：%s", (maxTouchPoints) => {
    const isIPad = maxTouchPoints !== undefined && maxTouchPoints > 1;
    expect(detectPlatform({ userAgent: MACOS_UA, maxTouchPoints })).toEqual({
      os: isIPad ? "ios" : "macos",
      pageType: isIPad ? "h5" : "pc",
      runtime: "unknown",
      harmonyTerminal: null,
    });
  });

  it("普通 Android WebView 不自动认定为 Native", () => {
    expect(detectPlatform({ userAgent: `${ANDROID_UA} wv Version/4.0` }).runtime).toBe("unknown");
  });

  it("不依赖视口宽度或 window.chrome 猜测平台", () => {
    vi.stubGlobal("window", { innerWidth: 320, chrome: {} });
    expect(detectPlatform({ userAgent: WINDOWS_UA })).toEqual({
      os: "windows",
      pageType: "pc",
      runtime: "unknown",
      harmonyTerminal: null,
    });
  });

  it.each([WINDOWS_UA, ANDROID_UA, "Mozilla/5.0 (OHOS 5.0)"])(
    "未识别 Harmony 终端时允许明确模板信号兜底：%s",
    (userAgent) => {
      expect(detectPlatform({ userAgent, harmonyPcWebHint: true })).toEqual({
        os: "harmony",
        pageType: "pc",
        runtime: "web",
        harmonyTerminal: "pc-web",
      });
    }
  );

  it.each(harmonyCases)("明确 Harmony %s 优先于模板信号", (_name, userAgent) => {
    expect(detectPlatform({ userAgent, harmonyPcWebHint: true })).toEqual(
      detectPlatform({ userAgent })
    );
  });

  it.each([false, "true", 1, null])("仅布尔 true 才启用模板兜底：%s", (hint) => {
    expect(detectPlatform({ userAgent: WINDOWS_UA, harmonyPcWebHint: hint as boolean })).toEqual(
      detectPlatform({ userAgent: WINDOWS_UA })
    );
  });

  it.each(["harmony", "windows", "macos", "android", "ios", "linux"] as const)(
    "支持 %s 的显式宿主声明",
    (os) => {
      expect(
        detectPlatform({ userAgent: "", host: { os, pageType: "h5", runtime: "native" } })
      ).toEqual({
        os,
        pageType: "h5",
        runtime: "native",
        harmonyTerminal: null,
      });
    }
  );

  it("宿主仅覆盖维度，终端字段保持 UA 观测值", () => {
    expect(detectPlatform({ userAgent: HARMONY_PC_UA, host: { runtime: "native" } })).toEqual({
      os: "harmony",
      pageType: "pc",
      runtime: "native",
      harmonyTerminal: "pc-web",
    });
    expect(detectPlatform({ userAgent: ANDROID_UA, host: { runtime: "native" } })).toEqual({
      os: "android",
      pageType: "h5",
      runtime: "native",
      harmonyTerminal: null,
    });
  });

  it("显式 Web 宿主可确认普通 UA 的容器", () => {
    expect(detectPlatform({ userAgent: MACOS_UA, host: { runtime: "web" } }).runtime).toBe("web");
  });

  it("宿主声明优先于 UA 和模板，终端字段保持 UA 观测值", () => {
    expect(
      detectPlatform({
        userAgent: HARMONY_PC_UA,
        harmonyPcWebHint: true,
        host: { os: "ios", pageType: "h5", runtime: "web" },
      })
    ).toEqual({ os: "ios", pageType: "h5", runtime: "web", harmonyTerminal: "pc-web" });
    expect(detectPlatform({ userAgent: HARMONY_PC_UA, host: { os: "windows" } })).toEqual({
      os: "windows",
      pageType: "pc",
      runtime: "web",
      harmonyTerminal: "pc-web",
    });
  });

  it.each([
    null,
    "native",
    { os: "unknown", pageType: "tablet", runtime: "electron" },
    { os: 1, pageType: true, runtime: {} },
  ])("忽略非法宿主值，不影响可识别结果：%j", (host) => {
    expect(
      detectPlatform({ userAgent: WINDOWS_UA, host: host as unknown as PlatformHostHint })
    ).toEqual(detectPlatform({ userAgent: WINDOWS_UA }));
  });

  it("纯解析不读取当前页面模板或 UA", async () => {
    const browser = await loadBrowser(WINDOWS_UA, true);
    expect(browser.detectPlatform({ userAgent: "" })).toEqual(UNKNOWN_PLATFORM);
  });
});

describe("getPlatformInfo", () => {
  it.each(harmonyCases)("读取当前 Harmony %s 的环境", async (_name, userAgent) => {
    const browser = await loadBrowser(userAgent);
    expect(browser.getPlatformInfo()).toEqual(browser.detectPlatform({ userAgent }));
  });

  it("每次读取当前 UA 和模板信号", async () => {
    const browser = await loadBrowser(WINDOWS_UA);
    expect(browser.getPlatformInfo().os).toBe("windows");
    vi.stubGlobal("navigator", { userAgent: HARMONY_PHONE_UA });
    expect(browser.getPlatformInfo().harmonyTerminal).toBe("phone-web");
    vi.stubGlobal("navigator", { userAgent: WINDOWS_UA });
    vi.stubGlobal("window", { __IS_HARMONY__: true });
    expect(browser.getPlatformInfo().harmonyTerminal).toBe("pc-web");
  });

  it.each([undefined, false, "true", 1])("模板标记为 %s 时不兜底", async (hint) => {
    const browser = await loadBrowser(WINDOWS_UA, hint);
    expect(browser.getPlatformInfo()).toEqual(detectPlatform({ userAgent: WINDOWS_UA }));
  });

  it("读取触点但允许宿主覆盖 iPad 兼容判断", () => {
    vi.stubGlobal("navigator", { userAgent: MACOS_UA, maxTouchPoints: 5 });
    expect(getPlatformInfo().os).toBe("ios");
    expect(getPlatformInfo({ os: "macos", pageType: "pc" })).toMatchObject({
      os: "macos",
      pageType: "pc",
    });
  });

  it.each([
    [HARMONY_PC_UA, ""],
    ["", HARMONY_PC_UA],
    ["", ""],
  ])("当前入口保留 vendor / opera 回退：%s %s", (vendor, opera) => {
    vi.stubGlobal("navigator", { userAgent: "", vendor });
    vi.stubGlobal("window", { opera });
    expect(getPlatformInfo().harmonyTerminal).toBe(vendor || opera ? "pc-web" : null);
  });

  it("没有浏览器全局对象也能导入和执行纯解析", async () => {
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("window", undefined);
    vi.resetModules();
    const browser = await import("./browser");
    expect(browser.getPlatformInfo()).toEqual(UNKNOWN_PLATFORM);
    expect(browser.detectPlatform({ userAgent: WINDOWS_UA }).os).toBe("windows");
  });
});
