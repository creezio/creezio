/**
 * Store mails plateforme — sqlite **core** (Phase I3 + C1 inbound index).
 */

import crypto from "node:crypto";
import {
  PLATFORM_MAILS_CORE_SQL,
  ensureMailsInboundColumnsSql,
  type MailProvider,
  type PlatformMail,
  type PlatformMailsStore,
} from "./types.js";
import {
  openNodeSqliteDatabase,
  type OpenSqliteDatabase,
  type SqliteDatabase,
} from "./sqlite-driver.js";

function now(): string {
  return new Date().toISOString();
}

type Row = {
  id: string;
  user_id: string;
  to_addr: string;
  subject: string;
  body: string;
  status: string;
  provider_id: string | null;
  from_addr?: string;
  message_id?: string | null;
  folder?: string;
  read_at?: string | null;
  brand_email_id?: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(r: Row): PlatformMail {
  return {
    id: r.id,
    userId: r.user_id,
    to: r.to_addr,
    subject: r.subject,
    body: r.body,
    status: r.status as PlatformMail["status"],
    providerId: r.provider_id,
    from: r.from_addr || "",
    messageId: r.message_id ?? null,
    folder: r.folder || "outbox",
    readAt: r.read_at ?? null,
    brandEmailId: r.brand_email_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function ensureInboundColumns(db: SqliteDatabase): void {
  for (const sql of ensureMailsInboundColumnsSql()) {
    try {
      db.exec(sql);
    } catch {
      /* already exists */
    }
  }
}

export type SqliteMailsStore = PlatformMailsStore & {
  close(): void;
  readonly dbPath: string;
  readonly defaultProviderId: string;
};

export type CreateSqliteMailsStoreOptions = {
  coreDbPath: string;
  openDatabase?: OpenSqliteDatabase;
  /**
   * Provider utilisé par `queueSend` (défaut `file-sink` si enregistré,
   * sinon `platform-stub`).
   */
  defaultProviderId?: string;
};

export function createSqliteMailsStore(
  opts: CreateSqliteMailsStoreOptions,
): SqliteMailsStore {
  const open = opts.openDatabase || openNodeSqliteDatabase;
  const db: SqliteDatabase = open(opts.coreDbPath);
  db.exec(PLATFORM_MAILS_CORE_SQL);
  ensureInboundColumns(db);

  const providers = new Map<string, MailProvider>();
  providers.set("platform-stub", {
    id: "platform-stub",
    async send(mail) {
      return { ok: Boolean(mail.to && mail.subject) };
    },
  });

  let defaultProviderId = opts.defaultProviderId || "platform-stub";

  function persist(mail: PlatformMail): void {
    db.prepare(
      `INSERT INTO creezio_platform_mails
      (id, user_id, to_addr, subject, body, status, provider_id,
       from_addr, message_id, folder, read_at, brand_email_id,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        to_addr = excluded.to_addr,
        subject = excluded.subject,
        body = excluded.body,
        status = excluded.status,
        provider_id = excluded.provider_id,
        from_addr = excluded.from_addr,
        message_id = excluded.message_id,
        folder = excluded.folder,
        read_at = excluded.read_at,
        brand_email_id = excluded.brand_email_id,
        updated_at = excluded.updated_at`,
    ).run(
      mail.id,
      mail.userId,
      mail.to,
      mail.subject,
      mail.body,
      mail.status,
      mail.providerId,
      mail.from || "",
      mail.messageId ?? null,
      mail.folder || "outbox",
      mail.readAt ?? null,
      mail.brandEmailId ?? null,
      mail.createdAt,
      mail.updatedAt,
    );
  }

  const store: SqliteMailsStore = {
    dbPath: opts.coreDbPath,
    get defaultProviderId() {
      return defaultProviderId;
    },
    close() {
      db.close?.();
    },
    createDraft(input) {
      const ts = now();
      const mail: PlatformMail = {
        id: crypto.randomUUID(),
        userId: input.userId,
        to: input.to.trim(),
        subject: input.subject.trim(),
        body: input.body || "",
        status: "draft",
        providerId: null,
        folder: "outbox",
        createdAt: ts,
        updatedAt: ts,
      };
      persist(mail);
      return mail;
    },
    insertInbound(input) {
      if (input.messageId) {
        const existing = db
          .prepare(
            `SELECT * FROM creezio_platform_mails WHERE message_id = ? LIMIT 1`,
          )
          .get(input.messageId) as Row | undefined;
        if (existing) return fromRow(existing);
      }
      const ts = now();
      const mail: PlatformMail = {
        id: input.id || crypto.randomUUID(),
        userId: input.userId,
        to: input.to.trim(),
        from: input.from.trim(),
        subject: input.subject.trim() || "(sans objet)",
        body: input.body || "",
        status: "inbound",
        providerId: null,
        messageId: input.messageId ?? null,
        folder: "inbox",
        brandEmailId: input.brandEmailId ?? null,
        createdAt: ts,
        updatedAt: ts,
      };
      persist(mail);
      return mail;
    },
    list(userId) {
      const rows = db
        .prepare(
          `SELECT * FROM creezio_platform_mails WHERE user_id = ?
           ORDER BY updated_at DESC`,
        )
        .all(userId) as Row[];
      return rows.map(fromRow);
    },
    get(id) {
      const row = db
        .prepare(`SELECT * FROM creezio_platform_mails WHERE id = ?`)
        .get(id) as Row | undefined;
      return row ? fromRow(row) : undefined;
    },
    registerProvider(provider) {
      providers.set(provider.id, provider);
      if (
        !opts.defaultProviderId &&
        provider.id !== "platform-stub" &&
        defaultProviderId === "platform-stub"
      ) {
        defaultProviderId = provider.id;
      }
    },
    async queueSend(id, actorUserId) {
      const mail = store.get(id);
      if (!mail) throw new Error("not_found");
      if (mail.userId !== actorUserId) throw new Error("forbidden");
      const provider =
        providers.get(defaultProviderId) || providers.get("platform-stub")!;
      const queued: PlatformMail = {
        ...mail,
        status: "queued",
        providerId: provider.id,
        updatedAt: now(),
      };
      persist(queued);
      const result = await provider.send(queued);
      const final: PlatformMail = {
        ...queued,
        status: result.ok ? "sent" : "failed",
        updatedAt: now(),
      };
      persist(final);
      return final;
    },
  };

  return store;
}
