import crypto from "node:crypto";
import type {
  AssistantConversation,
  AssistantMessage,
  AssistantStore,
} from "./types.js";

function now(): string {
  return new Date().toISOString();
}

export function createMemoryAssistantStore(): AssistantStore {
  const conversations = new Map<string, AssistantConversation>();
  const messages = new Map<string, AssistantMessage[]>();

  return {
    createConversation(input) {
      const ts = now();
      const c: AssistantConversation = {
        id: crypto.randomUUID(),
        title: (input?.title || "Nouvelle conversation").trim(),
        createdAt: ts,
        updatedAt: ts,
      };
      conversations.set(c.id, c);
      messages.set(c.id, []);
      return c;
    },
    listConversations() {
      return [...conversations.values()].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    },
    getConversation(id) {
      return conversations.get(id);
    },
    appendMessage(conversationId, input) {
      const c = conversations.get(conversationId);
      if (!c) throw new Error("conversation_not_found");
      const msg: AssistantMessage = {
        id: crypto.randomUUID(),
        conversationId,
        role: input.role,
        content: input.content,
        createdAt: now(),
      };
      const list = messages.get(conversationId) || [];
      list.push(msg);
      messages.set(conversationId, list);
      conversations.set(conversationId, { ...c, updatedAt: msg.createdAt });
      return msg;
    },
    listMessages(conversationId) {
      return [...(messages.get(conversationId) || [])];
    },
  };
}
