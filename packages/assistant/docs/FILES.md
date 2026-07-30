# @creezio/assistant — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/assistant/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/brand/app-map-shim.ts`](../src/brand/app-map-shim.ts) | 61 | `AppPage`, `APP_MAP`, `getAppMap`, `appMapPromptSection`, `pageInfoFor` |
| [`src/brand/db-shim.ts`](../src/brand/db-shim.ts) | 48 | `Row`, `queryAll`, `queryOne`, `getDbPath`, `tableExists`, `getDb`, `getWriteDb` |
| [`src/brand/desktop-presence-shim.ts`](../src/brand/desktop-presence-shim.ts) | 19 | `isDesktopOnline`, `desktopOfflineError` |
| [`src/brand/entity-projections.ts`](../src/brand/entity-projections.ts) | 144 | `EntitySourceKindRule`, `createEntitySourcesFromRules`, `createFormatSearchHit` |
| [`src/brand/ops-track-shim.ts`](../src/brand/ops-track-shim.ts) | 32 | `ServerOpsEvent`, `trackServer`, `trackServerDebounced` |
| [`src/brand/prompts-shim.ts`](../src/brand/prompts-shim.ts) | 166 | `DEFAULT_MAX_TOOL_ROUNDS`, `maxToolRounds`, `formatNowParis`, `BuildSystemPromptOptions`, `buildSystemPrompt`, `ASSISTANT_SYSTEM_PROMPT`, `getToolDefinitions`, `TOOL_DEFINITIONS` |
| [`src/brand/registry.ts`](../src/brand/registry.ts) | 120 | `configureAssistantBrand`, `getAssistantBrandConfig`, `requireAssistantBrand`, `assistantIdentity`, `assistantAppMapPages`, `assistantPrompts`, `assistantBrandTools`, `assistantMcp` |
| [`src/brand/sources-shim.ts`](../src/brand/sources-shim.ts) | 56 | `AssistantSourceType`, `AssistantSource`, `collectSourcesFromSqlRows`, `sourceLinkMatchers` |
| [`src/brand/types.ts`](../src/brand/types.ts) | 283 | `AssistantAppPage`, `AssistantToolDefinition`, `HermesWorkUser`, `AssistantAppMapConfig`, `AssistantPromptsConfig`, `AssistantMcpToolDef`, `AssistantMcpCallResult`, `AssistantMcpConfig` |
| [`src/env-store.ts`](../src/env-store.ts) | 45 | `getKitAssistantStore`, `requireKitAssistantStore` |
| [`src/http/assistant-routes.ts`](../src/http/assistant-routes.ts) | 735 | `AssistantSession`, `AssistantDesktopPresence`, `AssistantPluginProduct`, `AssistantPluginProductHub`, `AssistantRoutesFeatures`, `AssistantRoutesDeps`, `createAssistantRoutes` |
| [`src/index.ts`](../src/index.ts) | 213 | `ASSISTANT_IPC_SURFACE`, `ASSISTANT_CORE_SQL`, `ensureAssistantRichColumnsSql`, `createMemoryAssistantStore`, `createSqliteAssistantStore`, `openNodeSqliteDatabase`, `getKitAssistantStore`, `requireKitAssistantStore` |
| [`src/memory-store.ts`](../src/memory-store.ts) | 64 | `createMemoryAssistantStore` |
| [`src/runtime/active-surface.ts`](../src/runtime/active-surface.ts) | 324 | `ASSISTANT_FAB_SAFE_PX`, `ASSISTANT_FAB_SIZE_PX`, `ASSISTANT_FAB_MARGIN_PX`, `ScreenRect`, `assistantFabScreenRect`, `rectsOverlap`, `ActiveSurfaceCrm`, `ActiveSurfaceExternal` |
| [`src/runtime/agent-loop.ts`](../src/runtime/agent-loop.ts) | 299 | `AgentToolDefinition`, `AgentTool`, `AgentContentPart`, `AgentMessage`, `AgentStepEvent`, `AgentModelCaller`, `callOpenAiModel`, `AgentLoopOptions` |
| [`src/runtime/anthropic-chat.ts`](../src/runtime/anthropic-chat.ts) | 180 | `AnthropicMessage`, `AnthropicContentBlock`, `AnthropicToolUse`, `anthropicKey`, `anthropicModel`, `anthropicTools`, `callAnthropic`, `toAnthropicUserHistory` |
| [`src/runtime/assistant-chat.ts`](../src/runtime/assistant-chat.ts) | 1945 | `maxDuration`, `handleAssistantChat` |
| [`src/runtime/chat-db.ts`](../src/runtime/chat-db.ts) | 685 | `ConversationRow`, `MessageRow`, `Source`, `getAssistantDbPath`, `getAssistantDb`, `titleFromMessage`, `listConversations`, `getConversation` |
| [`src/runtime/explore-tools.ts`](../src/runtime/explore-tools.ts) | 543 | `TableListItem`, `listTables`, `ColumnInfo`, `DistinctSample`, `ForeignKeyInfo`, `LinkColumnSample`, `describeTable`, `listDistinctValues` |
| [`src/runtime/geo-hint.ts`](../src/runtime/geo-hint.ts) | 57 | `normalizeVilleKey`, `extractVilleHint` |
| [`src/runtime/hermes-client.ts`](../src/runtime/hermes-client.ts) | 336 | `HermesChatMessage`, `HermesCompletionResult`, `hermesConfigured`, `HermesEndpoint`, `wakeHermes`, `hermesChatCompletion`, `hermesChatCompletionStream` |
| [`src/runtime/hermes-kanban.ts`](../src/runtime/hermes-kanban.ts) | 347 | `HermesKanbanStatus`, `HermesKanbanTask`, `hermesKanbanConfigured`, `hermesKanbanCreateTask`, `HermesKanbanTaskDetail`, `hermesKanbanGetTask`, `hermesKanbanPatchTask`, `hermesKanbanListTasks` |
| [`src/runtime/hermes-models.ts`](../src/runtime/hermes-models.ts) | 582 | `HERMES_PREFERRED_MODEL`, `HermesModelOption`, `HermesReasoningStatus`, `HERMES_REASONING_EFFORTS`, `hermesModelsConfigured`, `encodeHermesModelId`, `parseHermesModelId`, `bareHermesModelName` |
| [`src/runtime/mcp-tools.ts`](../src/runtime/mcp-tools.ts) | 201 | `mcpToolDefToAssistant`, `refreshMcpToolCache`, `cachedMcpToolDefinitions`, `cachedMcpToolNames`, `ensureMcpToolCache`, `looksLikeMcpToolName`, `mcpOwnsToolName`, `callAssistantMcpTool` |
| [`src/runtime/meili-rag.ts`](../src/runtime/meili-rag.ts) | 282 | `RagHit`, `SearchKnowledgeResult`, `ragIndexes`, `RAG_INDEXES`, `enrichHitsGeo`, `villeMatches`, `productQueryForMeili`, `searchKnowledge` |
| [`src/runtime/models.ts`](../src/runtime/models.ts) | 132 | `ModelTier`, `ModelOption`, `modelLabel`, `defaultModel`, `modelOptions`, `modelOptionsDetailed`, `resolveModel`, `supportsTemperature` |
| [`src/runtime/modes.ts`](../src/runtime/modes.ts) | 80 | `ASSISTANT_MODES`, `AssistantMode`, `isAssistantMode`, `parseAssistantMode`, `UI_TOOL_NAMES`, `isUiToolName`, `CHAT_MODE_ADDENDUM`, `buildPersonalAgentWorkBrief` |
| [`src/runtime/platform-tool-definitions.ts`](../src/runtime/platform-tool-definitions.ts) | 629 | `PLATFORM_TOOL_DEFINITIONS`, `PLATFORM_TASK_TOOL_DEFINITIONS`, `PLATFORM_TASK_TOOL_ALIASES` |
| [`src/runtime/routing.ts`](../src/runtime/routing.ts) | 60 | `looksLikeUiCommand`, `shouldPreferSearchKnowledge`, `shouldForceRunSql`, `looksLikeSurfaceCommand` |
| [`src/runtime/run-sql.ts`](../src/runtime/run-sql.ts) | 307 | `RunSqlResult`, `runSql`, `collectSourcesFromSqlRows`, `sourceLinkMatchers` |
| [`src/runtime/schema-catalog.ts`](../src/runtime/schema-catalog.ts) | 70 | `getSchemaCatalogPath`, `loadSchemaCatalog`, `clearSchemaCatalogCache` |
| [`src/runtime/sql-process-guard.ts`](../src/runtime/sql-process-guard.ts) | 306 | `TextEqualityFilter`, `DistinctHint`, `ProcessHint`, `extractSqlTables`, `extractTextEqualityFilters`, `isEmptySqlResult`, `extractLikeNeedles`, `enrichEmptySqlWithDistinctHints` |
| [`src/runtime/surface-router.ts`](../src/runtime/surface-router.ts) | 121 | `SurfaceRoute`, `routeSurfaceTool`, `contentRectWithAssistantSafeArea` |
| [`src/runtime/tasks-tools.ts`](../src/runtime/tasks-tools.ts) | 71 | `taskToolDefinitions`, `executeTaskTool` |
| [`src/runtime/tool-trace.ts`](../src/runtime/tool-trace.ts) | 477 | `TraceRunStatus`, `TraceRunRow`, `TraceToolCallRow`, `TraceLlmRoundRow`, `ensureToolTraceTables`, `startAssistantRun`, `finishAssistantRun`, `logLlmRound` |
| [`src/runtime/ui-actions.ts`](../src/runtime/ui-actions.ts) | 303 | `UiActionType`, `ExternalSiteActionType`, `SupplierActionType`, `UiActionRequest`, `SupplierSubscriberMeta`, `EmitFn`, `dispatchUiAction`, `subscribeSupplierActions` |
| [`src/runtime/whisper.ts`](../src/runtime/whisper.ts) | 79 | `whisperModel`, `transcribeAudio` |
| [`src/schema.ts`](../src/schema.ts) | 47 | `ASSISTANT_CORE_SQL`, `ensureAssistantRichColumnsSql` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 42 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | 238 | `SqliteAssistantStore`, `CreateSqliteAssistantStoreOptions`, `createSqliteAssistantStore` |
| [`src/types.ts`](../src/types.ts) | 60 | `AssistantRole`, `AssistantMessage`, `AssistantConversation`, `CreateConversationInput`, `AppendMessageInput`, `AssistantStore`, `ASSISTANT_IPC_SURFACE` |
| [`ui/assistant-message-content.tsx`](../ui/assistant-message-content.tsx) | 208 | `AssistantMessageContent` |
| [`ui/assistant-provider.tsx`](../ui/assistant-provider.tsx) | 141 | `ASSISTANT_PANEL_WIDTH_PX`, `AssistantProvider`, `useAssistantUi`, `useAssistantUiOptional`, `ASSISTANT_FAB_SAFE_PX` |
| [`ui/assistant-root.tsx`](../ui/assistant-root.tsx) | 14 | `AssistantRoot` |
| [`ui/assistant-tool-steps.tsx`](../ui/assistant-tool-steps.tsx) | 135 | `AssistantToolStep`, `AssistantToolSteps` |
| [`ui/assistant-trace-panel.tsx`](../ui/assistant-trace-panel.tsx) | 384 | `AssistantTracePanel` |
| [`ui/assistant-widget.tsx`](../ui/assistant-widget.tsx) | 2144 | `AssistantWidget` |
| [`ui/entity-links.ts`](../ui/entity-links.ts) | 4 | `entityLinkClass` |
| [`ui/fake-cursor.ts`](../ui/fake-cursor.ts) | 172 | `getFakeCursor` |
| [`ui/index.ts`](../ui/index.ts) | 23 | `AssistantProvider`, `ASSISTANT_PANEL_WIDTH_PX`, `ASSISTANT_FAB_SAFE_PX`, `useAssistantUi`, `useAssistantUiOptional`, `AssistantRoot`, `AssistantWidget`, `AssistantMessageContent` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 37 | `BadgeProps`, `Badge` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/cn.ts`](../ui/primitives/cn.ts) | 7 | `cn` |
| [`ui/primitives/dropdown-menu.tsx`](../ui/primitives/dropdown-menu.tsx) | 188 | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/scroll-area.tsx`](../ui/primitives/scroll-area.tsx) | 42 | `ScrollArea`, `ScrollBar` |
| [`ui/primitives/select.tsx`](../ui/primitives/select.tsx) | 74 | `Select`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem` |
| [`ui/tab-workspace-shim.ts`](../ui/tab-workspace-shim.ts) | 18 | `AssistantTabWorkspace`, `useTabWorkspaceOptional` |
| [`ui/ui-driver.tsx`](../ui/ui-driver.tsx) | 553 | `UI_ACTION_EVENT`, `runUiAction`, `runUiNavigate`, `UiDriver` |
| [`ui/use-voice-input.ts`](../ui/use-voice-input.ts) | 211 | `VoiceInputState`, `useVoiceInput` |

---

## Détail par fichier

### `src/brand/app-map-shim.ts`

- **Lignes** : 61
- **Exports** : `AppPage`, `APP_MAP`, `getAppMap`, `appMapPromptSection`, `pageInfoFor`

AppMap générique — pages injectées via configureAssistantBrand({ appMap }).
Aucune page panier/dispatch/catalogue TF en dur.

### `src/brand/db-shim.ts`

- **Lignes** : 48
- **Exports** : `Row`, `queryAll`, `queryOne`, `getDbPath`, `tableExists`, `getDb`, `getWriteDb`

Shim DB — délègue à configureAssistantBrand({ db }).

### `src/brand/desktop-presence-shim.ts`

- **Lignes** : 19
- **Exports** : `isDesktopOnline`, `desktopOfflineError`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/brand/entity-projections.ts`

- **Lignes** : 144
- **Exports** : `EntitySourceKindRule`, `createEntitySourcesFromRules`, `createFormatSearchHit`

O4r4 — projections entitySources / formatSearchHit déclaratives.
Extraite des switches marque (TF/CV/Fidu) : pas d’invention métier,
seulement un moteur kit + règles déclarées par la marque.

### `src/brand/ops-track-shim.ts`

- **Lignes** : 32
- **Exports** : `ServerOpsEvent`, `trackServer`, `trackServerDebounced`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/brand/prompts-shim.ts`

- **Lignes** : 166
- **Exports** : `DEFAULT_MAX_TOOL_ROUNDS`, `maxToolRounds`, `formatNowParis`, `BuildSystemPromptOptions`, `buildSystemPrompt`, `ASSISTANT_SYSTEM_PROMPT`, `getToolDefinitions`, `TOOL_DEFINITIONS`, `shouldAuditDistribution`, `looksLikeUiCommand`, `shouldForceRunSql`, `shouldPreferSearchKnowledge`

Prompts génériques + injection marque (AssistantPrompts).
TOOL_DEFINITIONS plateforme = SoT kit (platform-tool-definitions).
Métier = discovery MCP ; pas de liste panier/tasks dupliquée en marque.

### `src/brand/registry.ts`

- **Lignes** : 120
- **Exports** : `configureAssistantBrand`, `getAssistantBrandConfig`, `requireAssistantBrand`, `assistantIdentity`, `assistantAppMapPages`, `assistantPrompts`, `assistantBrandTools`, `assistantMcp`, `assistantTasks`, `assistantDb`, `requireAssistantDb`, `assistantMeili`, `assistantHermes`, `assistantToolDefinitions`, `buildBrandHermesWorkBrief`, `buildBrandPersonalAgentBrief`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/brand/sources-shim.ts`

- **Lignes** : 56
- **Exports** : `AssistantSourceType`, `AssistantSource`, `collectSourcesFromSqlRows`, `sourceLinkMatchers`

Sources CRM — délégué à AssistantBrandTools (pas de schéma panier/catalogue en kit).

### `src/brand/types.ts`

- **Lignes** : 283
- **Exports** : `AssistantAppPage`, `AssistantToolDefinition`, `HermesWorkUser`, `AssistantAppMapConfig`, `AssistantPromptsConfig`, `AssistantMcpToolDef`, `AssistantMcpCallResult`, `AssistantMcpConfig`, `AssistantTasksConfig`, `AssistantAuthSession`, `AssistantBrandTools`, `AssistantDbAccess`, `AssistantRagHit`, `AssistantMeiliConfig`, `AssistantHermesConfig`, `AssistantBrandIdentity`, `AssistantBrandConfig`

Points d’extension marque pour `@creezio/assistant` (Phase N3 / O4r).
Marques = AppMap + Prompts addendum + projections (entitySources / Meili) +
façade MCP (tools métier découverts) + adapter tasks.
Kit = runtime + PLATFORM tools + handlers tasks/MCP.
`BrandTools.executeTool` = legacy mort (O4r) — ne plus brancher de métier.

### `src/env-store.ts`

- **Lignes** : 45
- **Exports** : `getKitAssistantStore`, `requireKitAssistantStore`

Assistant SoT via env `CREEZIO_CORE_DB_PATH` / `DB_PATH` — M8.

### `src/http/assistant-routes.ts`

- **Lignes** : 735
- **Exports** : `AssistantSession`, `AssistantDesktopPresence`, `AssistantPluginProduct`, `AssistantPluginProductHub`, `AssistantRoutesFeatures`, `AssistantRoutesDeps`, `createAssistantRoutes`

Surface HTTP assistant (mount Hono).
Port gold TempoFlow `crm/src/server/routes/assistant.ts` → kit (D-P16 / P5).
Auth / desktop-presence / Product Hub / usage restent injectables marque.
Prérequis : `configureAssistantBrand(...)` au boot host.

### `src/index.ts`

- **Lignes** : 213
- **Exports** : `ASSISTANT_IPC_SURFACE`, `ASSISTANT_CORE_SQL`, `ensureAssistantRichColumnsSql`, `createMemoryAssistantStore`, `createSqliteAssistantStore`, `openNodeSqliteDatabase`, `getKitAssistantStore`, `requireKitAssistantStore`, `assistantAppMapPages`, `assistantBrandTools`, `assistantDb`, `assistantHermes`, `assistantIdentity`, `assistantMcp`, `assistantMeili`, `assistantPrompts`, `assistantTasks`, `assistantToolDefinitions`, `buildBrandHermesWorkBrief`, `buildBrandPersonalAgentBrief`, `configureAssistantBrand`, `getAssistantBrandConfig`, `requireAssistantBrand`, `requireAssistantDb`, `APP_MAP`, `appMapPromptSection`, `getAppMap`, `pageInfoFor`, `ASSISTANT_SYSTEM_PROMPT`, `DEFAULT_MAX_TOOL_ROUNDS`, `TOOL_DEFINITIONS`, `buildSystemPrompt`, `formatNowParis`, `getToolDefinitions`, `maxToolRounds`, `shouldAuditDistribution`, `collectSourcesFromSqlRows`, `sourceLinkMatchers`, `ASSISTANT_FAB_MARGIN_PX`, `ASSISTANT_FAB_SAFE_PX`

@creezio/assistant — chat plateforme (store I2 + runtime/UI N3 + chat O4/O4r).
Extension marque : configureAssistantBrand({ appMap, prompts, mcp, tasks, tools, auth, meili, … }).
Métier = discovery MCP ; tasks = adapter ; pas de BrandTools.executeTool.

### `src/memory-store.ts`

- **Lignes** : 64
- **Exports** : `createMemoryAssistantStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/runtime/active-surface.ts`

- **Lignes** : 324
- **Exports** : `ASSISTANT_FAB_SAFE_PX`, `ASSISTANT_FAB_SIZE_PX`, `ASSISTANT_FAB_MARGIN_PX`, `ScreenRect`, `assistantFabScreenRect`, `rectsOverlap`, `ActiveSurfaceCrm`, `ActiveSurfaceExternal`, `ActiveSurfaceSupplier`, `ActiveSurface`, `isExternalActiveSurface`, `ExternalTabSummary`, `SupplierTabSummary`, `ActiveSurfaceTabLike`, `isExternalSurfaceHref`, `isSupplierSurfaceHref`, `siteIdFromSurfaceHref`, `fournisseurIdFromSurfaceHref`, `resolveActiveSurface`, `parseActiveSurface`, `parseExternalTabSummaries`, `parseSupplierTabSummaries`, `formatActiveSurfaceRuntimeBlock`, `looksLikeSurfaceCommand`

Contrat `activeSurface` — source de vérité unique :
« que regarde l'utilisateur ? » (CRM React vs onglet site externe).
Wire `kind: "supplier"` = alias historique TF (ne pas étendre) ; labels = génériques.
Module sans alias @/ / sans React — importable par les tests Node et le
serveur assistant.

### `src/runtime/agent-loop.ts`

- **Lignes** : 299
- **Exports** : `AgentToolDefinition`, `AgentTool`, `AgentContentPart`, `AgentMessage`, `AgentStepEvent`, `AgentModelCaller`, `callOpenAiModel`, `AgentLoopOptions`, `AgentLoopResult`, `runAgentLoop`

Boucle agent LLM générique (OpenAI tool-calling, non-streaming).
Utilisée par le runner des collaborateurs IA (`ai-task-agent.ts`).
Contrairement au chat (assistant-chat.ts, SSE + streaming), cette boucle
est synchrone côté serveur : messages → tool_calls → résultats → …
jusqu'à un outil terminal (`finish_task`) ou un plafond (steps, durée,
tokens).

### `src/runtime/anthropic-chat.ts`

- **Lignes** : 180
- **Exports** : `AnthropicMessage`, `AnthropicContentBlock`, `AnthropicToolUse`, `anthropicKey`, `anthropicModel`, `anthropicTools`, `callAnthropic`, `toAnthropicUserHistory`

Client Anthropic Messages API + tool_use (fallback quand OpenAI est en quota).

### `src/runtime/assistant-chat.ts`

- **Lignes** : 1945
- **Exports** : `maxDuration`, `handleAssistantChat`

Orchestration chat assistant (SSE / tools / Work Hermes) — Phase O4 / O4r.
SoT générique : surface/ui/supplier, explore SQL, Meili, boucles OpenAI/Anthropic.
Métier = discovery MCP (`configureAssistantBrand({ mcp })`).
Tasks = adapter kit (`configureAssistantBrand({ tasks })`).
Projections = getEntity / entitySources / Meili (pas d’executeTool métier).
BrandTools.executeTool = legacy mort (O4r).

### `src/runtime/chat-db.ts`

- **Lignes** : 685
- **Exports** : `ConversationRow`, `MessageRow`, `Source`, `getAssistantDbPath`, `getAssistantDb`, `titleFromMessage`, `listConversations`, `getConversation`, `adoptOrphanConversations`, `canAccessConversation`, `createConversation`, `updateConversationModel`, `deleteConversation`, `listMessages`, `addMessage`, `ensureConversation`, `AgentProfileRow`, `getAgentProfile`, `setAgentProfile`, `parseSources`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/runtime/explore-tools.ts`

- **Lignes** : 543
- **Exports** : `TableListItem`, `listTables`, `ColumnInfo`, `DistinctSample`, `ForeignKeyInfo`, `LinkColumnSample`, `describeTable`, `listDistinctValues`, `FindColumnsHit`, `findColumns`, `summarizeExploreResult`

Outils d'exploration schéma pour l'assistant agentique.
Process générique : list_distinct_values / describe_table / find_columns
avant tout filtre égalité sur colonne texte — jamais inventer un littéral.

### `src/runtime/geo-hint.ts`

- **Lignes** : 57
- **Exports** : `normalizeVilleKey`, `extractVilleHint`

Villes FR fréquentes pour détection rapide dans une question utilisateur. 
const KNOWN_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Bordeaux",
  "Toulouse",
  "Nantes",
  "Nice",
  "Strasbourg",
  "Montpellier",
  "Rennes",
  "Grenoble",
  "Tours",
  "Dijon",
  "Reims",
  "Le Havre",
  "Saint-Etienne",
  "Saint-Étienne",
  "Angers",
  "Villeurbanne",
  "Aix-en-Provence",
  "Clermont-Ferrand",
  "Saint-Priest",
  "Grigny",
];

const CITY_ALT = KNOWN_CITIES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

 Normalise une ville pour comparaison (casse, accents, espa

### `src/runtime/hermes-client.ts`

- **Lignes** : 336
- **Exports** : `HermesChatMessage`, `HermesCompletionResult`, `hermesConfigured`, `HermesEndpoint`, `wakeHermes`, `hermesChatCompletion`, `hermesChatCompletionStream`

Client Hermes Gateway (API OpenAI-compat sur le host).
Work mode : délégation agentique — skills via configureAssistantBrand({ hermes }).

### `src/runtime/hermes-kanban.ts`

- **Lignes** : 347
- **Exports** : `HermesKanbanStatus`, `HermesKanbanTask`, `hermesKanbanConfigured`, `hermesKanbanCreateTask`, `HermesKanbanTaskDetail`, `hermesKanbanGetTask`, `hermesKanbanPatchTask`, `hermesKanbanListTasks`, `hermesKanbanDispatch`, `hermesCronCreate`, `HERMES_KANBAN_TENANT`, `getHermesKanbanTenant`

Client Hermes Kanban (WebUI) — CRUD + board pour sync CRM.
Tenant / skills via configureAssistantBrand({ hermes }).
Auth :
- Desktop embarqué (loopback) : pas de password → auth WebUI off → pas de cookie.
- Si `HERMES_WEBUI_PASSWORD` est défini : login → cookie session (mémoire process).

### `src/runtime/hermes-models.ts`

- **Lignes** : 582
- **Exports** : `HERMES_PREFERRED_MODEL`, `HermesModelOption`, `HermesReasoningStatus`, `HERMES_REASONING_EFFORTS`, `hermesModelsConfigured`, `encodeHermesModelId`, `parseHermesModelId`, `bareHermesModelName`, `normalizeHermesModelsPayload`, `flattenHermesModelOptions`, `listHermesModelOptions`, `setHermesMainModel`, `getHermesReasoningStatus`, `setHermesReasoningEffort`, `ensureHermesWorkModel`

Modèles Hermes via WebUI (`/api/model/options` + `/api/model/set`).
Pas de liste en dur — source = providers authentifiés Hermes.

### `src/runtime/mcp-tools.ts`

- **Lignes** : 201
- **Exports** : `mcpToolDefToAssistant`, `refreshMcpToolCache`, `cachedMcpToolDefinitions`, `cachedMcpToolNames`, `ensureMcpToolCache`, `looksLikeMcpToolName`, `mcpOwnsToolName`, `callAssistantMcpTool`, `summarizeMcpResult`, `mcpFacadeToAssistantConfig`

Bridge assistant ↔ façade MCP marque (O4r).
Surface métier = listTools / callTool — pas BrandTools.executeTool.

### `src/runtime/meili-rag.ts`

- **Lignes** : 282
- **Exports** : `RagHit`, `SearchKnowledgeResult`, `ragIndexes`, `RAG_INDEXES`, `enrichHitsGeo`, `villeMatches`, `productQueryForMeili`, `searchKnowledge`, `isKeywordOnlyIndex`

Recherche keyword Meilisearch (générique).
Indexes + mapHit + enrichHits via configureAssistantBrand({ meili }).

### `src/runtime/models.ts`

- **Lignes** : 132
- **Exports** : `ModelTier`, `ModelOption`, `modelLabel`, `defaultModel`, `modelOptions`, `modelOptionsDetailed`, `resolveModel`, `supportsTemperature`

Modèles chat exposés dans le select UI (configurable via env). 

export type ModelTier = "reasoning" | "standard" | "fast";

export type ModelOption = {
  id: string;
  tier: ModelTier;
   Libellé UI, ex. "o4-mini · Reasoning"

### `src/runtime/modes.ts`

- **Lignes** : 80
- **Exports** : `ASSISTANT_MODES`, `AssistantMode`, `isAssistantMode`, `parseAssistantMode`, `UI_TOOL_NAMES`, `isUiToolName`, `CHAT_MODE_ADDENDUM`, `buildPersonalAgentWorkBrief`, `buildHermesWorkSystemBrief`

Modes assistant : Chat (guide) vs Work (délégation Hermes).
Briefs métier → configureAssistantBrand({ prompts }).

### `src/runtime/platform-tool-definitions.ts`

- **Lignes** : 629
- **Exports** : `PLATFORM_TOOL_DEFINITIONS`, `PLATFORM_TASK_TOOL_DEFINITIONS`, `PLATFORM_TASK_TOOL_ALIASES`

Définitions d'outils plateforme (SoT kit) — explore / SQL / Meili / surface / UI / supplier.
Métier (module.*) = discovery MCP. Tasks = PLATFORM_TASK_TOOL_DEFINITIONS + adapter tasks.
Phase O4r — remplace la duplication ×3 dans prompts.ts marques.

### `src/runtime/routing.ts`

- **Lignes** : 60
- **Exports** : `looksLikeUiCommand`, `shouldPreferSearchKnowledge`, `shouldForceRunSql`, `looksLikeSurfaceCommand`

Routage premier outil assistant (Meili vs SQL vs UI / surface).
Module sans alias @/ — importable par les tests Node.

### `src/runtime/run-sql.ts`

- **Lignes** : 307
- **Exports** : `RunSqlResult`, `runSql`, `collectSourcesFromSqlRows`, `sourceLinkMatchers`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/runtime/schema-catalog.ts`

- **Lignes** : 70
- **Exports** : `getSchemaCatalogPath`, `loadSchemaCatalog`, `clearSchemaCatalogCache`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/runtime/sql-process-guard.ts`

- **Lignes** : 306
- **Exports** : `TextEqualityFilter`, `DistinctHint`, `ProcessHint`, `extractSqlTables`, `extractTextEqualityFilters`, `isEmptySqlResult`, `extractLikeNeedles`, `enrichEmptySqlWithDistinctHints`, `summarizeProcessHint`

Garde-fou process générique pour run_sql :
si un filtre égalité texte renvoie 0, injecter les DISTINCT réels
(sans hardcoder de littéraux métier).

### `src/runtime/surface-router.ts`

- **Lignes** : 121
- **Exports** : `SurfaceRoute`, `routeSurfaceTool`, `contentRectWithAssistantSafeArea`

Routage observation/action selon activeSurface.
Pure (pas d'I/O) — testable hors Electron.

### `src/runtime/tasks-tools.ts`

- **Lignes** : 71
- **Exports** : `taskToolDefinitions`, `executeTaskTool`

Handlers create_task / list_tasks (O4r) — SoT kit + adapter marque.

### `src/runtime/tool-trace.ts`

- **Lignes** : 477
- **Exports** : `TraceRunStatus`, `TraceRunRow`, `TraceToolCallRow`, `TraceLlmRoundRow`, `ensureToolTraceTables`, `startAssistantRun`, `finishAssistantRun`, `logLlmRound`, `summarizeToolCall`, `logToolCall`, `getConversationTrace`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/runtime/ui-actions.ts`

- **Lignes** : 303
- **Exports** : `UiActionType`, `ExternalSiteActionType`, `SupplierActionType`, `UiActionRequest`, `SupplierSubscriberMeta`, `EmitFn`, `dispatchUiAction`, `subscribeSupplierActions`, `hasSupplierBridgeForUser`, `DispatchSupplierOpts`, `hasSupplierBridge`, `dispatchSupplierAction`, `resolveUiAction`, `UI_TOOL_NAMES`, `EXTERNAL_SITE_TOOL_NAMES`, `SUPPLIER_TOOL_NAMES`, `SURFACE_TOOL_NAMES`, `isUiTool`, `isExternalSiteTool`, `isSupplierTool`, `externalSiteToolVerb`, `isSurfaceTool`, `surfaceToolVerb`

Actions UI pilotées par l'assistant (souris virtuelle côté navigateur).
Aller-retour : la boucle LLM émet un événement SSE `ui_action` → le
navigateur (UiDriver) exécute l'action visuellement (faux curseur) →
il POST le résultat sur /api/v1/assistant/ui-actions/:id/result →
la promesse serveur se résout et le tool retourne le résultat au LLM.
Extension desktop (Electron) : les actions `external_*` (alias déprécié
`supplier_*`) ciblent les onglets sites externes. Canal SSE historique
GET /api/v1/assistant/supplier-actions/stream (nom wire TF — inchangé).
Le résultat revient par la même route RE

### `src/runtime/whisper.ts`

- **Lignes** : 79
- **Exports** : `whisperModel`, `transcribeAudio`

Transcription audio → texte via OpenAI Whisper (ou modèle compatible).

### `src/schema.ts`

- **Lignes** : 47
- **Exports** : `ASSISTANT_CORE_SQL`, `ensureAssistantRichColumnsSql`

DDL assistant — tables dans sqlite **core** (Phase I2 + C1 rich fields).
Décision figée : persistance cible = `resolveCoreDbPath` / SqliteRuntime core.
`resolveAssistantDbPath` (`assistant_chats.db`) reste un chemin **historique**
pour marques non migrées ; ne pas l’utiliser pour les nouveaux stores kit.
C1 : colonnes `model` / `mode` / `user_id` / `sources_json` pour cutover
TempoFlow sans perte (voir ensureAssistantRichColumns).

### `src/sqlite-driver.ts`

- **Lignes** : 42
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal pour @creezio/assistant (Phase I2).

### `src/sqlite-store.ts`

- **Lignes** : 238
- **Exports** : `SqliteAssistantStore`, `CreateSqliteAssistantStoreOptions`, `createSqliteAssistantStore`

Store assistant persisté dans sqlite **core** (Phase I2 + C1 rich).

### `src/types.ts`

- **Lignes** : 60
- **Exports** : `AssistantRole`, `AssistantMessage`, `AssistantConversation`, `CreateConversationInput`, `AppendMessageInput`, `AssistantStore`, `ASSISTANT_IPC_SURFACE`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-message-content.tsx`

- **Lignes** : 208
- **Exports** : `AssistantMessageContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-provider.tsx`

- **Lignes** : 141
- **Exports** : `ASSISTANT_PANEL_WIDTH_PX`, `AssistantProvider`, `useAssistantUi`, `useAssistantUiOptional`, `ASSISTANT_FAB_SAFE_PX`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-root.tsx`

- **Lignes** : 14
- **Exports** : `AssistantRoot`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-tool-steps.tsx`

- **Lignes** : 135
- **Exports** : `AssistantToolStep`, `AssistantToolSteps`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-trace-panel.tsx`

- **Lignes** : 384
- **Exports** : `AssistantTracePanel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/assistant-widget.tsx`

- **Lignes** : 2144
- **Exports** : `AssistantWidget`

// @ts-nocheck — desktop API loosely typed; marques fournissent Window.*Desktop

### `ui/entity-links.ts`

- **Lignes** : 4
- **Exports** : `entityLinkClass`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/fake-cursor.ts`

- **Lignes** : 172
- **Exports** : `getFakeCursor`

Souris virtuelle de l'assistant — curseur visuel animé qui se déplace
jusqu'à la cible puis « clique » (halo). Singleton DOM hors React pour
survivre aux navigations App Router.

### `ui/index.ts`

- **Lignes** : 23
- **Exports** : `AssistantProvider`, `ASSISTANT_PANEL_WIDTH_PX`, `ASSISTANT_FAB_SAFE_PX`, `useAssistantUi`, `useAssistantUiOptional`, `AssistantRoot`, `AssistantWidget`, `AssistantMessageContent`, `AssistantTracePanel`, `AssistantToolSteps`, `UiDriver`, `runUiAction`, `runUiNavigate`, `useVoiceInput`, `getFakeCursor`

Assistant UI (port TempoFlow — N3).
Consommer via `@creezio/assistant/ui`.

### `ui/primitives/badge.tsx`

- **Lignes** : 37
- **Exports** : `BadgeProps`, `Badge`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/button.tsx`

- **Lignes** : 45
- **Exports** : `ButtonProps`, `Button`, `buttonVariants`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/cn.ts`

- **Lignes** : 7
- **Exports** : `cn`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/dropdown-menu.tsx`

- **Lignes** : 188
- **Exports** : `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/input.tsx`

- **Lignes** : 20
- **Exports** : `Input`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/scroll-area.tsx`

- **Lignes** : 42
- **Exports** : `ScrollArea`, `ScrollBar`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/select.tsx`

- **Lignes** : 74
- **Exports** : `Select`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/tab-workspace-shim.ts`

- **Lignes** : 18
- **Exports** : `AssistantTabWorkspace`, `useTabWorkspaceOptional`

Shim workspace onglets — marques aliasent ce module vers leur TabWorkspaceProvider.
Défaut : pas de workspace (null).

### `ui/ui-driver.tsx`

- **Lignes** : 553
- **Exports** : `UI_ACTION_EVENT`, `runUiAction`, `runUiNavigate`, `UiDriver`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/use-voice-input.ts`

- **Lignes** : 211
- **Exports** : `VoiceInputState`, `useVoiceInput`

_(pas de cartouche JSDoc en tête — voir le code)_

