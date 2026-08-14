import { memo, KeyboardEvent } from "react";
import "./InputArea.css";

interface InputAreaProps {
  inputText: string;
  setInputText: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const InputArea = memo(({ inputText, setInputText, isLoading, sendMessage, handleKeyPress }: InputAreaProps) => {
  return (
    <div className="input-area">
      <div className="input-wrapper">
        <input
          type="text"
          className="chat-input"
          placeholder="输入消息，Enter 发送…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          autoComplete="off"
          aria-label="聊天输入框"
        />
        <button
          className={`send-button${isLoading ? " send-button--loading" : ""}`}
          onClick={sendMessage}
          disabled={isLoading}
          title="发送"
          aria-label="发送消息"
        >
          {!isLoading && <i className="fas fa-paper-plane"></i>}
        </button>
      </div>
      <div className="hint">
        <i className="fas fa-keyboard"></i> Enter 发送 · Shift+Enter 换行
      </div>
    </div>
  );
});

export default InputArea;
