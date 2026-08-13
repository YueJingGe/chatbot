import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import "./App.css";

interface Message {
  id: string | number;
  role: string;
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "你好！我是你的AI助手。" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const inputTextRef = useRef(inputText);
  const isLoadingRef = useRef(isLoading);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
    inputTextRef.current = inputText;
    isLoadingRef.current = isLoading;
  }, [messages, inputText, isLoading]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const textToSend = inputTextRef.current.trim();
    if (!textToSend || isLoadingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const newUserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
    };
    const updatedMessages = [...messagesRef.current, newUserMessage];
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

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
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: `抱歉，服务端出错：${data.error}` }
                      : msg
                  )
                );
                break;
              }
              if (data.chunk) {
                fullReply += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id === assistantMessageId) {
                      return { ...msg, content: fullReply };
                    }
                    return msg;
                  })
                );
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
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === assistantMessageId) {
            return { ...msg, content: `抱歉，出错了: ${errorMessage}` };
          }
          return msg;
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="container">
      <header>
        <h1>AI 对话</h1>
        <p className="subtitle">
          <span className="status-dot"></span>
          在线
        </p>
      </header>

      <main>
        <div className="chat-history" role="log" aria-label="聊天记录" aria-live="polite">
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <InputArea
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
        />
      </main>

      <footer>
        Powered by 阿里云百炼
      </footer>
    </div>
  );
}

export default App;
