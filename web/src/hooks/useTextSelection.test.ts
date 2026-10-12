import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTextSelection } from "./useTextSelection";

const ALLOWED_SELECTOR = "[data-selectable='assistant']";

interface FakeSelectionOptions {
  text?: string;
  collapsed?: boolean;
  anchorNode?: Node | null;
}

/** 构造 jsdom 缺失的 Selection 形状，仅覆盖 hook 消费的字段 */
function createFakeSelection({
  text = "",
  collapsed = false,
  anchorNode = null,
}: FakeSelectionOptions) {
  return {
    isCollapsed: collapsed,
    rangeCount: collapsed ? 0 : 1,
    anchorNode,
    toString: () => text,
    getRangeAt: () => ({
      getBoundingClientRect: () => ({ x: 10, y: 20, width: 120, height: 24 }),
    }),
  } as unknown as Selection;
}

function mountAnchorNode(insideContainer: boolean): Node {
  const host = document.createElement(insideContainer ? "div" : "p");
  if (insideContainer) {
    host.setAttribute("data-selectable", "assistant");
  }
  const node = document.createTextNode("选中文本");
  host.appendChild(node);
  document.body.appendChild(host);
  return node;
}

function fireMouseUp() {
  document.dispatchEvent(new MouseEvent("mouseup"));
}

function fireSelectionChange() {
  document.dispatchEvent(new Event("selectionchange"));
}

describe("useTextSelection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("shows selection text and rect when anchor is inside the allowed container", () => {
    const anchorNode = mountAnchorNode(true);
    vi.spyOn(window, "getSelection").mockReturnValue(
      createFakeSelection({ text: "生日快乐", anchorNode })
    );

    const { result } = renderHook(() => useTextSelection({ allowedSelector: ALLOWED_SELECTOR }));
    act(() => {
      fireMouseUp();
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.text).toBe("生日快乐");
    expect(result.current.rect?.width).toBe(120);
    expect(result.current.rect?.height).toBe(24);
  });

  it("stays hidden when selection anchor is outside the allowed container", () => {
    const anchorNode = mountAnchorNode(false);
    vi.spyOn(window, "getSelection").mockReturnValue(
      createFakeSelection({ text: "选中文本", anchorNode })
    );

    const { result } = renderHook(() => useTextSelection({ allowedSelector: ALLOWED_SELECTOR }));
    act(() => {
      fireMouseUp();
    });

    expect(result.current.visible).toBe(false);
  });

  it("stays hidden when selected text is blank", () => {
    vi.spyOn(window, "getSelection").mockReturnValue(createFakeSelection({ text: "   " }));

    const { result } = renderHook(() => useTextSelection({ allowedSelector: ALLOWED_SELECTOR }));
    act(() => {
      fireMouseUp();
    });

    expect(result.current.visible).toBe(false);
  });

  it("hides when the selection collapses", () => {
    const anchorNode = mountAnchorNode(true);
    const selectionSpy = vi.spyOn(window, "getSelection");
    selectionSpy.mockReturnValue(createFakeSelection({ text: "选中文本", anchorNode }));

    const { result } = renderHook(() => useTextSelection({ allowedSelector: ALLOWED_SELECTOR }));
    act(() => {
      fireMouseUp();
    });
    expect(result.current.visible).toBe(true);

    selectionSpy.mockReturnValue(createFakeSelection({ collapsed: true }));
    act(() => {
      fireSelectionChange();
    });

    expect(result.current.visible).toBe(false);
  });

  it("supports manual hide", () => {
    const anchorNode = mountAnchorNode(true);
    vi.spyOn(window, "getSelection").mockReturnValue(
      createFakeSelection({ text: "选中文本", anchorNode })
    );

    const { result } = renderHook(() => useTextSelection({ allowedSelector: ALLOWED_SELECTOR }));
    act(() => {
      fireMouseUp();
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.hide();
    });

    expect(result.current.visible).toBe(false);
  });
});
