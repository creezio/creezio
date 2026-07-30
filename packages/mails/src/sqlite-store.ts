/**
 * Store mails plateforme — sqlite **core** (I3 + inbox SoT complète).
 */

import crypto from "node:crypto";
import {
  PLATFORM_MAILS_CORE_SQL,
  ensureMailsInboundColumnsSql,
  type InboundAttachmentInput,
  type MailProvider,
  type PlatformMail,
  type PlatformMailsStore,
} from "./types.js";
import {
  openNodeSqliteDatabase,
  type OpenSqliteDatabase,
  type SqliteDatabase,
} from "./sqlite-driver.js";
import {
  deleteInboxEmail,
  emailsReady,
  getInboxAttachment,
  getInboxEmail,
  insertInboundEmail,
  listInboxEmails,
  markInboxEmailRead,
  ensureMailsInboxSchema,
} from "./inbox-queries.js";
import type {
  InboxEmailDetail,
  InboxEmailListItem,
  InboundEmailInput,
} from "./types.js";

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
  text_body?: string | null;
  html_body?: string | null;
  received_at?: string | null;
  raw_headers?: string | null;
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
    textBody: r.text_body ?? null,
    htmlBody: r.html_body ?? null,
    receivedAt: r.received_at ?? null,
    rawHeaders: r.raw_headers ?? null,
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
  /** Accès DB pour routes / tests. */
  readonly db: SqliteDatabase;
  emailsReady(): boolean;
  listInbox(opts?: {
    folder?: string;
    q?: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): { rows: InboxEmailListItem[]; total: number; unread: number };
  getInbox(id: string): InboxEmailDetail | null;
  getAttachment(
    emailId: string,
    attachmentId: string,
  ): { filename: string; content_type: string; data: Buffer } | null;
  markRead(id: string, read: boolean): boolean;
  deleteMail(id: string): boolean;
  insertInboundFull(
    input: InboundEmailInput,
  ): { ok: true; id: string; duplicate?: boolean } | { ok: false; error: string };
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
  ensureMailsInboxSchema(db);

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
       text_body, html_body, received_at, raw_headers,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        text_body = excluded.text_body,
        html_body = excluded.html_body,
        received_at = excluded.received_at,
        raw_headers = excluded.raw_headers,
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
      mail.textBody ?? null,
      mail.htmlBody ?? null,
      mail.receivedAt ?? null,
      mail.rawHeaders ?? null,
      mail.createdAt,
      mail.updatedAt,
    );
  }

  const store: SqliteMailsStore = {
    db,
    dbPath: opts.coreDbPath,
    get defaultProviderId() {
      return defaultProviderId;
    },
    close() {
      db.close?.();
    },
    emailsReady() {
      return emailsReady(db);
    },
    listInbox(listOpts) {
      return listInboxEmails(db, listOpts);
    },
    getInbox(id) {
      return getInboxEmail(db, id);
    },
    getAttachment(emailId, attachmentId) {
      return getInboxAttachment(db, emailId, attachmentId);
    },
    markRead(id, read) {
      return markInboxEmailRead(db, id, read);
    },
    deleteMail(id) {
      return deleteInboxEmail(db, id);
    },
    insertInboundFull(input) {
      return insertInboundEmail(db, input);
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
      const attachments = (input.attachments || []) as InboundAttachmentInput[];
      let headers: Record<string, string> | null = null;
      if (input.rawHeaders) {
        try {
          headers = JSON.parse(input.rawHeaders) as Record<string, string>;
        } catch {
          headers = null;
        }
      }
      const result = insertInboundEmail(db, {
        message_id: input.messageId,
        from: input.from,
        to: input.to,
        subject: input.subject,
        text: input.textBody ?? input.body ?? null,
        html: input.htmlBody ?? null,
        received_at: input.receivedAt,
        headers,
        attachments,
        userId: input.userId,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      const row = db
        .prepare(`SELECT * FROM creezio_platform_mails WHERE id = ?`)
        .get(result.id) as Row;
      // Preserve brandEmailId if provided (migration)
      if (input.brandEmailId && row) {
        db.prepare(
          `UPDATE creezio_platform_mails SET brand_email_id = ?, updated_at = ? WHERE id = ?`,
        ).run(input.brandEmailId, now(), result.id);
        if (input.id && input.id !== result.id) {
          /* keep kit id */
        }
      }
      return fromRow(
        db
          .prepare(`SELECT * FROM creezio_platform_mails WHERE id = ?`)
          .get(result.id) as Row,
      );
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
