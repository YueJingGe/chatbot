import { memo, KeyboardEvent } from "react";
import { CloseOutlined } from "@ant-design/icons";

import styles from "./index.module.less";

interface InputAreaProps {
  inputText: string;
  setInputText: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** 待发送的引用文本；存在时输入框上方展示引用条 */
  quote?: string;
  /** 点击关闭按钮时清除引用 */
  onClearQuote?: () => void;
}

const InputArea = memo(
  ({
    inputText,
    setInputText,
    isLoading,
    sendMessage,
    handleKeyPress,
    quote,
    onClearQuote,
  }: InputAreaProps) => {
    const isSendDisabled = isLoading || inputText.trim() === "";

    return (
      <div className={styles["input-area"]}>
        {quote ? (
          <div className={styles["quote-bar"]}>
            <span className={styles["quote-bar__text"]}>{quote}</span>
            <button
              type="button"
              className={styles["quote-bar__close"]}
              aria-label="关闭引用"
              onClick={onClearQuote}
            >
              <CloseOutlined />
            </button>
          </div>
        ) : null}
        <div className={styles["input-wrapper"]}>
          <input
            type="text"
            className={styles["chat-input"]}
            placeholder="输入消息，Enter 发送…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            autoComplete="off"
            aria-label="聊天输入框"
          />
          <button
            className={`${styles["send-button"]}${isLoading ? ` ${styles["send-button--loading"]}` : ""}`}
            onClick={sendMessage}
            disabled={isSendDisabled}
            title="发送"
            aria-label="发送消息"
          >
            {!isLoading && <i className="fas fa-paper-plane"></i>}
          </button>
        </div>
        <div className={styles.hint}>
          <i className="fas fa-keyboard"></i> Enter 发送 · Shift+Enter 换行
        </div>
      </div>
    );
  }
);

export default InputArea;
