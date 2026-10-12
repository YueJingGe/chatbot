/** 引用文本随请求体 messages 独立项发送时携带的 mimeType 标记 */
export const REF_TEXT_MIME_TYPE = "ref_text/plain";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  statusMessage?: string;
  /** 发送前选中的引用文本；随消息持久化，用于气泡内引用行展示 */
  quote?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}
