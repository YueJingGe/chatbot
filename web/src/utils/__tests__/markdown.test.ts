import { describe, expect, it } from "vitest";

import { stripMarkdown } from "../markdown";

describe("stripMarkdown", () => {
  it("returns plain text for a paragraph", () => {
    expect(stripMarkdown("hello world")).toBe("hello world");
  });

  it("removes bold markers", () => {
    expect(stripMarkdown("**bold**")).toBe("bold");
  });

  it("removes italic markers", () => {
    expect(stripMarkdown("*italic*")).toBe("italic");
  });

  it("removes code block markers and keeps inner text", () => {
    const markdown = "```js\nconst a = 1;\n```";
    expect(stripMarkdown(markdown)).toBe("const a = 1;");
  });

  it("removes inline code markers", () => {
    expect(stripMarkdown("use `code` here")).toBe("use code here");
  });

  it("returns empty string for empty input", () => {
    expect(stripMarkdown("")).toBe("");
  });
});
