import { memo } from "react";
import "./MessageList.css";

interface Message {
  id: string | number;
  role: string;
  content?: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = memo(({ messages }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}-message`}>
          <div className="bubble">
            {message.content ? (
              message.content
            ) : (
              message.role === "assistant" && (
                <span className="typing-indicator" aria-label="正在输入">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
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
