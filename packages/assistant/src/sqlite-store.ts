/**
 * Store assistant persisté dans sqlite **core** (Phase I2).
 */

import crypto from "node:crypto";
import { ASSISTANT_CORE_SQL } from "./schema.js";
import type {
  AssistantConversation,
  AssistantMessage,
  AssistantRole,
  AssistantStore,
} from "./types.js";
import {
  openNodeSqliteDatabase,
  type OpenSqliteDatabase,
  type SqliteDatabase,
} from "./sqlite-driver.js";

function now(): string {
  return new Date().toISOString();
}

export type SqliteAssistantStore = AssistantStore & {
  close(): void;
  readonly dbPath: string;
};

export type CreateSqliteAssistantStoreOptions = {
  /** Chemin sqlite core (recommandé). */
  coreDbPath: string;
  openDatabase?: OpenSqliteDatabase;
};

type ConvRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MsgRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

function convFrom(r: ConvRow): AssistantConversation {
  return {
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function msgFrom(r: MsgRow): AssistantMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role as AssistantRole,
    content: r.content,
    createdAt: r.created_at,
  };
}

export function createSqliteAssistantStore(
  opts: CreateSqliteAssistantStoreOptions,
): SqliteAssistantStore {
  const open = opts.openDatabase || openNodeSqliteDatabase;
  const db: SqliteDatabase = open(opts.coreDbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(ASSISTANT_CORE_SQL);

  const store: SqliteAssistantStore = {
    dbPath: opts.coreDbPath,

    close() {
      db.close?.();
    },

    createConversation(input) {
      const ts = now();
      const c: AssistantConversation = {
        id: crypto.randomUUID(),
        title: (input?.title || "Nouvelle conversation").trim(),
        createdAt: ts,
        updatedAt: ts,
      };
      db.prepare(
        `INSERT INTO creezio_assistant_conversations
        (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      ).run(c.id, c.title, c.createdAt, c.updatedAt);
      return c;
    },

    listConversations() {
      const rows = db
        .prepare(
          `SELECT * FROM creezio_assistant_conversations
           ORDER BY updated_at DESC`,
        )
        .all() as ConvRow[];
      return rows.map(convFrom);
    },

    getConversation(id) {
      const row = db
        .prepare(`SELECT * FROM creezio_assistant_conversations WHERE id = ?`)
        .get(id) as ConvRow | undefined;
      return row ? convFrom(row) : undefined;
    },

    appendMessage(conversationId, input) {
      const c = store.getConversation(conversationId);
      if (!c) throw new Error("conversation_not_found");
      const msg: AssistantMessage = {
        id: crypto.randomUUID(),
        conversationId,
        role: input.role,
        content: input.content,
        createdAt: now(),
      };
      db.prepare(
        `INSERT INTO creezio_assistant_messages
        (id, conversation_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)`,
      ).run(msg.id, msg.conversationId, msg.role, msg.content, msg.createdAt);
      db.prepare(
        `UPDATE creezio_assistant_conversations SET updated_at = ? WHERE id = ?`,
      ).run(msg.createdAt, conversationId);
      return msg;
    },

    listMessages(conversationId) {
      const rows = db
        .prepare(
          `SELECT * FROM creezio_assistant_messages
           WHERE conversation_id = ?
           ORDER BY created_at ASC`,
        )
        .all(conversationId) as MsgRow[];
      return rows.map(msgFrom);
    },
  };

  return store;
}
