import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";

import { copyToClipboard } from "../../utils/copy";
import { SelectionToolbar } from "./index";

vi.mock("antd", () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../utils/copy", () => ({
  copyToClipboard: vi.fn(),
}));

const mockedCopy = vi.mocked(copyToClipboard);
const mockedSuccess = vi.mocked(message.success);
const mockedError = vi.mocked(message.error);

const RECT = {
  x: 10,
  y: 20,
  width: 120,
  height: 24,
  top: 20,
  right: 130,
  bottom: 44,
  left: 10,
} as DOMRect;

function renderToolbar(overrides: Partial<Parameters<typeof SelectionToolbar>[0]> = {}) {
  const props = {
    text: "生日快乐",
    rect: RECT,
    visible: true,
    onQuote: vi.fn(),
    onHide: vi.fn(),
    ...overrides,
  };
  const utils = render(<SelectionToolbar {...props} />);
  return { props, ...utils };
}

describe("SelectionToolbar", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders nothing when not visible", () => {
    renderToolbar({ visible: false });

    expect(screen.queryByRole("button", { name: "引用" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "复制" })).not.toBeInTheDocument();
  });

  it("renders quote and copy buttons when visible", () => {
    renderToolbar();

    expect(screen.getByRole("button", { name: "引用" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
  });

  it("calls onQuote with the selected text when quote is clicked", () => {
    const { props } = renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "引用" }));

    expect(props.onQuote).toHaveBeenCalledWith("生日快乐");
  });

  it("copies the selected text and shows success toast", async () => {
    mockedCopy.mockResolvedValueOnce(undefined);
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await act(async () => {});

    expect(mockedCopy).toHaveBeenCalledWith("生日快乐");
    expect(mockedSuccess).toHaveBeenCalledWith("复制成功");
  });

  it("shows error toast when copying fails", async () => {
    mockedCopy.mockRejectedValueOnce(new Error("denied"));
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await act(async () => {});

    expect(mockedError).toHaveBeenCalledWith("复制失败");
    expect(mockedSuccess).not.toHaveBeenCalled();
  });

  it("calls onHide 3 seconds after copying", async () => {
    vi.useFakeTimers();
    mockedCopy.mockResolvedValueOnce(undefined);
    const { props } = renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await act(async () => {});
    expect(props.onHide).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.onHide).toHaveBeenCalledTimes(1);
  });

  it("clears the hide timer on unmount", async () => {
    vi.useFakeTimers();
    mockedCopy.mockResolvedValueOnce(undefined);
    const { props, unmount } = renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await act(async () => {});
    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.onHide).not.toHaveBeenCalled();
  });
});
