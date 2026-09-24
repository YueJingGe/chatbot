import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Conversation } from "../../types/conversation";
import { ConversationSidebar } from "./index";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const conversations: Conversation[] = [
  { id: "c1", title: "对话一", messages: [], createdAt: 0, updatedAt: 0 },
  { id: "c2", title: "对话二", messages: [], createdAt: 0, updatedAt: 0 },
];

const defaultProps = {
  conversations,
  activeId: "c1",
  onNewConversation: vi.fn(),
  onSelectConversation: vi.fn(),
};

describe("ConversationSidebar", () => {
  it("renders new conversation button", () => {
    render(<ConversationSidebar {...defaultProps} />);
    expect(screen.getByText("新建对话").closest("button")).toBeInTheDocument();
  });

  it("renders conversation list", () => {
    render(<ConversationSidebar {...defaultProps} />);
    expect(screen.getByText("对话一")).toBeInTheDocument();
    expect(screen.getByText("对话二")).toBeInTheDocument();
  });

  it("calls onNewConversation when new button is clicked", async () => {
    const user = userEvent.setup();
    const onNewConversation = vi.fn();
    render(<ConversationSidebar {...defaultProps} onNewConversation={onNewConversation} />);

    const button = screen.getByText("新建对话").closest("button") as HTMLElement;
    await user.click(button);
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectConversation when item is clicked", async () => {
    const user = userEvent.setup();
    const onSelectConversation = vi.fn();
    render(<ConversationSidebar {...defaultProps} onSelectConversation={onSelectConversation} />);

    await user.click(screen.getByText("对话二"));
    expect(onSelectConversation).toHaveBeenCalledWith("c2");
  });

  it("selects conversation with Enter key", async () => {
    const user = userEvent.setup();
    const onSelectConversation = vi.fn();
    render(<ConversationSidebar {...defaultProps} onSelectConversation={onSelectConversation} />);

    const item = screen.getByText("对话二").closest('[role="button"]') as HTMLElement;
    item.focus();
    await user.keyboard("{Enter}");
    expect(onSelectConversation).toHaveBeenCalledWith("c2");
  });
});
