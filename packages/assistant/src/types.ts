export type AssistantRole = "user" | "assistant" | "system";

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
};

export type AssistantConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantStore = {
  createConversation(input?: { title?: string }): AssistantConversation;
  listConversations(): AssistantConversation[];
  getConversation(id: string): AssistantConversation | undefined;
  appendMessage(
    conversationId: string,
    input: { role: AssistantRole; content: string },
  ): AssistantMessage;
  listMessages(conversationId: string): AssistantMessage[];
};

/** Surfaces IPC documentées (implémentation host = electron-shell / marque). */
export const ASSISTANT_IPC_SURFACE = {
  setChrome: "assistant:set-chrome",
  openRequest: "assistant:open-request",
  llmKeyStatus: "llm:key-status",
  llmSetKey: "llm:set-key",
  llmStatusChanged: "llm:status-changed",
} as const;
