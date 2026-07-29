/**
 * @creezio/observability — activité, usages plugins, control-plane (V2).
 */

export type {
  ActivityAction,
  ControlPlaneAction,
  ObservabilityEvent,
  ObservabilityEventKind,
  ObservabilityQuery,
  ObservabilityStore,
  OrgActivityAggregate,
  PluginUsageAggregate,
  RecordObservabilityEventInput,
} from "./types.js";
export { OBSERVABILITY_EVENT_KINDS } from "./types.js";

export { OBSERVABILITY_CORE_SQL } from "./schema.js";

export { createMemoryObservabilityStore } from "./memory-store.js";

export type {
  CreateSqliteObservabilityStoreOptions,
  SqliteObservabilityStore,
} from "./sqlite-store.js";
export { createSqliteObservabilityStore } from "./sqlite-store.js";

export type { OpenSqliteDatabase, SqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";

export type { EmitActor } from "./helpers.js";
export {
  recordActivity,
  recordControlPlaneEvent,
  recordPluginUsage,
} from "./helpers.js";

export { createObservabilityApiMount } from "./api-mount.js";
