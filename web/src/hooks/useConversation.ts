import { useState, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import type { Conversation, ConversationMessage } from "../types/conversation";

const STORAGE_KEY_CONVERSATIONS = "chatbot_conversations";
const STORAGE_KEY_ACTIVE_ID = "chatbot_active_id";

function createDefaultConversation(): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "新对话",
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "你好！我是你的AI助手。",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (c) =>
            c &&
            typeof c.id === "string" &&
            typeof c.title === "string" &&
            Array.isArray(c.messages) &&
            typeof c.createdAt === "number" &&
            typeof c.updatedAt === "number"
        )
      ) {
        return parsed;
      }
    }
  } catch {
    /* 解析失败，使用默认值 */
  }
  return [];
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    /* 存储满或禁止访问，保留内存状态 */
  }
}

function saveActiveId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {
    /* 存储满或禁止访问，保留内存状态 */
  }
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
  const pendingSaveRef = useRef<Conversation[] | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  // 防抖保存
  const persistConversations = useCallback((next: Conversation[]) => {
    pendingSaveRef.current = next;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConversations(next);
      pendingSaveRef.current = null;
    }, 300);
  }, []);

  // 组件卸载时：清除定时器，若有待写入数据则同步落盘
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (pendingSaveRef.current) {
          saveConversations(pendingSaveRef.current);
        }
      }
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
