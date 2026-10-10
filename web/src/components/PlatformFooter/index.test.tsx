import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { PlatformInfo } from "../../utils/browser";
import { PlatformFooter } from "./index.tsx";

const unknownPlatform: PlatformInfo = {
  os: "unknown",
  pageType: "unknown",
  runtime: "unknown",
  harmonyTerminal: null,
};

const footerCases: { platform: Partial<PlatformInfo>; expected: string }[] = [
  {
    platform: { os: "harmony", pageType: "pc", runtime: "native", harmonyTerminal: "pc-native" },
    expected: "harmony · pc · native · pc-native",
  },
  {
    platform: { os: "harmony", pageType: "pc", runtime: "web", harmonyTerminal: "pc-web" },
    expected: "harmony · pc · web · pc-web",
  },
  {
    platform: { os: "harmony", pageType: "h5", runtime: "web", harmonyTerminal: "phone-web" },
    expected: "harmony · h5 · web · phone-web",
  },
  {
    platform: { os: "harmony", pageType: "h5", runtime: "native", harmonyTerminal: "pc-web" },
    expected: "harmony · h5 · native · pc-web",
  },
  { platform: { os: "windows", pageType: "pc" }, expected: "windows · pc · 未知 · 未知" },
  { platform: { os: "macos", pageType: "pc" }, expected: "macos · pc · 未知 · 未知" },
  {
    platform: { os: "linux", pageType: "pc", runtime: "web" },
    expected: "linux · pc · web · 未知",
  },
  { platform: { os: "android", pageType: "h5" }, expected: "android · h5 · 未知 · 未知" },
  {
    platform: { os: "ios", pageType: "h5", runtime: "native" },
    expected: "ios · h5 · native · 未知",
  },
  { platform: { os: "harmony" }, expected: "harmony · 未知 · 未知 · 未知" },
  { platform: { os: "android", runtime: "native" }, expected: "android · 未知 · native · 未知" },
  { platform: { os: "linux", runtime: "web" }, expected: "linux · 未知 · web · 未知" },
  { platform: { pageType: "pc", runtime: "native" }, expected: "未知 · pc · native · 未知" },
  { platform: { pageType: "pc", runtime: "web" }, expected: "未知 · pc · web · 未知" },
  { platform: { pageType: "h5" }, expected: "未知 · h5 · 未知 · 未知" },
  { platform: { runtime: "native" }, expected: "未知 · 未知 · native · 未知" },
  { platform: { runtime: "web" }, expected: "未知 · 未知 · web · 未知" },
  { platform: {}, expected: "未知 · 未知 · 未知 · 未知" },
];

afterEach(cleanup);

describe("PlatformFooter", () => {
  it.each(footerCases)("独立渲染平台页脚：$expected", ({ platform, expected }) => {
    const info = { ...unknownPlatform, ...platform };

    render(<PlatformFooter platform={info} />);

    const footer = screen.getByRole("contentinfo");
    expect(footer.tagName).toBe("FOOTER");
    expect(footer.textContent).toBe(expected);
    expect(footer).toBeVisible();
  });

  it("平台参数变化时更新文案", () => {
    const windows: PlatformInfo = { ...unknownPlatform, os: "windows", pageType: "pc" };
    const android: PlatformInfo = { ...unknownPlatform, os: "android", pageType: "h5" };
    const { rerender } = render(<PlatformFooter platform={windows} />);
    expect(screen.getByRole("contentinfo").textContent).toBe("windows · pc · 未知 · 未知");

    rerender(<PlatformFooter platform={android} />);

    expect(screen.getByRole("contentinfo").textContent).toBe("android · h5 · 未知 · 未知");
    expect(screen.queryByText("windows · pc · 未知 · 未知")).not.toBeInTheDocument();
  });
});
