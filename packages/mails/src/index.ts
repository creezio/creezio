/**
 * @creezio/mails — mails plateforme (Phase H1.7).
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
export { createMailsApiMount } from "./api-mount.js";
