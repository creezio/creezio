/**
 * @creezio/tasks — tâches plateforme (Phase H1.6).
 * Distinct de PluginTaskRecord (@creezio/product-hub).
 */

export type {
  PlatformTask,
  PlatformTaskStatus,
  PlatformTasksStore,
} from "./types.js";
export { PLATFORM_TASKS_CORE_SQL } from "./types.js";
export { createMemoryTasksStore } from "./memory-store.js";
export { createTasksApiMount } from "./api-mount.js";
