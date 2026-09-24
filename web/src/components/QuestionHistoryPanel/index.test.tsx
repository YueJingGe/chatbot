import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionHistoryPanel } from "./index";

const questions = [
  { id: "q1", content: "问题一" },
  { id: "q2", content: "问题二" },
];

const defaultProps = {
  questions,
  onSelectQuestion: vi.fn(),
};

describe("QuestionHistoryPanel", () => {
  it("renders trigger dashes for each question", () => {
    render(<QuestionHistoryPanel {...defaultProps} />);
    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(questions.length);
  });

  it("expands panel on hover and shows questions", async () => {
    const user = userEvent.setup();
    render(<QuestionHistoryPanel {...defaultProps} />);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(screen.getByText("问题一")).toBeInTheDocument();
    expect(screen.getByText("问题二")).toBeInTheDocument();
  });

  it("calls onSelectQuestion when question is clicked", () => {
    const onSelectQuestion = vi.fn();
    render(<QuestionHistoryPanel {...defaultProps} onSelectQuestion={onSelectQuestion} />);

    const trigger = screen.getByRole("button");
    fireEvent.mouseEnter(trigger);

    const item = screen.getByText("问题二").closest('[role="button"]') as HTMLElement;
    fireEvent.click(item);
    expect(onSelectQuestion).toHaveBeenCalledWith("q2");
  });

  it("shows empty state when questions list is empty", async () => {
    const user = userEvent.setup();
    render(<QuestionHistoryPanel {...defaultProps} questions={[]} />);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(screen.getByText("暂无提问")).toBeInTheDocument();
  });
});
