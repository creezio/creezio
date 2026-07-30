export type MailStatus = "draft" | "queued" | "sent" | "failed" | "inbound";

export type PlatformMailAttachmentMeta = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

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
  /** Inbound / inbox */
  from?: string;
  messageId?: string | null;
  folder?: string;
  readAt?: string | null;
  /** @deprecated secondary brand id — cutover kit SoT ; garder pour migration */
  brandEmailId?: string | null;
  textBody?: string | null;
  htmlBody?: string | null;
  receivedAt?: string | null;
  rawHeaders?: string | null;
};

export type MailProvider = {
  id: string;
  send(mail: PlatformMail): Promise<{ ok: boolean; error?: string }>;
};

export type InboundAttachmentInput = {
  filename?: string;
  content_type?: string;
  content_base64: string;
};

export type InboundEmailInput = {
  message_id?: string | null;
  from: string;
  to: string;
  subject?: string;
  text?: string | null;
  html?: string | null;
  received_at?: string | null;
  headers?: Record<string, string> | null;
  attachments?: InboundAttachmentInput[];
  userId?: string;
};

/** Shape API inbox (snake_case, compatible UI gold TF). */
export type InboxEmailListItem = {
  id: string;
  message_id: string | null;
  from_addr: string;
  to_addr: string;
  subject: string;
  received_at: string;
  read_at: string | null;
  folder: string;
  has_attachments: number;
  preview: string | null;
};

export type InboxEmailAttachmentMeta = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
};

export type InboxEmailDetail = InboxEmailListItem & {
  text_body: string | null;
  html_body: string | null;
  raw_headers: string | null;
  attachments: InboxEmailAttachmentMeta[];
};

export type PlatformMailsStore = {
  createDraft(input: {
    userId: string;
    to: string;
    subject: string;
    body?: string;
  }): PlatformMail;
  /** Index / insert inbound (PJ inclus dans le kit SoT). */
  insertInbound?(input: {
    id?: string;
    userId: string;
    from: string;
    to: string;
    subject: string;
    body?: string;
    messageId?: string | null;
    brandEmailId?: string | null;
    textBody?: string | null;
    htmlBody?: string | null;
    receivedAt?: string | null;
    rawHeaders?: string | null;
    attachments?: InboundAttachmentInput[];
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
  text_body TEXT,
  html_body TEXT,
  received_at TEXT,
  raw_headers TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_user
  ON creezio_platform_mails(user_id, status);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_message
  ON creezio_platform_mails(message_id);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_folder_received
  ON creezio_platform_mails(folder, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_read_at
  ON creezio_platform_mails(read_at);

CREATE TABLE IF NOT EXISTS creezio_platform_mail_attachments (
  id TEXT PRIMARY KEY,
  mail_id TEXT NOT NULL REFERENCES creezio_platform_mails(id) ON DELETE CASCADE,
  filename TEXT NOT NULL DEFAULT 'piece-jointe',
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  data BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mail_attachments_mail
  ON creezio_platform_mail_attachments(mail_id);
`;

export function ensureMailsInboundColumnsSql(): string[] {
  return [
    `ALTER TABLE creezio_platform_mails ADD COLUMN from_addr TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN message_id TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN folder TEXT NOT NULL DEFAULT 'outbox'`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN read_at TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN brand_email_id TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN text_body TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN html_body TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN received_at TEXT`,
    `ALTER TABLE creezio_platform_mails ADD COLUMN raw_headers TEXT`,
  ];
}
