import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import ScrollToBottomButton from "./components/ScrollToBottomButton";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { QuestionHistoryPanel } from "./components/QuestionHistoryPanel";
import { PlatformFooter } from "./components/PlatformFooter";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { useConversation } from "./hooks/useConversation";
import { useTextSelection } from "./hooks/useTextSelection";
import { REF_TEXT_MIME_TYPE } from "./types/conversation";
import { checkIsAtBottom } from "./utils/scroll";
import { getPlatformInfo } from "./utils/browser";
import { generateUuid } from "./utils/uuid";
import styles from "./App.module.less";

const QUOTE_STORAGE_KEY = "chatbot_quote";

export function App() {
  const platform = getPlatformInfo();
  const title = "ai 对话";
  // 页面分流只消费 pageType；未知保留原有「在线」回退。
  const onlineText =
    platform.pageType === "pc" ? "pc在线" : platform.pageType === "h5" ? "mobile在线" : "在线";
  const {
    conversations,
    messages,
    activeId,
    createConversation,
    switchConversation,
    updateMessages,
    updateAssistantMessage,
  } = useConversation();

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // 引用为单值状态：多次引用以最后一次为准；持久化到 localStorage 跨刷新保留
  const [quote, setQuote] = useState(() => localStorage.getItem(QUOTE_STORAGE_KEY) ?? "");
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const inputTextRef = useRef(inputText);
  const isLoadingRef = useRef(isLoading);
  const quoteRef = useRef(quote);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    text: selectedText,
    rect: selectionRect,
    visible: selectionVisible,
    hide: hideSelection,
  } = useTextSelection({ allowedSelector: "[data-selectable='assistant']" });

  useEffect(() => {
    messagesRef.current = messages;
    inputTextRef.current = inputText;
    isLoadingRef.current = isLoading;
  }, [messages, inputText, isLoading]);

  const handleScroll = useCallback(() => {
    if (chatHistoryRef.current) {
      setIsAtBottom(checkIsAtBottom(chatHistoryRef.current));
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScrollToBottomClick = useCallback(() => {
    setIsAtBottom(true);
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // 滚动到指定消息
  const scrollToMessage = useCallback((messageId: string) => {
    if (!chatHistoryRef.current) return;
    const element = chatHistoryRef.current.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 引用唯一修改入口：同步 ref 供 sendMessage 读取最新值，并持久化到 localStorage
  const updateQuote = useCallback((value: string) => {
    quoteRef.current = value;
    setQuote(value);
    if (value) {
      localStorage.setItem(QUOTE_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(QUOTE_STORAGE_KEY);
    }
  }, []);

  const handleQuote = useCallback(
    (text: string) => {
      updateQuote(text);
      hideSelection();
    },
    [updateQuote, hideSelection]
  );

  const handleClearQuote = useCallback(() => {
    updateQuote("");
  }, [updateQuote]);

  const sendMessage = useCallback(async () => {
    const textToSend = inputTextRef.current.trim();
    if (!textToSend || isLoadingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const quoteToSend = quoteRef.current;
    const newUserMessage = {
      id: generateUuid(),
      role: "user" as const,
      content: textToSend,
      ...(quoteToSend ? { quote: quoteToSend } : {}),
    };
    const updatedMessages = [...messagesRef.current, newUserMessage];
    updateMessages(updatedMessages);
    setIsAtBottom(true);
    setInputText("");
    setIsLoading(true);

    const assistantMessageId = generateUuid();
    const messagesWithAssistant = [
      ...updatedMessages,
      { id: assistantMessageId, role: "assistant" as const, content: "" },
    ];
    updateMessages(messagesWithAssistant);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 引用作为 messages 独立项发送，带 mimeType 标记供服务端识别
          messages: [
            ...(quoteToSend
              ? [{ role: "user" as const, content: quoteToSend, mimeType: REF_TEXT_MIME_TYPE }]
              : []),
            ...updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullReply = "";
      let hasServerError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === "[DONE]") {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                hasServerError = true;
                updateAssistantMessage(assistantMessageId, {
                  content: `抱歉，服务端出错：${data.error}`,
                });
                break;
              }
              if (data.status) {
                updateAssistantMessage(assistantMessageId, {
                  statusMessage: data.message,
                });
              }
              if (data.chunk) {
                fullReply += data.chunk;
                updateAssistantMessage(assistantMessageId, {
                  content: fullReply,
                  statusMessage: undefined,
                });
              }
            } catch {
              /* 忽略解析错误 */
            }
          }
        }
      }

      // 发送全链路无错完成才消费引用；网络错误、请求中断、服务端错误均保留引用便于重试
      if (quoteToSend && !hasServerError) {
        updateQuote("");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("发送失败:", error);
      updateAssistantMessage(assistantMessageId, {
        content: `抱歉，出错了: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateMessages, updateAssistantMessage, updateQuote]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      switchConversation(id);
    },
    [switchConversation]
  );

  // 提取当前会话的 user questions
  const questions = messages
    .filter((m) => m.role === "user")
    .map((m) => ({ id: m.id, content: m.content }));

  const handleSelectQuestion = useCallback(
    (messageId: string) => {
      scrollToMessage(messageId);
    },
    [scrollToMessage]
  );

  return (
    <div className={styles["app-layout"]}>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>{title}</h1>
          <p className={styles.subtitle}>
            <span className={styles["status-dot"]}></span>
            {onlineText}
          </p>
        </header>

        <main className={styles.main}>
          <div className={styles["chat-history-wrapper"]}>
            <div
              ref={chatHistoryRef}
              className={styles["chat-history"]}
              role="log"
              aria-label="聊天记录"
              aria-live="polite"
              onScroll={handleScroll}
            >
              <MessageList messages={messages} />
            </div>
            <ScrollToBottomButton visible={!isAtBottom} onClick={handleScrollToBottomClick} />
            <SelectionToolbar
              text={selectedText}
              rect={selectionRect}
              visible={selectionVisible}
              onQuote={handleQuote}
              onHide={hideSelection}
            />
            <QuestionHistoryPanel questions={questions} onSelectQuestion={handleSelectQuestion} />
          </div>

          <InputArea
            inputText={inputText}
            setInputText={setInputText}
            isLoading={isLoading}
            sendMessage={sendMessage}
            handleKeyPress={handleKeyPress}
            quote={quote}
            onClearQuote={handleClearQuote}
          />
        </main>

        <footer className={styles.footer}>
          Powered by 阿里云百炼 <PlatformFooter platform={platform} />
        </footer>
      </div>
    </div>
  );
}

export default App;
