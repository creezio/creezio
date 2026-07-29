/**
 * @creezio/assistant — chat plateforme (Phase H1.5 / I2 sqlite core).
 *
 * Persistance cible I2 : sqlite **core** (`createSqliteAssistantStore`).
 * Chemin historique `resolveAssistantDbPath` (`assistant_chats.db`) = legacy marques.
 */

export type {
  AssistantConversation,
  AssistantMessage,
  AssistantRole,
  AssistantStore,
  CreateConversationInput,
  AppendMessageInput,
} from "./types.js";
export { ASSISTANT_IPC_SURFACE } from "./types.js";
export { ASSISTANT_CORE_SQL, ensureAssistantRichColumnsSql } from "./schema.js";
export { createMemoryAssistantStore } from "./memory-store.js";
export type {
  CreateSqliteAssistantStoreOptions,
  SqliteAssistantStore,
} from "./sqlite-store.js";
export { createSqliteAssistantStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase, SqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
