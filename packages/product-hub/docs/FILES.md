# @creezio/product-hub — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/product-hub/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/acl.ts`](../src/acl.ts) | 333 | `PLUGIN_ACL_LEVEL_ORG`, `PLUGIN_ACL_LEVEL_USER`, `PluginAclLevel`, `PluginAclAction`, `PluginAclCapability`, `PLUGIN_ACL_DEFAULT_CAPABILITIES`, `PluginAclActor`, `PluginAclCapabilityGrant` |
| [`src/admin/plugin-acl-admin.ts`](../src/admin/plugin-acl-admin.ts) | 117 | `PluginAclAdminStore`, `PluginAclAdminRow`, `UpsertPluginAclAdminInput`, `listPluginAclAdmin`, `getPluginAclAdmin`, `upsertPluginAclAdmin`, `clearPluginAclAdmin`, `previewPluginAclAccess` |
| [`src/brand-tokens.ts`](../src/brand-tokens.ts) | 83 | `ProductHubBrandTokens`, `productHubTokensFromManifest`, `grantProcessHint` |
| [`src/clarifications.ts`](../src/clarifications.ts) | 39 | `PluginClarificationQuestion`, `PluginClarificationStatus`, `PluginClarificationRound`, `assertClarificationQuestions` |
| [`src/control-plane/acl-from-store.ts`](../src/control-plane/acl-from-store.ts) | 81 | `PluginHubAclStoreSurface`, `CreatePluginControlPlaneAclFromStoreOptions`, `createPluginControlPlaneAclFromStore` |
| [`src/control-plane/acl-service-key.ts`](../src/control-plane/acl-service-key.ts) | 38 | `withBearerServiceKeyFallback` |
| [`src/control-plane/handler.ts`](../src/control-plane/handler.ts) | 384 | `createPluginControlPlaneHandler` |
| [`src/control-plane/http-utils.ts`](../src/control-plane/http-utils.ts) | 53 | `sendJson`, `readBody`, `authOk`, `normalizeHeaders` |
| [`src/control-plane/server.ts`](../src/control-plane/server.ts) | 60 | `startPluginControlPlane`, `createPluginControlPlaneHandler` |
| [`src/control-plane/types.ts`](../src/control-plane/types.ts) | 103 | `PluginControlPlaneAdapters`, `PluginControlPlaneAcl`, `PluginControlPlaneOptions`, `PluginControlPlaneState` |
| [`src/factory/draft-prd.ts`](../src/factory/draft-prd.ts) | 146 | `DraftPrdFromIntentionInput`, `draftPrdFromIntention`, `defaultClarificationQuestions`, `needsClarification` |
| [`src/factory/fs-adapters.ts`](../src/factory/fs-adapters.ts) | 77 | `createFsPluginScaffoldAdapters` |
| [`src/factory/index.ts`](../src/factory/index.ts) | 29 | `createConversationalPluginFactory`, `derivePluginIdentity`, `slugifyPluginId`, `defaultClarificationQuestions`, `draftPrdFromIntention`, `needsClarification`, `buildPluginScaffoldFiles`, `createFsPluginScaffoldAdapters` |
| [`src/factory/prd-drafter.ts`](../src/factory/prd-drafter.ts) | 164 | `PrdDrafter`, `LlmPrdDrafterOptions`, `deterministicPrdDrafter`, `createOptionalLlmPrdDrafter` |
| [`src/factory/scaffold-files.ts`](../src/factory/scaffold-files.ts) | 332 | `ScaffoldPluginFiles`, `buildPluginScaffoldFiles` |
| [`src/factory/session.ts`](../src/factory/session.ts) | 416 | `createConversationalPluginFactory` |
| [`src/factory/slug.ts`](../src/factory/slug.ts) | 98 | `slugifyPluginId`, `derivePluginIdentity` |
| [`src/factory/types.ts`](../src/factory/types.ts) | 132 | `FactoryPhase`, `FactorySessionSnapshot`, `FactoryMaterializeResult`, `FactoryScaffoldResult`, `FactoryWriteFilesResult`, `ConversationalPluginFactoryAdapters`, `ConversationalPluginFactory` |
| [`src/grants-flow.ts`](../src/grants-flow.ts) | 166 | `ProductHubPrdRevision`, `ProductHubProductDetails`, `IssueGrantResult`, `issueGrantFromProductDetails`, `extractExecutionGrantFromRequest`, `isGrantBypassEnabled`, `requirePluginExecutionGrant`, `grantProcessHint` |
| [`src/host-api.ts`](../src/host-api.ts) | 324 | `ProductHubHostDeps`, `ProductHubHost`, `createProductHubHost` |
| [`src/http/plugin-factory-routes.ts`](../src/http/plugin-factory-routes.ts) | 196 | `PluginFactoryRouteDeps`, `createPluginFactoryRoutes` |
| [`src/http/plugin-products-routes.ts`](../src/http/plugin-products-routes.ts) | 1067 | `PluginProductsSession`, `PluginProductsReadonlyDb`, `HermesCreateTaskInput`, `PluginProductsRouteDeps`, `createPluginProductsRoutes` |
| [`src/impact.ts`](../src/impact.ts) | 102 | `PluginImpactEvidence`, `PluginImpactReport`, `textOverlapScore`, `buildPluginImpactReport`, `collectPluginManifestEvidence` |
| [`src/index.ts`](../src/index.ts) | 277 | `PRODUCT_HUB_VERTICAL_REMAINING`, `grantProcessHint`, `productHubTokensFromManifest`, `PLUGIN_LIFECYCLE_STATES`, `PLUGIN_LIFECYCLE_TRANSITIONS`, `PLUGIN_TASK_STATUSES`, `assertPluginLifecycleTransition`, `canTransitionPluginLifecycle` |
| [`src/lifecycle.ts`](../src/lifecycle.ts) | 83 | `PLUGIN_LIFECYCLE_STATES`, `PluginLifecycleState`, `PLUGIN_TASK_STATUSES`, `PluginTaskStatus`, `PLUGIN_LIFECYCLE_TRANSITIONS`, `isPluginLifecycleState`, `canTransitionPluginLifecycle`, `assertPluginLifecycleTransition` |
| [`src/managed-marker.ts`](../src/managed-marker.ts) | 24 | `productHubManagedPath`, `isProductHubManaged`, `markProductHubManaged` |
| [`src/n8n-provisioning.ts`](../src/n8n-provisioning.ts) | 434 | `N8nTag`, `N8nWorkflow`, `N8nExecution`, `N8nConnectionStatus`, `PluginN8nSnapshot`, `N8nRequest`, `PluginN8nHubDb`, `PluginN8nProvisioningDeps` |
| [`src/n8n-tags.ts`](../src/n8n-tags.ts) | 50 | `N8N_TAG_MAX_LENGTH`, `N8nPluginIdentityMode`, `pluginN8nTag`, `isBrandPluginN8nTag` |
| [`src/plugin-ui/brand.ts`](../src/plugin-ui/brand.ts) | 65 | `ProductHubUiBrand`, `configureProductHubUiBrand`, `getProductHubUiBrand`, `resetProductHubUiBrandForTests`, `DesktopApiBridge`, `getDesktopApi`, `browserWindow` |
| [`src/plugin-ui/helpers.ts`](../src/plugin-ui/helpers.ts) | 144 | `PluginPanelOpenTarget`, `PluginPanelOpenFail`, `PluginStatusSnapshot`, `PluginSidebarItem`, `pluginSidebarItems`, `notifyPluginsChanged`, `resolvePluginPanelOpenTarget`, `isPluginPanelOpenTarget` |
| [`src/plugin-ui/index.ts`](../src/plugin-ui/index.ts) | 22 | `configureProductHubUiBrand`, `getProductHubUiBrand`, `resetProductHubUiBrandForTests`, `getDesktopApi`, `pluginSidebarItems`, `notifyPluginsChanged`, `resolvePluginPanelOpenTarget`, `isPluginPanelOpenTarget` |
| [`src/prd.ts`](../src/prd.ts) | 95 | `PluginPrdSections`, `PLUGIN_PRD_REQUIRED_SECTIONS`, `PluginPrdRevisionInput`, `parsePluginPrdSections`, `missingPrdSections`, `containsReplacementChar`, `missingPrdCoreFields` |
| [`src/schema-sql.ts`](../src/schema-sql.ts) | 237 | `PRODUCT_HUB_CORE_SQL`, `PRODUCT_HUB_ACL_USER_SQL`, `PRODUCT_HUB_ACL_ORG_SQL`, `PRODUCT_HUB_ACL_H5_SQL`, `PRODUCT_HUB_RUNTIME_SQL`, `PRODUCT_HUB_MANAGED_MARKER` |
| [`src/store/brand-bindings.ts`](../src/store/brand-bindings.ts) | 92 | `BrandProductHubBindings`, `CreateBrandProductHubBindingsOptions`, `createBrandProductHubBindings` |
| [`src/store/cached-accessor.ts`](../src/store/cached-accessor.ts) | 105 | `CachedSqliteProductHubAccessor`, `CreateCachedSqliteProductHubAccessorOptions`, `createCachedSqliteProductHubAccessor` |
| [`src/store/memory-store.ts`](../src/store/memory-store.ts) | 314 | `createMemoryProductHubStore`, `createProductRequest` |
| [`src/store/migrate-legacy.ts`](../src/store/migrate-legacy.ts) | 294 | `MigrateLegacyBrandProductHubOnceOptions`, `migrateLegacyBrandProductHubOnce` |
| [`src/store/sqlite-driver.ts`](../src/store/sqlite-driver.ts) | 51 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/store/sqlite-store.ts`](../src/store/sqlite-store.ts) | 708 | `SqliteProductHubStore`, `CreateSqliteProductHubStoreOptions`, `createSqliteProductHubStore`, `createSqliteProductRequest` |
| [`src/store/types.ts`](../src/store/types.ts) | 160 | `PluginProductRecord`, `PluginPrdRevisionRecord`, `PluginTaskRecord`, `PluginClarificationRecord`, `PluginImpactReportRecord`, `ProductHubStore` |
| [`ui/host-managed-notice.tsx`](../ui/host-managed-notice.tsx) | 28 | `HostManagedNotice` |
| [`ui/index.ts`](../ui/index.ts) | 13 | `AdminPluginsList`, `AdminPluginDetail`, `HostManagedNotice`, `configureTabWorkspaceHook`, `useTabWorkspaceOptional` |
| [`ui/plugin-detail.tsx`](../ui/plugin-detail.tsx) | 1186 | `AdminPluginDetail` |
| [`ui/plugins-list.tsx`](../ui/plugins-list.tsx) | 643 | `AdminPluginsList` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 38 | `BadgeProps`, `Badge` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/card.tsx`](../ui/primitives/card.tsx) | 45 | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| [`ui/primitives/cn.ts`](../ui/primitives/cn.ts) | 7 | `cn` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/tabs.tsx`](../ui/primitives/tabs.tsx) | 52 | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| [`ui/tab-workspace-shim.tsx`](../ui/tab-workspace-shim.tsx) | 27 | `TabWorkspaceShim`, `configureTabWorkspaceHook`, `useTabWorkspaceOptional` |

---

## Détail par fichier

### `src/acl.ts`

- **Lignes** : 333
- **Exports** : `PLUGIN_ACL_LEVEL_ORG`, `PLUGIN_ACL_LEVEL_USER`, `PluginAclLevel`, `PluginAclAction`, `PluginAclCapability`, `PLUGIN_ACL_DEFAULT_CAPABILITIES`, `PluginAclActor`, `PluginAclCapabilityGrant`, `PluginAclEntry`, `PluginAclPolicy`, `PluginAclDecision`, `actorIsPluginAdmin`, `subjectKey`, `isCrossOrgDenied`, `decidePluginAccess`, `canActorSeePlugin`, `canActorInstallPlugin`, `canActorExecutePlugin`, `filterVisiblePluginIds`, `aggregateAclRows`, `aclEntryToPolicy`, `PLUGIN_ACL_ORG_HEADER`, `PLUGIN_ACL_USER_HEADER`, `PLUGIN_ACL_OWNER_HEADER`, `resolvePluginAclActorFromHeaders`, `buildPluginAclActorHeaders`

ACL plugins — contrats L3 (org/tenant) et L4 (user) — H5 durci.
Port du modèle Certivan/TF2 `plugin_acl` (L4) + extension kit L3 (org).
FAIL-CLOSED : sans grant explicite, seul l'owner (ou clé service) voit.
H5 : capacités `see` / `install` / `execute` + deny cross-org.
Persistance SQL = vertical (apps) ; ce module reste pur.

### `src/admin/plugin-acl-admin.ts`

- **Lignes** : 117
- **Exports** : `PluginAclAdminStore`, `PluginAclAdminRow`, `UpsertPluginAclAdminInput`, `listPluginAclAdmin`, `getPluginAclAdmin`, `upsertPluginAclAdmin`, `clearPluginAclAdmin`, `previewPluginAclAccess`

Admin Plugins L3 — opérations CRUD binding + caps (Phase I5).
UI-agnostique : consommé par demobrand / console / marques.

### `src/brand-tokens.ts`

- **Lignes** : 83
- **Exports** : `ProductHubBrandTokens`, `productHubTokensFromManifest`, `grantProcessHint`

Jetons Product Hub dérivés de AppManifest — zéro hardcode TEMPOFLOW_/CERTIVAN_.

### `src/clarifications.ts`

- **Lignes** : 39
- **Exports** : `PluginClarificationQuestion`, `PluginClarificationStatus`, `PluginClarificationRound`, `assertClarificationQuestions`

Clarifications structurées — interview itérative Product Hub.

### `src/control-plane/acl-from-store.ts`

- **Lignes** : 81
- **Exports** : `PluginHubAclStoreSurface`, `CreatePluginControlPlaneAclFromStoreOptions`, `createPluginControlPlaneAclFromStore`

Helper I4 — construire `PluginControlPlaneAcl` depuis un store Product Hub
(sqlite ou mémoire enrichi). Chemin unique recommandé pour demobrand / marques.

### `src/control-plane/acl-service-key.ts`

- **Lignes** : 38
- **Exports** : `withBearerServiceKeyFallback`

Compat Hermes / E2E : Bearer sans headers actor → clé service.

### `src/control-plane/handler.ts`

- **Lignes** : 384
- **Exports** : `createPluginControlPlaneHandler`

Handler HTTP control plane plugins — patterns génériques TF2/Certivan.
Bind 127.0.0.1 recommandé. Auth Bearer + grants Product Hub.
H5 : ACL L3 see/install/execute + deny cross-org (si `opts.acl`).

### `src/control-plane/http-utils.ts`

- **Lignes** : 53
- **Exports** : `sendJson`, `readBody`, `authOk`, `normalizeHeaders`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/control-plane/server.ts`

- **Lignes** : 60
- **Exports** : `startPluginControlPlane`, `createPluginControlPlaneHandler`

Serveur HTTP loopback control plane — factory brand-agnostic.

### `src/control-plane/types.ts`

- **Lignes** : 103
- **Exports** : `PluginControlPlaneAdapters`, `PluginControlPlaneAcl`, `PluginControlPlaneOptions`, `PluginControlPlaneState`

Contrats control plane plugins HTTP (loopback) — brand-agnostic.

### `src/factory/draft-prd.ts`

- **Lignes** : 146
- **Exports** : `DraftPrdFromIntentionInput`, `draftPrdFromIntention`, `defaultClarificationQuestions`, `needsClarification`

Brouillon PRD déterministe depuis une intention (+ réponses clarifications).
Pas d'appel LLM — preuve kit / sandbox ; les marques peuvent remplacer.

### `src/factory/fs-adapters.ts`

- **Lignes** : 77
- **Exports** : `createFsPluginScaffoldAdapters`

Adapters FS génériques pour scaffold / writeFiles (control-plane compatible).

### `src/factory/index.ts`

- **Lignes** : 29
- **Exports** : `createConversationalPluginFactory`, `derivePluginIdentity`, `slugifyPluginId`, `defaultClarificationQuestions`, `draftPrdFromIntention`, `needsClarification`, `buildPluginScaffoldFiles`, `createFsPluginScaffoldAdapters`, `createOptionalLlmPrdDrafter`, `deterministicPrdDrafter`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/factory/prd-drafter.ts`

- **Lignes** : 164
- **Exports** : `PrdDrafter`, `LlmPrdDrafterOptions`, `deterministicPrdDrafter`, `createOptionalLlmPrdDrafter`

PrdDrafter pluggable (C3) — déterministe par défaut, LLM optionnel.
Sans clé / sans complete injecté → `draftPrdFromIntention` (zéro réseau).
Avec `CREEZIO_PRD_LLM_API_KEY` + URL (ou `complete` de test) → tente LLM,
fallback déterministe si échec / JSON invalide.

### `src/factory/scaffold-files.ts`

- **Lignes** : 332
- **Exports** : `ScaffoldPluginFiles`, `buildPluginScaffoldFiles`

Fichiers scaffold plugin réels générés depuis un PRD (C3 — plus de stub console.log-only).

### `src/factory/session.ts`

- **Lignes** : 416
- **Exports** : `createConversationalPluginFactory`

Orchestrateur fabrique plugins conversationnelle (V1).
Flux : intention → analyse (impact) → [clarification] → PRD → approve →
scaffold + openPlugin (adapter) → tools MCP space plugin (runtime marque).

### `src/factory/slug.ts`

- **Lignes** : 98
- **Exports** : `slugifyPluginId`, `derivePluginIdentity`

Dérive un plugin_id valide depuis une intention textuelle.

### `src/factory/types.ts`

- **Lignes** : 132
- **Exports** : `FactoryPhase`, `FactorySessionSnapshot`, `FactoryMaterializeResult`, `FactoryScaffoldResult`, `FactoryWriteFilesResult`, `ConversationalPluginFactoryAdapters`, `ConversationalPluginFactory`

Contrats fabrique plugins conversationnelle (vision V1).

### `src/grants-flow.ts`

- **Lignes** : 166
- **Exports** : `ProductHubPrdRevision`, `ProductHubProductDetails`, `IssueGrantResult`, `issueGrantFromProductDetails`, `extractExecutionGrantFromRequest`, `isGrantBypassEnabled`, `requirePluginExecutionGrant`, `grantProcessHint`

Flux execution_grant après validation PRD — logique brand-agnostic.

### `src/host-api.ts`

- **Lignes** : 324
- **Exports** : `ProductHubHostDeps`, `ProductHubHost`, `createProductHubHost`

API Product Hub côté app (Next / CRM) — logique hors façade marque.
La marque ne garde que le câblage store + env pluginsDir.

### `src/http/plugin-factory-routes.ts`

- **Lignes** : 196
- **Exports** : `PluginFactoryRouteDeps`, `createPluginFactoryRoutes`

Routes Hono fabrique conversationnelle — intention → PRD → scaffold.
Port demobrand `createPluginFactoryApiMount` → Hono pour marques TF/CV.
Montage typique :
  api.route("/plugin-factory", createPluginFactoryRoutes({ factory, getActor }))

### `src/http/plugin-products-routes.ts`

- **Lignes** : 1067
- **Exports** : `PluginProductsSession`, `PluginProductsReadonlyDb`, `HermesCreateTaskInput`, `PluginProductsRouteDeps`, `createPluginProductsRoutes`

Routes Hono Product Hub `/plugin-products` — SoT kit (gold TempoFlow).
Auth outer (session/API key) reste côté marque au montage.

### `src/impact.ts`

- **Lignes** : 102
- **Exports** : `PluginImpactEvidence`, `PluginImpactReport`, `textOverlapScore`, `buildPluginImpactReport`, `collectPluginManifestEvidence`

Rapport d'impact — logique pure (evidence injectée, pas de FS/DB hardcodés).

### `src/index.ts`

- **Lignes** : 277
- **Exports** : `PRODUCT_HUB_VERTICAL_REMAINING`, `grantProcessHint`, `productHubTokensFromManifest`, `PLUGIN_LIFECYCLE_STATES`, `PLUGIN_LIFECYCLE_TRANSITIONS`, `PLUGIN_TASK_STATUSES`, `assertPluginLifecycleTransition`, `canTransitionPluginLifecycle`, `isPluginLifecycleState`, `PLUGIN_PRD_REQUIRED_SECTIONS`, `containsReplacementChar`, `missingPrdCoreFields`, `missingPrdSections`, `parsePluginPrdSections`, `assertClarificationQuestions`, `buildPluginImpactReport`, `collectPluginManifestEvidence`, `textOverlapScore`, `N8N_TAG_MAX_LENGTH`, `isBrandPluginN8nTag`, `pluginN8nTag`, `createPluginN8nProvisioning`, `resolveN8nTagPrefix`, `createPluginProductsRoutes`, `createPluginFactoryRoutes`, `PLUGIN_ACL_DEFAULT_CAPABILITIES`, `PLUGIN_ACL_LEVEL_ORG`, `PLUGIN_ACL_LEVEL_USER`, `PLUGIN_ACL_ORG_HEADER`, `PLUGIN_ACL_OWNER_HEADER`, `PLUGIN_ACL_USER_HEADER`, `aclEntryToPolicy`, `actorIsPluginAdmin`, `aggregateAclRows`, `canActorExecutePlugin`, `canActorInstallPlugin`, `canActorSeePlugin`, `decidePluginAccess`, `filterVisiblePluginIds`, `isCrossOrgDenied`

@creezio/product-hub — Product Hub / plugins brand-agnostic (Phase E / P09).
Contrats purs + store + control plane + routes HTTP `/plugin-products`
+ n8n provisioning + fabrique conversationnelle.
UI Admin via `./ui` ; scaffolds git / test-runner restent verticaux.

### `src/lifecycle.ts`

- **Lignes** : 83
- **Exports** : `PLUGIN_LIFECYCLE_STATES`, `PluginLifecycleState`, `PLUGIN_TASK_STATUSES`, `PluginTaskStatus`, `PLUGIN_LIFECYCLE_TRANSITIONS`, `isPluginLifecycleState`, `canTransitionPluginLifecycle`, `assertPluginLifecycleTransition`

Machine d'état Product Hub — contrats purs (TF2/Certivan plugin-product-hub).

### `src/managed-marker.ts`

- **Lignes** : 24
- **Exports** : `productHubManagedPath`, `isProductHubManaged`, `markProductHubManaged`

Marqueur plugins gérés par Product Hub (migration douce).

### `src/n8n-provisioning.ts`

- **Lignes** : 434
- **Exports** : `N8nTag`, `N8nWorkflow`, `N8nExecution`, `N8nConnectionStatus`, `PluginN8nSnapshot`, `N8nRequest`, `PluginN8nHubDb`, `PluginN8nProvisioningDeps`, `PluginN8nProvisioning`, `createPluginN8nProvisioning`, `resolveN8nTagPrefix`, `PluginN8nPrepare`

Provisioning n8n plugins — SoT kit (tags + registre SQLite).
Config marque : préfixe tag, managedBy, modeLabel, credentials.

### `src/n8n-tags.ts`

- **Lignes** : 50
- **Exports** : `N8N_TAG_MAX_LENGTH`, `N8nPluginIdentityMode`, `pluginN8nTag`, `isBrandPluginN8nTag`

Tags n8n génériques — préfixe depuis AppManifest / ProductHubBrandTokens.
n8n 2.29 limite les tags à 24 caractères.

### `src/plugin-ui/brand.ts`

- **Lignes** : 65
- **Exports** : `ProductHubUiBrand`, `configureProductHubUiBrand`, `getProductHubUiBrand`, `resetProductHubUiBrandForTests`, `DesktopApiBridge`, `getDesktopApi`, `browserWindow`

Tokens marque pour admin plugins UI / desktop API (N6).

### `src/plugin-ui/helpers.ts`

- **Lignes** : 144
- **Exports** : `PluginPanelOpenTarget`, `PluginPanelOpenFail`, `PluginStatusSnapshot`, `PluginSidebarItem`, `pluginSidebarItems`, `notifyPluginsChanged`, `resolvePluginPanelOpenTarget`, `isPluginPanelOpenTarget`, `openPluginPanelInWorkspace`, `isRemoteDesktopClient`

Ouverture panel plugin / sidebar items (port TempoFlow — N6).

### `src/plugin-ui/index.ts`

- **Lignes** : 22
- **Exports** : `configureProductHubUiBrand`, `getProductHubUiBrand`, `resetProductHubUiBrandForTests`, `getDesktopApi`, `pluginSidebarItems`, `notifyPluginsChanged`, `resolvePluginPanelOpenTarget`, `isPluginPanelOpenTarget`, `openPluginPanelInWorkspace`, `isRemoteDesktopClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/prd.ts`

- **Lignes** : 95
- **Exports** : `PluginPrdSections`, `PLUGIN_PRD_REQUIRED_SECTIONS`, `PluginPrdRevisionInput`, `parsePluginPrdSections`, `missingPrdSections`, `containsReplacementChar`, `missingPrdCoreFields`

Contrats PRD étendu — sections structurées obligatoires.

### `src/schema-sql.ts`

- **Lignes** : 237
- **Exports** : `PRODUCT_HUB_CORE_SQL`, `PRODUCT_HUB_ACL_USER_SQL`, `PRODUCT_HUB_ACL_ORG_SQL`, `PRODUCT_HUB_ACL_H5_SQL`, `PRODUCT_HUB_RUNTIME_SQL`, `PRODUCT_HUB_MANAGED_MARKER`

DDL SQL Product Hub — à exécuter par les migrations verticales des apps.
Le kit n'embarque pas better-sqlite3 ; il expose le contrat SQL.

### `src/store/brand-bindings.ts`

- **Lignes** : 92
- **Exports** : `BrandProductHubBindings`, `CreateBrandProductHubBindingsOptions`, `createBrandProductHubBindings`

Bindings marque — singleton store core.db + ACL control-plane.

### `src/store/cached-accessor.ts`

- **Lignes** : 105
- **Exports** : `CachedSqliteProductHubAccessor`, `CreateCachedSqliteProductHubAccessorOptions`, `createCachedSqliteProductHubAccessor`

Accessor Next/CRM — singleton store core.db + migrate legacy one-shot.

### `src/store/memory-store.ts`

- **Lignes** : 314
- **Exports** : `createMemoryProductHubStore`, `createProductRequest`

Store Product Hub en mémoire — sandbox DemoBrand + tests kit.
Les apps prod utilisent SQLite (vertical) en implémentant ProductHubStore.

### `src/store/migrate-legacy.ts`

- **Lignes** : 294
- **Exports** : `MigrateLegacyBrandProductHubOnceOptions`, `migrateLegacyBrandProductHubOnce`

Migration one-shot brand.db → core.db (Product Hub).
Copie ids conservés ; pas de dual-write ensuite.

### `src/store/sqlite-driver.ts`

- **Lignes** : 51
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal pour Product Hub (H1.8).
Compatible better-sqlite3 et node:sqlite DatabaseSync.
Note : pas d'`import.meta` — le dual-build CJS (Electron) l'interdit.

### `src/store/sqlite-store.ts`

- **Lignes** : 708
- **Exports** : `SqliteProductHubStore`, `CreateSqliteProductHubStoreOptions`, `createSqliteProductHubStore`, `createSqliteProductRequest`

Store Product Hub persisté dans sqlite **core** (Phase H1.8).

### `src/store/types.ts`

- **Lignes** : 160
- **Exports** : `PluginProductRecord`, `PluginPrdRevisionRecord`, `PluginTaskRecord`, `PluginClarificationRecord`, `PluginImpactReportRecord`, `ProductHubStore`

Contrat store Product Hub — implémentations : mémoire (kit) / SQLite (apps).

### `ui/host-managed-notice.tsx`

- **Lignes** : 28
- **Exports** : `HostManagedNotice`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 13
- **Exports** : `AdminPluginsList`, `AdminPluginDetail`, `HostManagedNotice`, `configureTabWorkspaceHook`, `useTabWorkspaceOptional`

Admin Plugins UI (port TempoFlow — N6).
Consommer via `@creezio/product-hub/ui`.

### `ui/plugin-detail.tsx`

- **Lignes** : 1186
- **Exports** : `AdminPluginDetail`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/plugins-list.tsx`

- **Lignes** : 643
- **Exports** : `AdminPluginsList`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/badge.tsx`

- **Lignes** : 38
- **Exports** : `BadgeProps`, `Badge`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/button.tsx`

- **Lignes** : 45
- **Exports** : `ButtonProps`, `Button`, `buttonVariants`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/card.tsx`

- **Lignes** : 45
- **Exports** : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/cn.ts`

- **Lignes** : 7
- **Exports** : `cn`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/input.tsx`

- **Lignes** : 20
- **Exports** : `Input`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/tabs.tsx`

- **Lignes** : 52
- **Exports** : `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/tab-workspace-shim.tsx`

- **Lignes** : 27
- **Exports** : `TabWorkspaceShim`, `configureTabWorkspaceHook`, `useTabWorkspaceOptional`

_(pas de cartouche JSDoc en tête — voir le code)_

