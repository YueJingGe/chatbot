import { describe, expect, it } from "vitest";

import { REF_TEXT_MIME_TYPE, type ConversationMessage } from "./conversation";

describe("conversation types", () => {
  it("exposes the ref text mime type marker", () => {
    // 前后端引用契约锚点：值变更需两端同步
    expect(REF_TEXT_MIME_TYPE).toBe("ref_text/plain");
  });

  it("allows an optional quote on a user message", () => {
    const message: ConversationMessage = {
      id: "m1",
      role: "user",
      content: "帮我解释",
      quote: "选中的原文",
    };
    expect(message.quote).toBe("选中的原文");
  });
});
