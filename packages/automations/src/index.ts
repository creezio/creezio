/**
 * @creezio/automations — triggers lifecycle / données + actions (V3).
 */

export type {
  AutomationAction,
  AutomationActionType,
  AutomationEngineAdapters,
  AutomationRule,
  AutomationRunResult,
  AutomationTriggerEvent,
  AutomationTriggerType,
} from "./types.js";
export {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_TRIGGER_TYPES,
} from "./types.js";

export type { AutomationEngine } from "./engine.js";
export {
  createAutomationEngine,
  defaultDemobrandAutomationRules,
} from "./engine.js";

export { ruleMatches } from "./match.js";
export { createAutomationsApiMount } from "./api-mount.js";
export { AUTOMATIONS_CORE_SQL } from "./schema.js";
export type {
  AutomationPersistStore,
  CreateSqliteAutomationPersistOptions,
} from "./sqlite-persist.js";
export { createSqliteAutomationPersist } from "./sqlite-persist.js";
