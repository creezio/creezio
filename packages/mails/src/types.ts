export type MailStatus = "draft" | "queued" | "sent" | "failed";

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
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creezio_platform_mails_user
  ON creezio_platform_mails(user_id, status);
`;
