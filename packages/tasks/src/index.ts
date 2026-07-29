/**
 * @creezio/tasks — tâches plateforme (Phase H1.6 / I3 sqlite).
 * Distinct de PluginTaskRecord (@creezio/product-hub).
 */

export type {
  PlatformTask,
  PlatformTaskStatus,
  PlatformTasksStore,
} from "./types.js";
export { PLATFORM_TASKS_CORE_SQL } from "./types.js";
export { createMemoryTasksStore } from "./memory-store.js";
export type {
  CreateSqliteTasksStoreOptions,
  SqliteTasksStore,
} from "./sqlite-store.js";
export { createSqliteTasksStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
export { createTasksApiMount } from "./api-mount.js";
