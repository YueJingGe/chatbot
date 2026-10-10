import { afterEach, describe, expect, it, vi } from "vitest";

import { generateUuid } from "./uuid";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateUuid", () => {
  it("当前环境返回标准 UUID v4", () => {
    expect(generateUuid()).toMatch(UUID_V4_REGEX);
  });

  it("非安全上下文缺少 randomUUID 时降级生成且连续调用唯一", () => {
    // 复现 http + 局域网 IP 场景：crypto 存在但没有 randomUUID。
    const realGetRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    vi.stubGlobal("crypto", { getRandomValues: realGetRandomValues });

    const first = generateUuid();
    const second = generateUuid();

    expect(first).toMatch(UUID_V4_REGEX);
    expect(second).toMatch(UUID_V4_REGEX);
    expect(first).not.toBe(second);
  });
});
