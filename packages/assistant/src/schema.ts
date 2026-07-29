/**
 * DDL assistant — tables dans sqlite **core** (Phase I2).
 *
 * Décision figée : persistance cible = `resolveCoreDbPath` / SqliteRuntime core.
 * `resolveAssistantDbPath` (`assistant_chats.db`) reste un chemin **historique**
 * pour marques non migrées ; ne pas l’utiliser pour les nouveaux stores kit.
 */
export const ASSISTANT_CORE_SQL = `
CREATE TABLE IF NOT EXISTS creezio_assistant_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creezio_assistant_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL
    REFERENCES creezio_assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creezio_assistant_messages_conv
  ON creezio_assistant_messages(conversation_id, created_at);
`;
