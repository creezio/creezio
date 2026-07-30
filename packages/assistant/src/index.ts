/**
 * @creezio/assistant — chat plateforme (store I2 + runtime/UI N3 + chat O4).
 *
 * Extension marque : configureAssistantBrand({ appMap, prompts, tools, auth, meili, … }).
 * Pas de métier panier/dispatch/relevés dans ce package.
 */

export type {
  AssistantConversation,
  AssistantMessage,
  AssistantRole,
  AssistantStore,
  CreateConversationInput,
  AppendMessageInput,
} from "./types.js";
export { ASSISTANT_IPC_SURFACE } from "./types.js";
export { ASSISTANT_CORE_SQL, ensureAssistantRichColumnsSql } from "./schema.js";
export { createMemoryAssistantStore } from "./memory-store.js";
export type {
  CreateSqliteAssistantStoreOptions,
  SqliteAssistantStore,
} from "./sqlite-store.js";
export { createSqliteAssistantStore } from "./sqlite-store.js";
export type { OpenSqliteDatabase, SqliteDatabase } from "./sqlite-driver.js";
export { openNodeSqliteDatabase } from "./sqlite-driver.js";
export {
  getKitAssistantStore,
  requireKitAssistantStore,
} from "./env-store.js";

/* ── Brand extension (N3) ── */
export type {
  AssistantAppMapConfig,
  AssistantAppPage,
  AssistantAuthSession,
  AssistantBrandConfig,
  AssistantBrandIdentity,
  AssistantBrandTools,
  AssistantDbAccess,
  AssistantHermesConfig,
  AssistantMeiliConfig,
  AssistantPromptsConfig,
  AssistantRagHit,
  AssistantToolDefinition,
  HermesWorkUser,
} from "./brand/types.js";
export {
  assistantAppMapPages,
  assistantBrandTools,
  assistantDb,
  assistantHermes,
  assistantIdentity,
  assistantMeili,
  assistantPrompts,
  assistantToolDefinitions,
  buildBrandHermesWorkBrief,
  buildBrandPersonalAgentBrief,
  configureAssistantBrand,
  getAssistantBrandConfig,
  requireAssistantBrand,
  requireAssistantDb,
} from "./brand/registry.js";
export {
  APP_MAP,
  appMapPromptSection,
  getAppMap,
  pageInfoFor,
  type AppPage,
} from "./brand/app-map-shim.js";
export {
  ASSISTANT_SYSTEM_PROMPT,
  DEFAULT_MAX_TOOL_ROUNDS,
  TOOL_DEFINITIONS,
  buildSystemPrompt,
  formatNowParis,
  getToolDefinitions,
  maxToolRounds,
  shouldAuditDistribution,
} from "./brand/prompts-shim.js";
export type {
  AssistantSource,
  AssistantSourceType,
} from "./brand/sources-shim.js";
export {
  collectSourcesFromSqlRows,
  sourceLinkMatchers,
} from "./brand/sources-shim.js";

/* ── Runtime (N3, TF gold) ── */
export {
  ASSISTANT_FAB_MARGIN_PX,
  ASSISTANT_FAB_SAFE_PX,
  ASSISTANT_FAB_SIZE_PX,
  assistantFabScreenRect,
  formatActiveSurfaceRuntimeBlock,
  fournisseurIdFromSurfaceHref,
  isSupplierSurfaceHref,
  looksLikeSurfaceCommand,
  parseActiveSurface,
  parseSupplierTabSummaries,
  rectsOverlap,
  resolveActiveSurface,
  type ActiveSurface,
  type ActiveSurfaceCrm,
  type ActiveSurfaceSupplier,
  type ActiveSurfaceTabLike,
  type ScreenRect,
  type SupplierTabSummary,
} from "./runtime/active-surface.js";
export {
  looksLikeUiCommand,
  shouldForceRunSql,
  shouldPreferSearchKnowledge,
} from "./runtime/routing.js";
export {
  extractVilleHint,
  normalizeVilleKey,
} from "./runtime/geo-hint.js";
export {
  ASSISTANT_MODES,
  CHAT_MODE_ADDENDUM,
  UI_TOOL_NAMES,
  buildHermesWorkSystemBrief,
  buildPersonalAgentWorkBrief,
  isAssistantMode,
  isUiToolName,
  parseAssistantMode,
  type AssistantMode,
} from "./runtime/modes.js";
export {
  defaultModel,
  modelLabel,
  modelOptions,
  modelOptionsDetailed,
  resolveModel,
  supportsTemperature,
  type ModelOption,
  type ModelTier,
} from "./runtime/models.js";
export {
  RAG_INDEXES,
  enrichHitsGeo,
  isKeywordOnlyIndex,
  productQueryForMeili,
  ragIndexes,
  searchKnowledge,
  villeMatches,
  type RagHit,
  type SearchKnowledgeResult,
} from "./runtime/meili-rag.js";
export * from "./runtime/agent-loop.js";
export * from "./runtime/anthropic-chat.js";
export * from "./runtime/chat-db.js";
export * from "./runtime/explore-tools.js";
export * from "./runtime/hermes-client.js";
export * from "./runtime/hermes-kanban.js";
export * from "./runtime/hermes-models.js";
export * from "./runtime/run-sql.js";
export * from "./runtime/schema-catalog.js";
export * from "./runtime/sql-process-guard.js";
export * from "./runtime/surface-router.js";
export * from "./runtime/tool-trace.js";
export * from "./runtime/ui-actions.js";
export * from "./runtime/whisper.js";
export {
  handleAssistantChat,
  maxDuration,
} from "./runtime/assistant-chat.js";
