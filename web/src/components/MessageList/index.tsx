import { memo, useCallback } from "react";
import { message } from "antd";
import ReactMarkdown from "react-markdown";

import { copyToClipboard } from "../../utils/copy";
import { stripMarkdown } from "../../utils/markdown";
import styles from "./index.module.less";

interface Message {
  id: string | number;
  role: string;
  content?: string;
  statusMessage?: string;
}

interface MessageListProps {
  messages: Message[];
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

interface CopyActionsProps {
  content: string;
  role: string;
}

const CopyActions = memo(({ content, role }: CopyActionsProps) => {
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(content);
      message.success("复制成功");
    } catch {
      message.error("复制失败");
    }
  }, [content]);

  const handleCopyPlain = useCallback(async () => {
    try {
      await copyToClipboard(stripMarkdown(content));
      message.success("复制成功");
    } catch {
      message.error("复制失败");
    }
  }, [content]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await copyToClipboard(content);
      message.success("复制成功");
    } catch {
      message.error("复制失败");
    }
  }, [content]);

  if (role === "user") {
    return (
      <div className={styles["copy-group"]}>
        <button
          type="button"
          className={styles["copy-button"]}
          aria-label="复制"
          onClick={handleCopy}
        >
          <CopyIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={styles["copy-group"]}>
      <button
        type="button"
        className={`${styles["copy-button"]} ${styles["copy-button-dropdown"]}`}
        aria-label="复制选项"
        aria-haspopup="menu"
      >
        <CopyIcon />
        <ChevronIcon />
      </button>
      <div className={styles["copy-menu"]} role="menu">
        <button
          type="button"
          className={styles["copy-menu-item"]}
          role="menuitem"
          onClick={handleCopyPlain}
        >
          复制
        </button>
        <button
          type="button"
          className={styles["copy-menu-item"]}
          role="menuitem"
          onClick={handleCopyMarkdown}
        >
          复制为 Markdown
        </button>
      </div>
    </div>
  );
});

const MessageList = memo(({ messages }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          data-message-id={message.id}
          className={`${styles.message} ${message.role === "user" ? styles["user-message"] : styles["bot-message"]}`}
        >
          <div className={styles.bubble}>
            {message.statusMessage && !message.content ? (
              <span className={styles.status}>{message.statusMessage}</span>
            ) : message.content ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.role === "assistant" && (
                <span className={styles["typing-indicator"]} aria-label="正在输入">
                  <span className={styles["typing-dot"]}></span>
                  <span className={styles["typing-dot"]}></span>
                  <span className={styles["typing-dot"]}></span>
                </span>
              )
            )}
          </div>
          <CopyActions content={message.content ?? ""} role={message.role} />
        </div>
      ))}
    </>
  );
});

export default MessageList;
