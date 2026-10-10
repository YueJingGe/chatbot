import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import ScrollToBottomButton from "./components/ScrollToBottomButton";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { QuestionHistoryPanel } from "./components/QuestionHistoryPanel";
import { PlatformFooter } from "./components/PlatformFooter";
import { useConversation } from "./hooks/useConversation";
import { checkIsAtBottom } from "./utils/scroll";
import { getPlatformInfo } from "./utils/browser";
import { generateUuid } from "./utils/uuid";
import styles from "./App.module.less";

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
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const inputTextRef = useRef(inputText);
  const isLoadingRef = useRef(isLoading);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const sendMessage = useCallback(async () => {
    const textToSend = inputTextRef.current.trim();
    if (!textToSend || isLoadingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const newUserMessage = {
      id: generateUuid(),
      role: "user" as const,
      content: textToSend,
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
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullReply = "";

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
  }, [updateMessages, updateAssistantMessage]);

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
            <QuestionHistoryPanel questions={questions} onSelectQuestion={handleSelectQuestion} />
          </div>

          <InputArea
            inputText={inputText}
            setInputText={setInputText}
            isLoading={isLoading}
            sendMessage={sendMessage}
            handleKeyPress={handleKeyPress}
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
