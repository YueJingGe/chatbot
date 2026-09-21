import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { message } from "antd";
import { describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "../../utils/copy";
import MessageList from "../MessageList";

vi.mock("../../utils/copy", () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("antd", () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const userMessage = {
  id: "msg-1",
  role: "user" as const,
  content: "要 pdf 格式",
};

const assistantMessage = {
  id: "msg-2",
  role: "assistant" as const,
  content: "**好的**，这是代码：\n```js\nconst a = 1;\n```",
};

describe("MessageList copy", () => {
  it("shows copy button on user message hover and copies content on click", async () => {
    const user = userEvent.setup();
    render(<MessageList messages={[userMessage]} />);

    const bubble = screen.getByText("要 pdf 格式");
    await user.hover(bubble);

    const copyButton = screen.getByRole("button", { name: /复制/i });
    await user.click(copyButton);

    expect(copyToClipboard).toHaveBeenCalledWith("要 pdf 格式");
    expect(message.success).toHaveBeenCalledWith("复制成功");
  });

  it("shows dropdown on assistant message hover and copies plain text", async () => {
    const user = userEvent.setup();
    render(<MessageList messages={[assistantMessage]} />);

    const toggleButton = screen.getByRole("button", { name: /复制选项/i });
    await user.hover(toggleButton);

    const plainCopyItem = screen.getByRole("menuitem", { name: "复制" });
    await user.click(plainCopyItem);

    expect(copyToClipboard).toHaveBeenCalledWith("好的，这是代码：\nconst a = 1;");
    expect(message.success).toHaveBeenCalledWith("复制成功");
  });

  it("copies raw markdown when '复制为 Markdown' is selected", async () => {
    const user = userEvent.setup();
    render(<MessageList messages={[assistantMessage]} />);

    const toggleButton = screen.getByRole("button", { name: /复制选项/i });
    await user.hover(toggleButton);

    const markdownItem = screen.getByRole("menuitem", { name: "复制为 Markdown" });
    await user.click(markdownItem);

    expect(copyToClipboard).toHaveBeenCalledWith(assistantMessage.content);
    expect(message.success).toHaveBeenCalledWith("复制成功");
  });

  it("shows error toast when copy fails", async () => {
    const mockedCopy = vi.mocked(copyToClipboard);
    mockedCopy.mockRejectedValueOnce(new Error("fail"));

    const user = userEvent.setup();
    render(<MessageList messages={[userMessage]} />);

    const bubble = screen.getByText("要 pdf 格式");
    await user.hover(bubble);

    const copyButton = screen.getByRole("button", { name: /复制/i });
    await user.click(copyButton);

    await vi.waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("复制失败");
    });
  });
});
