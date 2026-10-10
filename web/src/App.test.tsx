import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import * as browser from "./utils/browser";
import type { PlatformHostHint } from "./utils/browser";

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

beforeAll(() => {
  // jsdom 不实现元素滚动，页脚测试不依赖滚动动画。
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  if (originalScrollTo) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  }
});

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const footerCases: { host: PlatformHostHint; expected: string }[] = [
  {
    host: { os: "harmony", pageType: "pc", runtime: "native" },
    expected: "harmony · pc · native · 未知",
  },
  {
    host: { os: "harmony", pageType: "pc", runtime: "web" },
    expected: "harmony · pc · web · 未知",
  },
  {
    host: { os: "harmony", pageType: "h5", runtime: "web" },
    expected: "harmony · h5 · web · 未知",
  },
  {
    host: { os: "harmony", pageType: "h5", runtime: "native" },
    expected: "harmony · h5 · native · 未知",
  },
  { host: { os: "windows", pageType: "pc" }, expected: "windows · pc · 未知 · 未知" },
  { host: { os: "macos", pageType: "pc" }, expected: "macos · pc · 未知 · 未知" },
  { host: { os: "linux", pageType: "pc", runtime: "web" }, expected: "linux · pc · web · 未知" },
  { host: { os: "android", pageType: "h5" }, expected: "android · h5 · 未知 · 未知" },
  {
    host: { os: "android", pageType: "h5", runtime: "native" },
    expected: "android · h5 · native · 未知",
  },
  { host: { os: "ios", pageType: "h5", runtime: "web" }, expected: "ios · h5 · web · 未知" },
  { host: { os: "ios", pageType: "h5", runtime: "native" }, expected: "ios · h5 · native · 未知" },
  { host: { os: "harmony" }, expected: "harmony · 未知 · 未知 · 未知" },
  { host: { os: "android", runtime: "native" }, expected: "android · 未知 · native · 未知" },
  { host: { pageType: "pc", runtime: "native" }, expected: "未知 · pc · native · 未知" },
  { host: { pageType: "pc", runtime: "web" }, expected: "未知 · pc · web · 未知" },
  { host: { pageType: "h5" }, expected: "未知 · h5 · 未知 · 未知" },
  { host: { runtime: "native" }, expected: "未知 · 未知 · native · 未知" },
  { host: { runtime: "web" }, expected: "未知 · 未知 · web · 未知" },
  { host: {}, expected: "未知 · 未知 · 未知 · 未知" },
];

describe("App 平台标题", () => {
  it.each([
    ["PC", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"],
    ["H5", "Mozilla/5.0 (Linux; Android 14) Mobile"],
    ["未知平台", "unrecognized-agent"],
  ])("%s 下标题固定为 ai 对话", (_name, userAgent) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);

    render(<App />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("ai 对话");
    expect(heading).toBeVisible();
  });
});

describe("App 在线状态文案", () => {
  it.each([
    ["PC", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "pc在线"],
    ["H5", "Mozilla/5.0 (Linux; Android 14) Mobile", "mobile在线"],
    ["未知平台", "unrecognized-agent", "在线"],
  ])("%s 显示对应在线文案", (_name, userAgent, expected) => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);

    const { container } = render(<App />);

    const subtitle = container.querySelector("header p");
    expect(subtitle?.textContent).toBe(expected);
    expect(subtitle).toBeVisible();
  });
});

describe("App 平台页脚", () => {
  it.each(footerCases)("消费公共结果并显示 $expected", ({ host, expected }) => {
    const getPlatformInfo = vi
      .spyOn(browser, "getPlatformInfo")
      .mockReturnValue(browser.detectPlatform({ userAgent: "", host }));

    const { container } = render(<App />);
    const footers = container.querySelectorAll("footer");

    expect(footers).toHaveLength(2);
    // 外层 footer 是 App 的 Powered by 标语，内层是 PlatformFooter 自身的 footer。
    expect(footers[0]).toHaveTextContent("Powered by 阿里云百炼");
    expect(footers[1]?.textContent).toBe(expected);
    expect(footers[1]).toBeVisible();
    expect(getPlatformInfo).toHaveBeenCalledWith();
  });

  it("真实入口读取当前 UA，重新渲染后更新展示", () => {
    const userAgent = vi
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0");
    const { rerender } = render(<App />);
    expect(screen.getByText("windows · pc · 未知 · 未知")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ai 对话");

    userAgent.mockReturnValue("Mozilla/5.0 (Linux; Android 14) Mobile");
    rerender(<App />);
    expect(screen.getByText("android · h5 · 未知 · 未知")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ai 对话");
    expect(screen.queryByText("windows · pc · 未知 · 未知")).not.toBeInTheDocument();
  });
});
