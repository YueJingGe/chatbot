export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  statusMessage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}
