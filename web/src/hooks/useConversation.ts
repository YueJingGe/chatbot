import { useState, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import type { Conversation, ConversationMessage } from "../types/conversation";

const STORAGE_KEY_CONVERSATIONS = "chatbot_conversations";
const STORAGE_KEY_ACTIVE_ID = "chatbot_active_id";

const DEFAULT_GREETING: ConversationMessage = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "你好！我是你的AI助手。",
};

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    /* 解析失败，使用默认值 */
  }
  return [];
}

function loadActiveId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
}

function saveActiveId(id: string) {
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

function createDefaultConversation(): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "新对话",
    messages: [DEFAULT_GREETING],
    createdAt: now,
    updatedAt: now,
  };
}

function getConversationTitle(messages: ConversationMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    return firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? "..." : "");
  }
  return "新对话";
}

export function useConversation() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = loadConversations();
    if (stored.length > 0) return stored;
    const initial = [createDefaultConversation()];
    saveConversations(initial);
    return initial;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const storedId = loadActiveId();
    if (storedId && conversations.some((c) => c.id === storedId)) return storedId;
    const firstId = conversations[0]?.id;
    if (firstId) saveActiveId(firstId);
    return firstId ?? "";
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  // 防抖保存
  const persistConversations = useCallback((next: Conversation[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConversations(next);
    }, 300);
  }, []);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateMessages = useCallback(
    (newMessages: ConversationMessage[]) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== activeId) return c;
          const title = c.messages.some((m) => m.role === "user")
            ? c.title
            : getConversationTitle(newMessages);
          return { ...c, messages: newMessages, title, updatedAt: Date.now() };
        });
        persistConversations(next);
        return next;
      });
    },
    [activeId, persistConversations]
  );

  const createConversation = useCallback((): boolean => {
    const current = conversations.find((c) => c.id === activeId);
    const hasUserMessages = current?.messages.some((m) => m.role === "user");

    if (!hasUserMessages) {
      message.info("当前已是新对话");
      return false;
    }

    const newConv = createDefaultConversation();
    setConversations((prev) => {
      const next = [newConv, ...prev];
      persistConversations(next);
      return next;
    });
    setActiveId(newConv.id);
    saveActiveId(newConv.id);
    return true;
  }, [conversations, activeId, persistConversations]);

  const switchConversation = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
      saveActiveId(id);
    },
    [activeId]
  );

  return {
    conversations,
    activeConversation,
    messages,
    activeId,
    createConversation,
    switchConversation,
    updateMessages,
  };
}
