/**
 * @creezio/product-hub — Product Hub / plugins brand-agnostic (Phase E).
 *
 * Contrats purs + store mémoire + control plane HTTP.
 * Persistance SQLite / UI Admin / scaffolds git restent verticaux (Phase G).
 */

export type { ProductHubBrandTokens } from "./brand-tokens.js";
export {
  grantProcessHint,
  productHubTokensFromManifest,
} from "./brand-tokens.js";

export type { PluginLifecycleState, PluginTaskStatus } from "./lifecycle.js";
export {
  PLUGIN_LIFECYCLE_STATES,
  PLUGIN_LIFECYCLE_TRANSITIONS,
  PLUGIN_TASK_STATUSES,
  assertPluginLifecycleTransition,
  canTransitionPluginLifecycle,
  isPluginLifecycleState,
} from "./lifecycle.js";

export type { PluginPrdRevisionInput, PluginPrdSections } from "./prd.js";
export {
  PLUGIN_PRD_REQUIRED_SECTIONS,
  containsReplacementChar,
  missingPrdCoreFields,
  missingPrdSections,
  parsePluginPrdSections,
} from "./prd.js";

export type {
  PluginClarificationQuestion,
  PluginClarificationRound,
  PluginClarificationStatus,
} from "./clarifications.js";
export { assertClarificationQuestions } from "./clarifications.js";

export type { PluginImpactEvidence, PluginImpactReport } from "./impact.js";
export {
  buildPluginImpactReport,
  collectPluginManifestEvidence,
  textOverlapScore,
} from "./impact.js";

export type { N8nPluginIdentityMode } from "./n8n-tags.js";
export {
  N8N_TAG_MAX_LENGTH,
  isBrandPluginN8nTag,
  pluginN8nTag,
} from "./n8n-tags.js";

export type {
  PluginAclAction,
  PluginAclActor,
  PluginAclCapability,
  PluginAclCapabilityGrant,
  PluginAclDecision,
  PluginAclEntry,
  PluginAclLevel,
  PluginAclPolicy,
} from "./acl.js";
export {
  PLUGIN_ACL_DEFAULT_CAPABILITIES,
  PLUGIN_ACL_LEVEL_ORG,
  PLUGIN_ACL_LEVEL_USER,
  PLUGIN_ACL_ORG_HEADER,
  PLUGIN_ACL_OWNER_HEADER,
  PLUGIN_ACL_USER_HEADER,
  aclEntryToPolicy,
  actorIsPluginAdmin,
  aggregateAclRows,
  canActorExecutePlugin,
  canActorInstallPlugin,
  canActorSeePlugin,
  decidePluginAccess,
  filterVisiblePluginIds,
  isCrossOrgDenied,
  buildPluginAclActorHeaders,
  resolvePluginAclActorFromHeaders,
  subjectKey,
} from "./acl.js";

export type {
  IssueGrantResult,
  ProductHubPrdRevision,
  ProductHubProductDetails,
} from "./grants-flow.js";
export {
  extractExecutionGrantFromRequest,
  issueGrantFromProductDetails,
  isGrantBypassEnabled,
  requirePluginExecutionGrant,
} from "./grants-flow.js";

export {
  PRODUCT_HUB_ACL_H5_SQL,
  PRODUCT_HUB_ACL_ORG_SQL,
  PRODUCT_HUB_ACL_USER_SQL,
  PRODUCT_HUB_CORE_SQL,
  PRODUCT_HUB_MANAGED_MARKER,
} from "./schema-sql.js";

export {
  isProductHubManaged,
  markProductHubManaged,
  productHubManagedPath,
} from "./managed-marker.js";

export type {
  PluginClarificationRecord,
  PluginImpactReportRecord,
  PluginPrdRevisionRecord,
  PluginProductRecord,
  PluginTaskRecord,
  ProductHubStore,
} from "./store/types.js";

export {
  createMemoryProductHubStore,
  createProductRequest,
} from "./store/memory-store.js";

export type {
  CreateSqliteProductHubStoreOptions,
  SqliteProductHubStore,
} from "./store/sqlite-store.js";
export {
  createSqliteProductHubStore,
  createSqliteProductRequest,
} from "./store/sqlite-store.js";
export type {
  OpenSqliteDatabase,
  SqliteDatabase,
  SqliteStatement,
} from "./store/sqlite-driver.js";
export { openNodeSqliteDatabase } from "./store/sqlite-driver.js";

export type {
  PluginControlPlaneAcl,
  PluginControlPlaneAdapters,
  PluginControlPlaneOptions,
  PluginControlPlaneState,
} from "./control-plane/types.js";
export {
  createPluginControlPlaneHandler,
  startPluginControlPlane,
} from "./control-plane/server.js";
export type {
  CreatePluginControlPlaneAclFromStoreOptions,
  PluginHubAclStoreSurface,
} from "./control-plane/acl-from-store.js";
export { createPluginControlPlaneAclFromStore } from "./control-plane/acl-from-store.js";

export type {
  PluginAclAdminRow,
  PluginAclAdminStore,
  UpsertPluginAclAdminInput,
} from "./admin/plugin-acl-admin.js";
export {
  clearPluginAclAdmin,
  getPluginAclAdmin,
  listPluginAclAdmin,
  previewPluginAclAccess,
  upsertPluginAclAdmin,
} from "./admin/plugin-acl-admin.js";

/** V1 / C3 — fabrique plugins conversationnelle. */
export type {
  ConversationalPluginFactory,
  ConversationalPluginFactoryAdapters,
  DraftPrdFromIntentionInput,
  FactoryMaterializeResult,
  FactoryPhase,
  FactoryScaffoldResult,
  FactorySessionSnapshot,
  FactoryWriteFilesResult,
  LlmPrdDrafterOptions,
  PrdDrafter,
} from "./factory/index.js";
export {
  buildPluginScaffoldFiles,
  createConversationalPluginFactory,
  createFsPluginScaffoldAdapters,
  createOptionalLlmPrdDrafter,
  defaultClarificationQuestions,
  derivePluginIdentity,
  deterministicPrdDrafter,
  draftPrdFromIntention,
  needsClarification,
  slugifyPluginId,
} from "./factory/index.js";

/** Modules encore verticaux (apps marques) après Phase E / H1.8. */
export const PRODUCT_HUB_VERTICAL_REMAINING = [
  "plugin-git",
  "plugin-data",
  "plugin-accept-check",
  "plugin-test-runner",
  "plugin-crm-key",
  "admin-ui-plugins",
] as const;
