import { describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "../copy";

describe("copyToClipboard", () => {
  it("writes the given text to navigator.clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await copyToClipboard("hello");

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("throws when clipboard API is unavailable", async () => {
    Object.assign(navigator, { clipboard: undefined });

    await expect(copyToClipboard("hello")).rejects.toThrow("剪贴板 API 不可用");
  });
});
