/**
 * @creezio/mails — mails plateforme (SoT inbox + providers + UI).
 * Pas de templates TempoFlow/Fidu.
 */

export type {
  InboxEmailAttachmentMeta,
  InboxEmailDetail,
  InboxEmailListItem,
  InboundAttachmentInput,
  InboundEmailInput,
  MailProvider,
  MailStatus,
  PlatformMail,
  PlatformMailAttachmentMeta,
  PlatformMailsStore,
} from "./types.js";
export {
  PLATFORM_MAILS_CORE_SQL,
  ensureMailsInboundColumnsSql,
} from "./types.js";

export type { MailsConfig } from "./config.js";
export {
  configureMails,
  getMailsConfig,
  resetMailsConfigForTests,
  resolveEmailDomain,
  resolveEmptyStateNoDomainHint,
  resolveInboundSecret,
  resolvePageSubtitle,
} from "./config.js";

export { createMemoryMailsStore } from "./memory-store.js";
export type {
  CreateSqliteMailsStoreOptions,
  SqliteMailsStore,
} from "./sqlite-store.js";
export { createSqliteMailsStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase, SqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
export {
  FILE_SINK_PROVIDER_ID,
  createFileSinkMailProvider,
} from "./providers/file-sink.js";
export type { CreateFileSinkMailProviderOptions } from "./providers/file-sink.js";
export { createMailsApiMount } from "./api-mount.js";
export { indexKitInboundMail } from "./env-bridge.js";
export { getKitMailsStore, resetKitMailsStoreForTests } from "./env-store.js";

export {
  ensureMailsInboxSchema,
  emailsReady,
  listInboxEmails,
  getInboxEmail,
  getInboxAttachment,
  markInboxEmailRead,
  deleteInboxEmail,
  insertInboundEmail,
} from "./inbox-queries.js";

export type { EmailInboxRouteDeps } from "./email-routes.js";
export { createEmailInboxRoutes } from "./email-routes.js";

export type { MigrateBrandEmailsResult } from "./migrate-brand-emails.js";
export { migrateBrandEmailsToKit } from "./migrate-brand-emails.js";
