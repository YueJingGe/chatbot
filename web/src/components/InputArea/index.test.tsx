import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import InputArea from "./index";

const defaultProps = {
  inputText: "",
  setInputText: vi.fn(),
  isLoading: false,
  sendMessage: vi.fn(),
  handleKeyPress: vi.fn(),
};

describe("InputArea", () => {
  test("发送按钮在输入为空字符串时被禁用", () => {
    render(<InputArea {...defaultProps} inputText="" />);
    expect(screen.getByRole("button", { name: "发送消息" })).toBeDisabled();
  });

  test("发送按钮在输入仅包含空白字符时被禁用", () => {
    render(<InputArea {...defaultProps} inputText="   " />);
    expect(screen.getByRole("button", { name: "发送消息" })).toBeDisabled();
  });

  test("发送按钮在输入非空时可用", () => {
    render(<InputArea {...defaultProps} inputText="hello" />);
    expect(screen.getByRole("button", { name: "发送消息" })).toBeEnabled();
  });

  test("发送按钮在加载状态时被禁用", () => {
    render(<InputArea {...defaultProps} inputText="hello" isLoading />);
    expect(screen.getByRole("button", { name: "发送消息" })).toBeDisabled();
  });
});
