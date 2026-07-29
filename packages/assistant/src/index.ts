/**
 * @creezio/assistant — chat plateforme (Phase H1.5).
 *
 * DB : chemin historique `resolveAssistantDbPath` (`assistant_chats.db`).
 * H1 livre le store mémoire + contrats ; persistance sqlite core = suite.
 */

export type {
  AssistantConversation,
  AssistantMessage,
  AssistantRole,
  AssistantStore,
} from "./types.js";
export { ASSISTANT_IPC_SURFACE } from "./types.js";
export { createMemoryAssistantStore } from "./memory-store.js";
