/**
 * Store mails plateforme — sqlite **core** (Phase I3).
 */

import crypto from "node:crypto";
import {
  PLATFORM_MAILS_CORE_SQL,
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
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
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
      (id, user_id, to_addr, subject, body, status, provider_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        to_addr = excluded.to_addr,
        subject = excluded.subject,
        body = excluded.body,
        status = excluded.status,
        provider_id = excluded.provider_id,
        updated_at = excluded.updated_at`,
    ).run(
      mail.id,
      mail.userId,
      mail.to,
      mail.subject,
      mail.body,
      mail.status,
      mail.providerId,
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
