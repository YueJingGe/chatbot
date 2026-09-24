import { describe, expect, it } from "vitest";

import { checkIsAtBottom } from "./scroll";

function createElement(scrollHeight: number, scrollTop: number, clientHeight: number): HTMLElement {
  return { scrollHeight, scrollTop, clientHeight } as HTMLElement;
}

describe("checkIsAtBottom", () => {
  it("returns true when already at the bottom", () => {
    const element = createElement(1000, 700, 300);
    expect(checkIsAtBottom(element)).toBe(true);
  });

  it("returns true when within the 30px threshold", () => {
    const element = createElement(1000, 670, 300);
    expect(checkIsAtBottom(element)).toBe(true);
  });

  it("returns false when 31px away from the bottom", () => {
    const element = createElement(1000, 669, 300);
    expect(checkIsAtBottom(element)).toBe(false);
  });

  it("returns false when far away from the bottom", () => {
    const element = createElement(1000, 0, 300);
    expect(checkIsAtBottom(element)).toBe(false);
  });

  it("returns true when scrolled past the bottom", () => {
    const element = createElement(1000, 750, 300);
    expect(checkIsAtBottom(element)).toBe(true);
  });
});
