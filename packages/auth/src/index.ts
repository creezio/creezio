/**
 * @creezio/auth — session native Creezio (Phase H1.3).
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
export {
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from "./password.js";
export type { AuthIpcBindings, IpcHandleFn } from "./ipc.js";
export { authLoginWithStore, bindAuthIpcHandlers } from "./ipc.js";
