/**
 * @creezio/mails — mails plateforme (Phase H1.7 / I3 sqlite + providers).
 * Pas de templates TempoFlow/Fidu.
 */

export type {
  MailProvider,
  MailStatus,
  PlatformMail,
  PlatformMailsStore,
} from "./types.js";
export { PLATFORM_MAILS_CORE_SQL } from "./types.js";
export { createMemoryMailsStore } from "./memory-store.js";
export type {
  CreateSqliteMailsStoreOptions,
  SqliteMailsStore,
} from "./sqlite-store.js";
export { createSqliteMailsStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
export {
  FILE_SINK_PROVIDER_ID,
  createFileSinkMailProvider,
} from "./providers/file-sink.js";
export type { CreateFileSinkMailProviderOptions } from "./providers/file-sink.js";
export { createMailsApiMount } from "./api-mount.js";
