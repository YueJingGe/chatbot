import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ScrollToBottomButton from "./index";

describe("ScrollToBottomButton", () => {
  it("renders visible button with accessible label", () => {
    render(<ScrollToBottomButton visible onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: "回到底部" });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-hidden", "true");
  });

  it("hides button when not visible", () => {
    render(<ScrollToBottomButton visible={false} onClick={vi.fn()} />);
    const button = document.querySelector("button") as HTMLElement;
    expect(button).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ScrollToBottomButton visible onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "回到底部" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
