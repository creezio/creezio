export type MailStatus = "draft" | "queued" | "sent" | "failed" | "inbound";

export type PlatformMail = {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  status: MailStatus;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
  /** C1 — inbound */
  from?: string;
  messageId?: string | null;
  folder?: string;
  readAt?: string | null;
  brandEmailId?: string | null;
};

export type MailProvider = {
  id: string;
  send(mail: PlatformMail): Promise<{ ok: boolean; error?: string }>;
};

export type PlatformMailsStore = {
  createDraft(input: {
    userId: string;
    to: string;
    subject: string;
    body?: string;
  }): PlatformMail;
  /** C1 — index inbound (PJ restent brand) ; id stable. */
  insertInbound?(input: {
    id?: string;
    userId: string;
    from: string;
    to: string;
    subject: string;
    body?: string;
    messageId?: string | null;
    brandEmailId?: string | null;
  }): PlatformMail;
  list(userId: string): PlatformMail[];
  get(id: string): PlatformMail | undefined;
  queueSend(id: string, actorUserId: string): Promise<PlatformMail>;
  registerProvider(provider: MailProvider): void;
};

export const PLATFORM_MAILS_CORE_SQL = `
CREATE TABLE IF NOT EXISTS creezio_platform_mails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  provider_id TEXT,
  from_addr TEXT NOT NULL DEFAULT '',
  message_id TEXT,
  folder TEXT NOT NULL DEFAULT 'outbox',
  read_at TEXT,
  brand_email_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_user
  ON creezio_platform_mails(user_id, status);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_message
  ON creezio_platform_mails(message_id);
`;

export function ensureMailsInboundColumnsSql(): string[] {
  return [
    `ALTER TABLE creezio_platform_mails ADD COLUMN from_addr TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN message_id TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN folder TEXT NOT NULL DEFAULT 'outbox'`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN read_at TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN brand_email_id TEXT`,
  ];
}
