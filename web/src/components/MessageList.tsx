import { memo } from "react";
import styles from "./MessageList.module.less";

interface Message {
  id: string | number;
  role: string;
  content?: string;
  statusMessage?: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = memo(({ messages }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          data-message-id={message.id}
          className={`${styles.message} ${styles[message.role + "-message"]}`}
        >
          <div className={styles.bubble}>
            {message.statusMessage && !message.content ? (
              <span className={styles.status}>{message.statusMessage}</span>
            ) : message.content ? (
              message.content
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
        </div>
      ))}
    </>
  );
});

export default MessageList;
