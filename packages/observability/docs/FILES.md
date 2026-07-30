# @creezio/observability — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/observability/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`fleet-collector/README.md`](../fleet-collector/README.md) | 69 | — |
| [`fleet-collector/env.mjs`](../fleet-collector/env.mjs) | 175 | `resolveFleetCollectorEnv`, `hostnameForSlug` |
| [`fleet-collector/ops-api.mjs`](../fleet-collector/ops-api.mjs) | 456 | `buildFleetOverview`, `buildServerDetail`, `buildUserDetail` |
| [`fleet-collector/server.mjs`](../fleet-collector/server.mjs) | 565 | — |
| [`fleet-collector/test-fleet-collector.mjs`](../fleet-collector/test-fleet-collector.mjs) | 414 | — |
| [`src/api-mount.ts`](../src/api-mount.ts) | 128 | `createObservabilityApiMount` |
| [`src/helpers.ts`](../src/helpers.ts) | 73 | `EmitActor`, `recordActivity`, `recordPluginUsage`, `recordControlPlaneEvent` |
| [`src/index.ts`](../src/index.ts) | 198 | `OBSERVABILITY_EVENT_KINDS`, `OBSERVABILITY_CORE_SQL`, `createMemoryObservabilityStore`, `createSqliteObservabilityStore`, `openNodeSqliteDatabase`, `recordActivity`, `recordControlPlaneEvent`, `recordPluginUsage` |
| [`src/memory-store.ts`](../src/memory-store.ts) | 111 | `createMemoryObservabilityStore` |
| [`src/ops/emit.ts`](../src/ops/emit.ts) | 16 | `emitOpsEvent` |
| [`src/ops/fleet-activity.ts`](../src/ops/fleet-activity.ts) | 183 | `FleetSurface`, `FleetAction`, `FleetSessionContext`, `setFleetSessionContext`, `getFleetSessionContext`, `recordFleetAction`, `sampleFleetActions`, `drainFleetActions` |
| [`src/ops/fleet-agent.ts`](../src/ops/fleet-agent.ts) | 449 | `FleetHealthSnapshot`, `FleetTelemetrySnapshot`, `FleetAgentRuntimeHooks`, `CreateFleetAgentOptions`, `FleetAgent`, `createFleetAgent` |
| [`src/ops/fleet-samples.ts`](../src/ops/fleet-samples.ts) | 254 | `FleetSamplesPaths`, `FleetSamples`, `createFleetSamples` |
| [`src/ops/journal.ts`](../src/ops/journal.ts) | 343 | `OpsJournalHooks`, `setOpsJournalHooks`, `getOpsBootId`, `getOpsDir`, `initOpsJournal`, `track`, `trackDecision`, `trackCrashMirror` |
| [`src/ops/rules.ts`](../src/ops/rules.ts) | 125 | `BootRuleFinding`, `evaluateRulesPure`, `evaluateBootRules` |
| [`src/ops/types.ts`](../src/ops/types.ts) | 161 | `TF2EVENT_PREFIX`, `OPS_EVENT_PREFIX`, `OPS_EVENT_PREFIXES`, `OpsLevel`, `OPS_LEVELS`, `OpsEventInput`, `OpsEvent`, `MAX_CTX_BYTES` |
| [`src/request-logs/config.ts`](../src/request-logs/config.ts) | 41 | `RequestLogsConfig`, `configureRequestLogs`, `getRequestLogsConfig`, `resetRequestLogsConfigForTests`, `resolveFleetStateDir` |
| [`src/request-logs/http-routes.ts`](../src/request-logs/http-routes.ts) | 40 | `createRequestLogsRoutes` |
| [`src/request-logs/index.ts`](../src/request-logs/index.ts) | 37 | `configureRequestLogs`, `getRequestLogsConfig`, `resetRequestLogsConfigForTests`, `resolveFleetStateDir`, `getRequestLogCapacity`, `_resetRequestLogsForTests`, `isSecretKey`, `redactSecrets` |
| [`src/request-logs/middleware.ts`](../src/request-logs/middleware.ts) | 223 | `requestLogApiMiddleware`, `requestLogMcpMiddleware` |
| [`src/request-logs/request-logs.ts`](../src/request-logs/request-logs.ts) | 320 | `RequestLogSource`, `RequestLogDetail`, `RequestLogEntry`, `getRequestLogCapacity`, `_resetRequestLogsForTests`, `isSecretKey`, `redactSecrets`, `pushRequestLog` |
| [`src/schema.ts`](../src/schema.ts) | 22 | `OBSERVABILITY_CORE_SQL` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 42 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | 232 | `SqliteObservabilityStore`, `CreateSqliteObservabilityStoreOptions`, `createSqliteObservabilityStore` |
| [`src/types.ts`](../src/types.ts) | 98 | `OBSERVABILITY_EVENT_KINDS`, `ObservabilityEventKind`, `ActivityAction`, `ControlPlaneAction`, `ObservabilityEvent`, `RecordObservabilityEventInput`, `ObservabilityQuery`, `PluginUsageAggregate` |
| [`src/usage/adapters.ts`](../src/usage/adapters.ts) | 75 | `UsageAnalyticsSqliteStatement`, `UsageAnalyticsSqliteDatabase`, `UsageAnalyticsAdapters`, `configureUsageAnalytics`, `getUsageAnalyticsAdapters`, `resetUsageAnalyticsAdaptersForTests`, `uaGetWriteDb`, `uaGetDb` |
| [`src/usage/http-routes.ts`](../src/usage/http-routes.ts) | 217 | `UsageAnalyticsSession`, `UsageAnalyticsRouteDeps`, `createUsageAnalyticsIngestRoutes`, `createUsageAnalyticsAdminRoutes` |
| [`src/usage/index.ts`](../src/usage/index.ts) | 69 | `configureUsageAnalytics`, `getUsageAnalyticsAdapters`, `resetUsageAnalyticsAdaptersForTests`, `configureUsageAnalyticsUiBrand`, `getUsageAnalyticsUiBrand`, `resetUsageAnalyticsUiBrandForTests`, `formatDuration`, `usageAnalyticsReady` |
| [`src/usage/ui-brand.ts`](../src/usage/ui-brand.ts) | 43 | `FleetActionPayload`, `UsageAnalyticsUiBrand`, `configureUsageAnalyticsUiBrand`, `getUsageAnalyticsUiBrand`, `resetUsageAnalyticsUiBrandForTests` |
| [`src/usage/usage-analytics-productivity.ts`](../src/usage/usage-analytics-productivity.ts) | 457 | `BREAK_MIN_MS`, `BREAK_MAX_MS`, `HeatmapCell`, `DailyProductivity`, `BreakSpan`, `FocusBlock`, `ProductivitySummary`, `ProductivityReport` |
| [`src/usage/usage-analytics-shared.ts`](../src/usage/usage-analytics-shared.ts) | 20 | `UsageUserKind`, `UsagePeriod`, `formatDuration` |
| [`src/usage/usage-analytics.ts`](../src/usage/usage-analytics.ts) | 539 | `UsageEventInput`, `UsageEventRow`, `UsageFilters`, `usageAnalyticsReady`, `ensureUsageAnalyticsSchema`, `insertUsageEvents`, `recordUsageEvent`, `resolvePeriodFilters` |
| [`ui/analytics-client.tsx`](../ui/analytics-client.tsx) | 835 | `AnalyticsClient` |
| [`ui/analytics-productivity-panel.tsx`](../ui/analytics-productivity-panel.tsx) | 514 | `ProductivityPayload`, `AnalyticsProductivityPanel` |
| [`ui/api-endpoints-client.tsx`](../ui/api-endpoints-client.tsx) | 229 | `ApiEndpointsClient` |
| [`ui/index.ts`](../ui/index.ts) | 39 | `AnalyticsClient`, `AnalyticsProductivityPanel`, `UsageAnalyticsProvider`, `flushUsageAnalytics`, `setUsageAnalyticsSession`, `trackUsagePageView`, `trackUsageEvent`, `ensureUsageAnalyticsDom` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 38 | `BadgeProps`, `Badge` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/card.tsx`](../ui/primitives/card.tsx) | 45 | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| [`ui/primitives/cn.ts`](../ui/primitives/cn.ts) | 7 | `cn` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/tabs.tsx`](../ui/primitives/tabs.tsx) | 52 | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| [`ui/request-logs-client.tsx`](../ui/request-logs-client.tsx) | 328 | `RequestLogsClient` |
| [`ui/usage-analytics-client.ts`](../ui/usage-analytics-client.ts) | 480 | `flushUsageAnalytics`, `setUsageAnalyticsSession`, `trackUsagePageView`, `trackUsageEvent`, `ensureUsageAnalyticsDom` |
| [`ui/usage-analytics-provider.tsx`](../ui/usage-analytics-provider.tsx) | 85 | `UsageAnalyticsProviderSession`, `UsageAnalyticsProvider` |

---

## Détail par fichier

### `fleet-collector/README.md`

- **Lignes** : 69

_(pas de cartouche JSDoc en tête — voir le code)_

### `fleet-collector/env.mjs`

- **Lignes** : 175
- **Exports** : `resolveFleetCollectorEnv`, `hostnameForSlug`

Résolution env fleet-collector — defaults neutres `CREEZIO_*` / `FLEET_*`
+ dual-read legacy marques (`TF2_*`, `CERTIVAN_*`).
Aucun domaine marque hardcodé : suffix tunnel / titres UI via injection.

### `fleet-collector/ops-api.mjs`

- **Lignes** : 456
- **Exports** : `buildFleetOverview`, `buildServerDetail`, `buildUserDetail`

Agrégation flotte pour l’UI ops (slug → users → activité).
Suffixe tunnel / hostnames : opts.tunnelSuffix (injection marque).

### `fleet-collector/server.mjs`

- **Lignes** : 565

_(pas de cartouche JSDoc en tête — voir le code)_

### `fleet-collector/test-fleet-collector.mjs`

- **Lignes** : 414

Tests locaux du fleet-collector kit (spawn serveur éphémère).
Env neutre CREEZIO_* — pas de domaine marque.

### `src/api-mount.ts`

- **Lignes** : 128
- **Exports** : `createObservabilityApiMount`

Mount API observabilité — /api/v1/platform/observability/...

### `src/helpers.ts`

- **Lignes** : 73
- **Exports** : `EmitActor`, `recordActivity`, `recordPluginUsage`, `recordControlPlaneEvent`

Helpers d'émission typés — activité / usages plugins / control-plane.

### `src/index.ts`

- **Lignes** : 198
- **Exports** : `OBSERVABILITY_EVENT_KINDS`, `OBSERVABILITY_CORE_SQL`, `createMemoryObservabilityStore`, `createSqliteObservabilityStore`, `openNodeSqliteDatabase`, `recordActivity`, `recordControlPlaneEvent`, `recordPluginUsage`, `createObservabilityApiMount`, `MAX_CTX_BYTES`, `OPS_EVENT_PREFIX`, `OPS_EVENT_PREFIXES`, `OPS_LEVELS`, `TF2EVENT_PREFIX`, `parseOpsLine`, `redactOpsCtx`, `sanitizeOpsEventInput`, `serializeOpsEvent`, `__resetOpsJournalForTests`, `consumeOpsLine`, `currentBootSummary`, `drainPendingOpsEvents`, `getOpsBootId`, `getOpsDir`, `initOpsJournal`, `persistBootSummary`, `readPreviousBootSummaries`, `setOpsJournalHooks`, `track`, `trackCrashMirror`, `trackDecision`, `trackExternal`, `evaluateBootRules`, `evaluateRulesPure`, `emitOpsEvent`, `createFleetAgent`, `_resetFleetActivityForTests`, `drainFleetActions`, `getFleetSessionContext`, `recordFleetAction`

@creezio/observability — activité / usages / CP (V2 SQLite) + boîte noire
desktop ops/fleet (R4, extrait TempoFlow).

### `src/memory-store.ts`

- **Lignes** : 111
- **Exports** : `createMemoryObservabilityStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/ops/emit.ts`

- **Lignes** : 16
- **Exports** : `emitOpsEvent`

Émission d'événements ops depuis un SOUS-PROCESS Node vanilla
(meili-indexer, migrations…) : ligne `TF2EVENT {json}` sur stdout.
Extrait de TempoFlow ops-emit.ts (R4).

### `src/ops/fleet-activity.ts`

- **Lignes** : 183
- **Exports** : `FleetSurface`, `FleetAction`, `FleetSessionContext`, `setFleetSessionContext`, `getFleetSessionContext`, `recordFleetAction`, `sampleFleetActions`, `drainFleetActions`, `_resetFleetActivityForTests`

Journal d’événements produit flotte (ring mémoire).
Schema FleetProductEvent v1 — attribution session + dwell.
Extrait TempoFlow fleet-activity.ts (M7).

### `src/ops/fleet-agent.ts`

- **Lignes** : 449
- **Exports** : `FleetHealthSnapshot`, `FleetTelemetrySnapshot`, `FleetAgentRuntimeHooks`, `CreateFleetAgentOptions`, `FleetAgent`, `createFleetAgent`

Agent télémétrie flotte — heartbeat + sync opt-in.
Extrait de TempoFlow fleet-agent.ts (R4) — endpoint / consent / IDs = hooks.
Best-effort : jamais de throw vers le boot.

### `src/ops/fleet-samples.ts`

- **Lignes** : 254
- **Exports** : `FleetSamplesPaths`, `FleetSamples`, `createFleetSamples`

Échantillons télémétrie flotte (best-effort, lecture seule, redactée).
Pas de better-sqlite3 dans le process Electron (ABI) — spawn Node vanilla.
Extrait TempoFlow fleet-samples.ts (M7) — chemins = hooks marque.

### `src/ops/journal.ts`

- **Lignes** : 343
- **Exports** : `OpsJournalHooks`, `setOpsJournalHooks`, `getOpsBootId`, `getOpsDir`, `initOpsJournal`, `track`, `trackDecision`, `trackCrashMirror`, `consumeOpsLine`, `trackExternal`, `drainPendingOpsEvents`, `currentBootSummary`, `persistBootSummary`, `readPreviousBootSummaries`, `__resetOpsJournalForTests`

Boîte noire desktop — journal d'événements structurés (JSONL / boot).
Extrait de TempoFlow ops-journal.ts (R4). Hooks marque pour log + anomaly.
Best-effort intégral : le journal ne doit JAMAIS être une source de crash.

### `src/ops/rules.ts`

- **Lignes** : 125
- **Exports** : `BootRuleFinding`, `evaluateRulesPure`, `evaluateBootRules`

Boîte noire — moteur d'anomalies générique.
Extrait de TempoFlow ops-rules.ts (R4).

### `src/ops/types.ts`

- **Lignes** : 161
- **Exports** : `TF2EVENT_PREFIX`, `OPS_EVENT_PREFIX`, `OPS_EVENT_PREFIXES`, `OpsLevel`, `OPS_LEVELS`, `OpsEventInput`, `OpsEvent`, `MAX_CTX_BYTES`, `redactOpsCtx`, `sanitizeOpsEventInput`, `serializeOpsEvent`, `parseOpsLine`, `OpsBootSummary`

Boîte noire desktop — types + helpers PURS (aucun import Electron).
Contrat JSONL ops (R4 / P29) — préfixe d'émission historique `TF2EVENT`
conservé (wire sous-process Electron ×3). Lecture = dual-read via
`OPS_EVENT_PREFIXES` ; ne pas retirer `TF2EVENT` sans cutover marques.

### `src/request-logs/config.ts`

- **Lignes** : 41
- **Exports** : `RequestLogsConfig`, `configureRequestLogs`, `getRequestLogsConfig`, `resetRequestLogsConfigForTests`, `resolveFleetStateDir`

Injection host pour request-logs (évite imports `@/` marque).
O5 — gold TempoFlow générique.

### `src/request-logs/http-routes.ts`

- **Lignes** : 40
- **Exports** : `createRequestLogsRoutes`

Admin — lecture / purge des logs API + MCP (session UI).
Hono « nu » : hors doc OpenAPI publique.
O5 — extrait TempoFlow (gold). Auth owner reste côté marque (montage).

### `src/request-logs/index.ts`

- **Lignes** : 37
- **Exports** : `configureRequestLogs`, `getRequestLogsConfig`, `resetRequestLogsConfigForTests`, `resolveFleetStateDir`, `getRequestLogCapacity`, `_resetRequestLogsForTests`, `isSecretKey`, `redactSecrets`, `pushRequestLog`, `listRequestLogs`, `clearRequestLogs`, `parseJsonRpcMessages`, `summarizeMcpRequest`, `summarizeMcpResponse`, `extractApiErrorMessage`, `shouldSkipRequestLog`, `requestLogApiMiddleware`, `requestLogMcpMiddleware`, `createRequestLogsRoutes`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/request-logs/middleware.ts`

- **Lignes** : 223
- **Exports** : `requestLogApiMiddleware`, `requestLogMcpMiddleware`

Middlewares de collecte des logs API / MCP → ring buffer mémoire.
Ne doit jamais faire échouer la requête (tout est try/catch).
O5 — extrait TempoFlow (gold).

### `src/request-logs/request-logs.ts`

- **Lignes** : 320
- **Exports** : `RequestLogSource`, `RequestLogDetail`, `RequestLogEntry`, `getRequestLogCapacity`, `_resetRequestLogsForTests`, `isSecretKey`, `redactSecrets`, `pushRequestLog`, `ListRequestLogsOpts`, `listRequestLogs`, `clearRequestLogs`, `parseJsonRpcMessages`, `summarizeMcpRequest`, `summarizeMcpResponse`, `extractApiErrorMessage`, `shouldSkipRequestLog`

Ring buffer en mémoire des appels API v1 + MCP (diagnostic desktop).
Pas de persistance SQLite pour le MVP — process-local, max ~1000 entrées.
O5 — extrait TempoFlow (gold), marque-agnostique.

### `src/schema.ts`

- **Lignes** : 22
- **Exports** : `OBSERVABILITY_CORE_SQL`

Schéma SQLite core — observabilité V2. 

export const OBSERVABILITY_CORE_SQL = `
CREATE TABLE IF NOT EXISTS creezio_obs_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  action TEXT NOT NULL,
  org_id TEXT,
  user_id TEXT,
  brand_id TEXT,
  plugin_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}',

### `src/sqlite-driver.ts`

- **Lignes** : 42
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal — dual-build CJS Electron (pas d'import.meta).

### `src/sqlite-store.ts`

- **Lignes** : 232
- **Exports** : `SqliteObservabilityStore`, `CreateSqliteObservabilityStoreOptions`, `createSqliteObservabilityStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/types.ts`

- **Lignes** : 98
- **Exports** : `OBSERVABILITY_EVENT_KINDS`, `ObservabilityEventKind`, `ActivityAction`, `ControlPlaneAction`, `ObservabilityEvent`, `RecordObservabilityEventInput`, `ObservabilityQuery`, `PluginUsageAggregate`, `OrgActivityAggregate`, `ObservabilityStore`

Contrats observabilité native (vision V2).

### `src/usage/adapters.ts`

- **Lignes** : 75
- **Exports** : `UsageAnalyticsSqliteStatement`, `UsageAnalyticsSqliteDatabase`, `UsageAnalyticsAdapters`, `configureUsageAnalytics`, `getUsageAnalyticsAdapters`, `resetUsageAnalyticsAdaptersForTests`, `uaGetWriteDb`, `uaGetDb`, `uaQueryAll`, `uaQueryOne`, `uaTableExists`

Injection host pour usage-analytics (évite imports `@/` marque).

### `src/usage/http-routes.ts`

- **Lignes** : 217
- **Exports** : `UsageAnalyticsSession`, `UsageAnalyticsRouteDeps`, `createUsageAnalyticsIngestRoutes`, `createUsageAnalyticsAdminRoutes`

Routes Hono usage analytics — ingest + admin (port TempoFlow — N6).
Auth owner pour admin reste côté marque (montage).

### `src/usage/index.ts`

- **Lignes** : 69
- **Exports** : `configureUsageAnalytics`, `getUsageAnalyticsAdapters`, `resetUsageAnalyticsAdaptersForTests`, `configureUsageAnalyticsUiBrand`, `getUsageAnalyticsUiBrand`, `resetUsageAnalyticsUiBrandForTests`, `formatDuration`, `usageAnalyticsReady`, `ensureUsageAnalyticsSchema`, `insertUsageEvents`, `recordUsageEvent`, `resolvePeriodFilters`, `getUsageOverview`, `getUsageTimeline`, `getTopPages`, `getTopClicks`, `getUserStats`, `listUsageEvents`, `purgeUsageEvents`, `BREAK_MIN_MS`, `BREAK_MAX_MS`, `getProductivityReport`, `createUsageAnalyticsIngestRoutes`, `createUsageAnalyticsAdminRoutes`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/usage/ui-brand.ts`

- **Lignes** : 43
- **Exports** : `FleetActionPayload`, `UsageAnalyticsUiBrand`, `configureUsageAnalyticsUiBrand`, `getUsageAnalyticsUiBrand`, `resetUsageAnalyticsUiBrandForTests`

Tokens UI / tracker usage (marque).

### `src/usage/usage-analytics-productivity.ts`

- **Lignes** : 457
- **Exports** : `BREAK_MIN_MS`, `BREAK_MAX_MS`, `HeatmapCell`, `DailyProductivity`, `BreakSpan`, `FocusBlock`, `ProductivitySummary`, `ProductivityReport`, `getProductivityReport`

Agrégations productivité : heatmap, heures actives, pauses, score.
Basé sur les événements usage_events (heartbeats, clics, pages, idle…).

### `src/usage/usage-analytics-shared.ts`

- **Lignes** : 20
- **Exports** : `UsageUserKind`, `UsagePeriod`, `formatDuration`

Types / helpers partagés client + serveur (sans dépendance SQLite). 

export type UsageUserKind = "human" | "ai" | "system" | "unknown";
export type UsagePeriod = "day" | "week" | "month" | "year";

export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return rs ? `${m}m ${rs}s` : `${m}m`;

### `src/usage/usage-analytics.ts`

- **Lignes** : 539
- **Exports** : `UsageEventInput`, `UsageEventRow`, `UsageFilters`, `usageAnalyticsReady`, `ensureUsageAnalyticsSchema`, `insertUsageEvents`, `recordUsageEvent`, `resolvePeriodFilters`, `UsageOverview`, `getUsageOverview`, `TimelineBucket`, `getUsageTimeline`, `PageStat`, `getTopPages`, `ClickStat`, `getTopClicks`, `UserStat`, `getUserStats`, `listUsageEvents`, `purgeUsageEvents`, `formatDuration`

Analytics d'usage — persistance SQLite + agrégations Admin.
Événements UI (pages, clics, dwell) + actions serveur (agent IA…).

### `ui/analytics-client.tsx`

- **Lignes** : 835
- **Exports** : `AnalyticsClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/analytics-productivity-panel.tsx`

- **Lignes** : 514
- **Exports** : `ProductivityPayload`, `AnalyticsProductivityPanel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/api-endpoints-client.tsx`

- **Lignes** : 229
- **Exports** : `ApiEndpointsClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 39
- **Exports** : `AnalyticsClient`, `AnalyticsProductivityPanel`, `UsageAnalyticsProvider`, `flushUsageAnalytics`, `setUsageAnalyticsSession`, `trackUsagePageView`, `trackUsageEvent`, `ensureUsageAnalyticsDom`, `configureUsageAnalyticsUiBrand`, `getUsageAnalyticsUiBrand`, `RequestLogsClient`, `ApiEndpointsClient`

Observability Admin UI (usage analytics N6 + request-logs / api-endpoints O5).
Consommer via `@creezio/observability/ui`.

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

### `ui/request-logs-client.tsx`

- **Lignes** : 328
- **Exports** : `RequestLogsClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/usage-analytics-client.ts`

- **Lignes** : 480
- **Exports** : `flushUsageAnalytics`, `setUsageAnalyticsSession`, `trackUsagePageView`, `trackUsageEvent`, `ensureUsageAnalyticsDom`

Tracker d'usage client — pages, dwell, clics, présence (heartbeat / idle / focus).
Buffer + flush vers POST /api/v1/analytics/events.
Miroir optionnel vers la télémétrie flotte Electron.
Vie privée : on ne journalise PAS le contenu des frappes ni les mouvements souris,
seulement des signaux d'activité agrégés (heartbeat / idle).

### `ui/usage-analytics-provider.tsx`

- **Lignes** : 85
- **Exports** : `UsageAnalyticsProviderSession`, `UsageAnalyticsProvider`

_(pas de cartouche JSDoc en tête — voir le code)_

