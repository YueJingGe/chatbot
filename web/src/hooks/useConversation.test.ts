import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useConversation } from "./useConversation";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("useConversation", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("非安全上下文初始化默认会话不崩溃，id 使用降级 UUID", () => {
    localStorage.clear();
    // 复现真机场景：http + 局域网 IP 下 crypto.randomUUID 不存在。
    const realGetRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    vi.stubGlobal("crypto", { getRandomValues: realGetRandomValues });

    const { result } = renderHook(() => useConversation());

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.id).toMatch(UUID_V4_REGEX);
  });
});
