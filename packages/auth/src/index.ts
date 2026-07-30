/**
 * @creezio/auth — session native Creezio (Phase H1.3 / I1 sqlite).
 * Backlog note : package nommé `@creezio/auth` (pas auth-session).
 */

export { AUTH_CORE_SQL } from "./schema.js";
export type {
  AuthAccountPublic,
  AuthLoginInput,
  AuthRegisterInput,
  AuthSession,
  AuthStore,
  AuthUser,
} from "./types.js";
export { createMemoryAuthStore } from "./memory-store.js";
export type {
  CreateSqliteAuthStoreOptions,
  SqliteAuthStore,
} from "./sqlite-store.js";
export { createSqliteAuthStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase, SqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
export {
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from "./password.js";
export type { AuthIpcBindings, IpcHandleFn } from "./ipc.js";
export { authLoginWithStore, bindAuthIpcHandlers } from "./ipc.js";
export type { KitAuthResult } from "./env-store.js";
export {
  authenticateViaKit,
  countKitAuthUsers,
  getKitAuthStore,
  migrateBrandCredentialsToKit,
} from "./env-store.js";
