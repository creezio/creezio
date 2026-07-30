# @creezio/shell-ui — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/shell-ui/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/adapters/nav-shell.ts`](../src/adapters/nav-shell.ts) | 170 | `NavRenderItem`, `NavRenderGroup`, `NavRenderModel`, `NavShellAdapter`, `CreateNavShellAdapterOptions`, `createNavShellAdapter` |
| [`src/brand.ts`](../src/brand.ts) | 51 | `ShellUiBrand`, `configureShellUiBrand`, `getShellUiBrand`, `resetShellUiBrandForTests`, `getShellDesktopApi` |
| [`src/core-nav.ts`](../src/core-nav.ts) | 25 | `CORE_NAV_ITEMS`, `coreNavItems` |
| [`src/index.ts`](../src/index.ts) | 93 | `CORE_NAV_ITEMS`, `coreNavItems`, `createNavRegistry`, `mergeNav`, `createNavShellAdapter`, `configureShellUiBrand`, `getShellUiBrand`, `getShellDesktopApi` |
| [`src/lib/api-scopes.ts`](../src/lib/api-scopes.ts) | 81 | `API_SCOPE_FULL`, `API_SCOPE_CRM_READ`, `API_SCOPE_CRM_WRITE`, `API_SCOPE_TASKS_RUN`, `normalizeApiScopes`, `parseApiKeyScopes`, `apiKeyAllowsMethod`, `apiKeyAllowsTasks` |
| [`src/lib/catalog-suspense-key.ts`](../src/lib/catalog-suspense-key.ts) | 15 | `buildCatalogSuspenseKey` |
| [`src/lib/desktop-home-path.ts`](../src/lib/desktop-home-path.ts) | 29 | `CRM_HOME_PATH`, `SERVER_COCKPIT_PATH`, `defaultHomePathSync`, `resolveDesktopHomePath` |
| [`src/lib/geo-distance.ts`](../src/lib/geo-distance.ts) | 38 | `haversineKm` |
| [`src/lib/img.ts`](../src/lib/img.ts) | 47 | `thumbUrl` |
| [`src/lib/keepalive-eviction.ts`](../src/lib/keepalive-eviction.ts) | 59 | `configureKeepAliveFullscreenMatchers`, `isKeepAliveProtectedKey`, `rankKeepAliveEvictionKeys` |
| [`src/lib/ops-track.ts`](../src/lib/ops-track.ts) | 51 | `ServerOpsLevel`, `ServerOpsEvent`, `trackServer`, `trackServerDebounced` |
| [`src/lib/optimize-cover-url.ts`](../src/lib/optimize-cover-url.ts) | 83 | `optimizeCoverUrl` |
| [`src/lib/page-trails.ts`](../src/lib/page-trails.ts) | 25 | `TrailCrumb`, `trailForRequestLogs`, `trailForAnalytics`, `trailForLoading` |
| [`src/lib/public-origin.ts`](../src/lib/public-origin.ts) | 174 | `HeaderReader`, `ResolvedOrigin`, `isLoopbackHost`, `resolvePublicOrigin`, `resolveCookieSecure` |
| [`src/lib/server-incident.ts`](../src/lib/server-incident.ts) | 41 | `reportServerIncident` |
| [`src/lib/tab-document-url.ts`](../src/lib/tab-document-url.ts) | 56 | `normalizeTabDocumentUrl`, `isSameTabDocument`, `isSameTabOrigin` |
| [`src/lib/utils.ts`](../src/lib/utils.ts) | 80 | `cn`, `formatDate`, `formatDateTime`, `formatMoney`, `parsePage`, `formatVariationPct`, `formatDeltaMoney`, `variationTone` |
| [`src/registry.ts`](../src/registry.ts) | 78 | `NavRegistry`, `createNavRegistry`, `mergeNav` |
| [`src/types.ts`](../src/types.ts) | 19 | `CoreNavItem`, `NavItem`, `NavSlotId`, `NavSlot` |
| [`ui/app-error-boundary.tsx`](../ui/app-error-boundary.tsx) | 60 | `AppErrorBoundary` |
| [`ui/data-table.tsx`](../ui/data-table.tsx) | 122 | `DataTable` |
| [`ui/desktop-types.ts`](../ui/desktop-types.ts) | 31 | `DesktopUpdateState`, `DesktopUpdateStatus` |
| [`ui/desktop/auth-window-chrome.tsx`](../ui/desktop/auth-window-chrome.tsx) | 52 | `AuthWindowChrome` |
| [`ui/desktop/desktop-bridge.tsx`](../ui/desktop/desktop-bridge.tsx) | 88 | `DesktopBridge`, `openExternalSiteFromWorkspace` |
| [`ui/desktop/external-site-slot.tsx`](../ui/desktop/external-site-slot.tsx) | 301 | `ExternalSiteSlotPhase`, `SupplierSlotPhase`, `reduceExternalSiteLoadState`, `reduceSupplierLoadState`, `ExternalSiteSlot`, `SupplierSiteSlot` |
| [`ui/desktop/external-site-surface.ts`](../ui/desktop/external-site-surface.ts) | 59 | `ExternalSiteSurfaceSignal`, `ExternalSiteSurfaceCommand`, `reduceExternalSiteSurfaceCommand`, `SupplierSurfaceSignal`, `SupplierSurfaceCommand`, `reduceSupplierSurfaceCommand` |
| [`ui/desktop/site-link.tsx`](../ui/desktop/site-link.tsx) | 106 | `SiteLink` |
| [`ui/desktop/window-chrome-controls.tsx`](../ui/desktop/window-chrome-controls.tsx) | 6 | `WindowChromeControls` |
| [`ui/faceted-filters.tsx`](../ui/faceted-filters.tsx) | 119 | `FacetOption`, `FacetDef`, `FacetedFilters` |
| [`ui/global-search-host.ts`](../ui/global-search-host.ts) | 21 | `GlobalSearchHost`, `configureGlobalSearchHost`, `useGlobalSearch` |
| [`ui/global-search.tsx`](../ui/global-search.tsx) | 67 | `GlobalSearchTrigger` |
| [`ui/index.ts`](../ui/index.ts) | 137 | `configureShellUiBrand`, `getShellUiBrand`, `getShellDesktopApi`, `resetShellUiBrandForTests`, `configureTabWorkspaceHost`, `useTabWorkspace`, `useTabWorkspaceOptional`, `useOpenTab` |
| [`ui/layout/app-shell.tsx`](../ui/layout/app-shell.tsx) | 59 | `AppShell` |
| [`ui/layout/desktop-update-banner.tsx`](../ui/layout/desktop-update-banner.tsx) | 101 | `DesktopUpdateBanner` |
| [`ui/layout/entity-header.tsx`](../ui/layout/entity-header.tsx) | 45 | `EntityHeader` |
| [`ui/layout/page-chrome.tsx`](../ui/layout/page-chrome.tsx) | 91 | `PageChrome` |
| [`ui/layout/page-toolbar-context.tsx`](../ui/layout/page-toolbar-context.tsx) | 83 | `toolbarKey`, `PageToolbarProvider`, `useRegisterPageToolbar`, `usePageToolbarActions` |
| [`ui/layout/sandbox-banner.tsx`](../ui/layout/sandbox-banner.tsx) | 39 | `SandboxBanner` |
| [`ui/layout/section-view-shell.tsx`](../ui/layout/section-view-shell.tsx) | 74 | `SECTION_VIEW_DYNAMIC`, `SectionViewShellProps`, `SectionViewShell`, `SectionViewLoadingProps`, `SectionViewLoading` |
| [`ui/layout/sidebar-host.ts`](../ui/layout/sidebar-host.ts) | 54 | `SidebarNavItem`, `SidebarAdminItem`, `SidebarHost`, `configureSidebar`, `getSidebarHost`, `getSidebarHostOptional` |
| [`ui/layout/sidebar.tsx`](../ui/layout/sidebar.tsx) | 1058 | `Sidebar`, `CrmSidebar` |
| [`ui/lib/ai-screencast-hub.ts`](../ui/lib/ai-screencast-hub.ts) | 128 | `ScreencastFrame`, `publishScreencastFrame`, `subscribeScreencast`, `screencastViewerCount`, `clearScreencastFrame` |
| [`ui/lib/ai-workspace-client.ts`](../ui/lib/ai-workspace-client.ts) | 47 | `aiWorkspaceAvailable`, `openAiWorkspaceView` |
| [`ui/lib/desktop-host.ts`](../ui/lib/desktop-host.ts) | 115 | `DesktopHostInfo`, `getDesktopHostInfo`, `isRemoteDesktopClient`, `FleetActionPayload`, `mirrorFleetAction` |
| [`ui/lib/fleet-tracker-client.ts`](../ui/lib/fleet-tracker-client.ts) | 237 | `setFleetTrackerSession`, `trackFleetPageView`, `trackFleetEvent`, `ensureFleetTrackerDom`, `trackFleetCommerce` |
| [`ui/lib/hermes-ui.ts`](../ui/lib/hermes-ui.ts) | 115 | `HERMES_WEBUI_SITE_ID`, `HERMES_WEBUI_TAB_TITLE`, `HermesWebuiOpenTarget`, `hermesUnavailableMessage`, `resolveHermesWebuiOpenTarget`, `isHermesWebuiOpenTarget` |
| [`ui/lib/n8n-ui.ts`](../ui/lib/n8n-ui.ts) | 116 | `N8N_UI_SITE_ID`, `N8N_UI_TAB_TITLE`, `N8nUiOpenTarget`, `N8nUiOpenFail`, `resolveN8nUiOpenTarget`, `isN8nUiOpenTarget`, `openN8nUiInWorkspace` |
| [`ui/list-toolbar.tsx`](../ui/list-toolbar.tsx) | 310 | `configureListToolbarClearKeys`, `getListToolbarClearKeys`, `PresetDef`, `ViewOption`, `ViewToggle`, `ViewToggleSkeleton`, `PresetChips`, `KpiStrip` |
| [`ui/page-loading/entity-page-loading.tsx`](../ui/page-loading/entity-page-loading.tsx) | 60 | `EntityPageLoading` |
| [`ui/page-loading/list-page-loading.tsx`](../ui/page-loading/list-page-loading.tsx) | 62 | `ListPageLoading` |
| [`ui/pagination.tsx`](../ui/pagination.tsx) | 57 | `Pagination` |
| [`ui/primitives/avatar.tsx`](../ui/primitives/avatar.tsx) | 34 | `Avatar`, `AvatarFallback` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 37 | `BadgeProps`, `Badge` |
| [`ui/primitives/breadcrumb.tsx`](../ui/primitives/breadcrumb.tsx) | 94 | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/card.tsx`](../ui/primitives/card.tsx) | 45 | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| [`ui/primitives/chart.tsx`](../ui/primitives/chart.tsx) | 318 | `ChartConfig`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle` |
| [`ui/primitives/command.tsx`](../ui/primitives/command.tsx) | 112 | `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator` |
| [`ui/primitives/dialog.tsx`](../ui/primitives/dialog.tsx) | 101 | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` |
| [`ui/primitives/dropdown-menu.tsx`](../ui/primitives/dropdown-menu.tsx) | 188 | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/label.tsx`](../ui/primitives/label.tsx) | 18 | `Label` |
| [`ui/primitives/scroll-area.tsx`](../ui/primitives/scroll-area.tsx) | 42 | `ScrollArea`, `ScrollBar` |
| [`ui/primitives/select.tsx`](../ui/primitives/select.tsx) | 74 | `Select`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem` |
| [`ui/primitives/separator.tsx`](../ui/primitives/separator.tsx) | 27 | `Separator` |
| [`ui/primitives/sheet.tsx`](../ui/primitives/sheet.tsx) | 91 | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle` |
| [`ui/primitives/skeleton.tsx`](../ui/primitives/skeleton.tsx) | 8 | `Skeleton` |
| [`ui/primitives/sonner.tsx`](../ui/primitives/sonner.tsx) | 23 | `Toaster` |
| [`ui/primitives/tabs.tsx`](../ui/primitives/tabs.tsx) | 52 | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| [`ui/pwa/client-error-reporter.tsx`](../ui/pwa/client-error-reporter.tsx) | 63 | `report`, `ClientErrorReporter` |
| [`ui/pwa/register-sw.tsx`](../ui/pwa/register-sw.tsx) | 51 | `RegisterServiceWorker` |
| [`ui/range-filters.tsx`](../ui/range-filters.tsx) | 175 | `RangeFilters` |
| [`ui/search-input.tsx`](../ui/search-input.tsx) | 146 | `SEARCH_DEBOUNCE_MS`, `SearchInput` |
| [`ui/search/global-search-config.ts`](../ui/search/global-search-config.ts) | 33 | `GlobalSearchHit`, `GlobalSearchConfig`, `configureGlobalSearch`, `getGlobalSearchConfig` |
| [`ui/search/global-search-provider.tsx`](../ui/search/global-search-provider.tsx) | 529 | `useGlobalSearch`, `GlobalSearchProvider` |
| [`ui/search/search-history.ts`](../ui/search/search-history.ts) | 75 | `SearchHistory`, `configureSearchHistoryKey`, `loadSearchHistory`, `pushSearchQuery`, `pushRecentHit`, `clearSearchHistory` |
| [`ui/settings/account-settings.tsx`](../ui/settings/account-settings.tsx) | 141 | `AccountSettings` |
| [`ui/settings/agent-profile-settings.tsx`](../ui/settings/agent-profile-settings.tsx) | 184 | `AgentProfileSettings` |
| [`ui/settings/api-keys-settings.tsx`](../ui/settings/api-keys-settings.tsx) | 291 | `ApiKeyItem`, `LinkableUser`, `ApiKeysSettings` |
| [`ui/settings/desktop-background-settings.tsx`](../ui/settings/desktop-background-settings.tsx) | 128 | `DesktopBackgroundSettings` |
| [`ui/settings/desktop-connection-settings.tsx`](../ui/settings/desktop-connection-settings.tsx) | 250 | `DesktopConnectionSettings`, `useIsRemoteDesktopClient` |
| [`ui/settings/desktop-embed-env-panel.tsx`](../ui/settings/desktop-embed-env-panel.tsx) | 258 | `DesktopEmbedEnvPanel` |
| [`ui/settings/desktop-fleet-telemetry-settings.tsx`](../ui/settings/desktop-fleet-telemetry-settings.tsx) | 268 | `DesktopFleetTelemetrySettings` |
| [`ui/settings/desktop-hermes-settings.tsx`](../ui/settings/desktop-hermes-settings.tsx) | 340 | `DesktopHermesSettings` |
| [`ui/settings/desktop-llm-keys.tsx`](../ui/settings/desktop-llm-keys.tsx) | 191 | `DesktopLlmKeys` |
| [`ui/settings/desktop-n8n-settings.tsx`](../ui/settings/desktop-n8n-settings.tsx) | 305 | `DesktopN8nSettings` |
| [`ui/settings/desktop-tunnel.tsx`](../ui/settings/desktop-tunnel.tsx) | 263 | `DesktopTunnel` |
| [`ui/settings/desktop-update-settings.tsx`](../ui/settings/desktop-update-settings.tsx) | 174 | `DesktopUpdateSettings` |
| [`ui/settings/factory-reset-settings.tsx`](../ui/settings/factory-reset-settings.tsx) | 87 | `FactoryResetSettings` |
| [`ui/settings/host-only-settings.tsx`](../ui/settings/host-only-settings.tsx) | 61 | `HostManagedNotice`, `HostOnlySettings` |
| [`ui/settings/locked-config-field.tsx`](../ui/settings/locked-config-field.tsx) | 31 | `LockedConfigField` |
| [`ui/settings/ops-diagnostic-settings.tsx`](../ui/settings/ops-diagnostic-settings.tsx) | 222 | `OpsDiagnosticSettings` |
| [`ui/settings/search-reindex-settings.tsx`](../ui/settings/search-reindex-settings.tsx) | 141 | `SearchReindexSettings` |
| [`ui/workspace/ai-activity-panel-host.tsx`](../ui/workspace/ai-activity-panel-host.tsx) | 20 | `configureAiActivityPanel`, `AiActivityPanelHost` |
| [`ui/workspace/ai-workspace-agent-host.tsx`](../ui/workspace/ai-workspace-agent-host.tsx) | 55 | `AiWorkspaceAgentHost` |
| [`ui/workspace/ai-workspace-banner.tsx`](../ui/workspace/ai-workspace-banner.tsx) | 168 | `AiWorkspaceBanner` |
| [`ui/workspace/keep-alive.tsx`](../ui/workspace/keep-alive.tsx) | 206 | `usePaneHref`, `usePaneActive`, `KeepAliveOutlet`, `invalidateKeepAlive`, `unfreezeKeepAlive` |
| [`ui/workspace/tab-workspace-context.tsx`](../ui/workspace/tab-workspace-context.tsx) | 1136 | `NavigateOptions`, `OpenExternalSiteOpts`, `OpenSupplierSiteOpts`, `TabWorkspaceProvider`, `useTabWorkspace`, `useTabWorkspaceOptional`, `useOpenTab` |
| [`ui/workspace/tab-workspace-host.ts`](../ui/workspace/tab-workspace-host.ts) | 90 | `OpenExternalSiteOpts`, `OpenSupplierSiteOpts`, `TabWorkspaceHost`, `configureTabWorkspaceHost`, `useTabWorkspace`, `useOpenTab`, `useTabWorkspaceOptional`, `normalizeOpenExternalSiteOpts` |
| [`ui/workspace/types.ts`](../ui/workspace/types.ts) | 501 | `PageKind`, `TrailCrumb`, `TabMeta`, `ExternalSiteTabMeta`, `SupplierTabMeta`, `WorkspaceTab`, `WorkspacePersistedState`, `MAX_TABS` |
| [`ui/workspace/use-location-search.tsx`](../ui/workspace/use-location-search.tsx) | 51 | `useLocationSearch` |
| [`ui/workspace/window-chrome-controls.tsx`](../ui/workspace/window-chrome-controls.tsx) | 117 | `WindowChromeControls` |
| [`ui/workspace/workspace-config.ts`](../ui/workspace/workspace-config.ts) | 48 | `ProductDetailCtxAdapter`, `configureSidebarCollapsedKey`, `getSidebarCollapsedKey`, `configureDefaultNewTabHref`, `getDefaultNewTabHref`, `configurePreferCatalogueSelector`, `getPreferCatalogueSelector`, `configureProductDetailCtx` |
| [`ui/workspace/workspace-root.tsx`](../ui/workspace/workspace-root.tsx) | 103 | `WorkspaceRoot` |
| [`ui/workspace/workspace-shell.tsx`](../ui/workspace/workspace-shell.tsx) | 268 | `WorkspaceShell` |
| [`ui/workspace/workspace-tab-bar.tsx`](../ui/workspace/workspace-tab-bar.tsx) | 573 | `configureWorkspaceTabIcons`, `WorkspaceTabBar` |

---

## Détail par fichier

### `src/adapters/nav-shell.ts`

- **Lignes** : 170
- **Exports** : `NavRenderItem`, `NavRenderGroup`, `NavRenderModel`, `NavShellAdapter`, `CreateNavShellAdapterOptions`, `createNavShellAdapter`

Adapter nav shell (Phase I7) — contrat de rendu UI-agnostique.
Marque = `registerBrandNav` uniquement ; pas de hardcode panier/dispatch
dans le kit. React/Next consomme `getRenderModel()` / `subscribe`.

### `src/brand.ts`

- **Lignes** : 51
- **Exports** : `ShellUiBrand`, `configureShellUiBrand`, `getShellUiBrand`, `resetShellUiBrandForTests`, `getShellDesktopApi`

O9 — tokens marque pour shell-ui (desktop API, hosts, titlebar).

### `src/core-nav.ts`

- **Lignes** : 25
- **Exports** : `CORE_NAV_ITEMS`, `coreNavItems`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/index.ts`

- **Lignes** : 93
- **Exports** : `CORE_NAV_ITEMS`, `coreNavItems`, `createNavRegistry`, `mergeNav`, `createNavShellAdapter`, `configureShellUiBrand`, `getShellUiBrand`, `getShellDesktopApi`, `resetShellUiBrandForTests`, `API_SCOPE_FULL`, `API_SCOPE_CRM_READ`, `API_SCOPE_CRM_WRITE`, `API_SCOPE_TASKS_RUN`, `normalizeApiScopes`, `parseApiKeyScopes`, `apiKeyAllowsMethod`, `apiKeyAllowsTasks`, `scopesFromPluginPermissions`, `cn`, `formatDate`, `formatDateTime`, `formatMoney`, `parsePage`, `formatVariationPct`, `formatDeltaMoney`, `variationTone`, `resolvePublicOrigin`, `resolveCookieSecure`, `isLoopbackHost`, `trailForRequestLogs`, `trailForAnalytics`, `trailForLoading`, `trackServer`, `trackServerDebounced`, `reportServerIncident`, `haversineKm`, `thumbUrl`, `optimizeCoverUrl`, `buildCatalogSuspenseKey`, `normalizeTabDocumentUrl`

@creezio/shell-ui — nav + slots (H1.4 / I7) + libs plateforme (O9).
UI React : `@creezio/shell-ui/ui`.

### `src/lib/api-scopes.ts`

- **Lignes** : 81
- **Exports** : `API_SCOPE_FULL`, `API_SCOPE_CRM_READ`, `API_SCOPE_CRM_WRITE`, `API_SCOPE_TASKS_RUN`, `normalizeApiScopes`, `parseApiKeyScopes`, `apiKeyAllowsMethod`, `apiKeyAllowsTasks`, `scopesFromPluginPermissions`

Scopes des clés API publiques (`api_keys.scopes`).
- `full` : accès intégration complet (Hermes, clés UI)
- `crm:read` : GET/HEAD/OPTIONS uniquement
- `crm:write` : lectures + mutations (implique read)
Stockage : chaîne CSV (`crm:read,crm:write`) ou `full`.

### `src/lib/catalog-suspense-key.ts`

- **Lignes** : 15
- **Exports** : `buildCatalogSuspenseKey`

Clé Suspense stable — inclut la vue + filtres actifs (sans recréer page par page). 
export function buildCatalogSuspenseKey(
  sp: Record<string, string | undefined> | undefined,
  resolveView: (raw: string | undefined) => string,
  filterKeys: readonly string[],
): string {
  const view = resolveView(sp?.view);
  const parts: string[] = [view];
  for (const key of filterKeys) {
    const value = (sp?.[key] || "").trim();
    if (value) parts.push(`${key}=${value}`);
  }

### `src/lib/desktop-home-path.ts`

- **Lignes** : 29
- **Exports** : `CRM_HOME_PATH`, `SERVER_COCKPIT_PATH`, `defaultHomePathSync`, `resolveDesktopHomePath`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/lib/geo-distance.ts`

- **Lignes** : 38
- **Exports** : `haversineKm`

Distance géodésique (haversine) — logique pure, testable.

### `src/lib/img.ts`

- **Lignes** : 47
- **Exports** : `thumbUrl`

Réécrit les URLs d'images externes vers leur variante miniature CDN.
Évite de charger des originaux de 20+ Mpx dans des cartes de 300 px.

### `src/lib/keepalive-eviction.ts`

- **Lignes** : 59
- **Exports** : `configureKeepAliveFullscreenMatchers`, `isKeepAliveProtectedKey`, `rankKeepAliveEvictionKeys`

Politique d'éviction keep-alive (pur / testable).
Les panes fullscreen (`/site` + matchers marque) ne sont jamais évincées.

### `src/lib/ops-track.ts`

- **Lignes** : 51
- **Exports** : `ServerOpsLevel`, `ServerOpsEvent`, `trackServer`, `trackServerDebounced`

Boîte noire — émission d'événements ops depuis le SERVEUR Next.
Le serveur tourne en sous-process du main Electron : une ligne
`TF2EVENT {json}` sur stdout est captée par le hook logger du main
(voir `@creezio/observability` initOpsJournal). En mode serveur pur (Docker), la ligne
reste un simple log console — inoffensif.
Volontairement autonome (pas d'import electron/) pour respecter la
frontière de build Next.

### `src/lib/optimize-cover-url.ts`

- **Lignes** : 83
- **Exports** : `optimizeCoverUrl`

Réécrit les URLs de covers (secteurs / catégories) vers une taille vignette.
Les /img/familles.webp locaux sont déjà optimisés — pass-through.

### `src/lib/page-trails.ts`

- **Lignes** : 25
- **Exports** : `TrailCrumb`, `trailForRequestLogs`, `trailForAnalytics`, `trailForLoading`

Trails admin / loading plateforme (O9) — trails métier restent marque. 

export type TrailCrumb = { href?: string; label: string };

export function trailForRequestLogs(): TrailCrumb[] {
  return [
    { href: "/admin/request-logs", label: "Admin" },
    { label: "Logs API / MCP" },
  ];
}

export function trailForAnalytics(): TrailCrumb[] {

### `src/lib/public-origin.ts`

- **Lignes** : 174
- **Exports** : `HeaderReader`, `ResolvedOrigin`, `isLoopbackHost`, `resolvePublicOrigin`, `resolveCookieSecure`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/lib/server-incident.ts`

- **Lignes** : 41
- **Exports** : `reportServerIncident`

Remontée d'incidents serveur (app desktop) vers le collecteur de crash de
l'éditeur — ex. « Meilisearch indisponible alors que la recherche est
sollicitée ». Best-effort, jamais bloquant, dédupliqué (1 envoi max par
type d'incident par heure) pour ne pas inonder le collecteur.
Actif uniquement si TF2_CRASH_ENDPOINT est injecté dans l'environnement
(fait par electron/server-launcher.ts) — en déploiement web classique,
cette fonction est un no-op.

### `src/lib/tab-document-url.ts`

- **Lignes** : 56
- **Exports** : `normalizeTabDocumentUrl`, `isSameTabDocument`, `isSameTabOrigin`

Comparaison d'URL « même document » pour onglets sites externes.
Ignore le hash (soft-nav SPA). Normalise trailing slash sur pathname,
hostname en minuscules, et aligne localhost ↔ 127.0.0.1.
Dupliqué volontairement dans electron/tab-url.ts (rootDir Electron isolé).

### `src/lib/utils.ts`

- **Lignes** : 80
- **Exports** : `cn`, `formatDate`, `formatDateTime`, `formatMoney`, `parsePage`, `formatVariationPct`, `formatDeltaMoney`, `variationTone`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/registry.ts`

- **Lignes** : 78
- **Exports** : `NavRegistry`, `createNavRegistry`, `mergeNav`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/types.ts`

- **Lignes** : 19
- **Exports** : `CoreNavItem`, `NavItem`, `NavSlotId`, `NavSlot`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/app-error-boundary.tsx`

- **Lignes** : 60
- **Exports** : `AppErrorBoundary`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/data-table.tsx`

- **Lignes** : 122
- **Exports** : `DataTable`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/desktop-types.ts`

- **Lignes** : 31
- **Exports** : `DesktopUpdateState`, `DesktopUpdateStatus`

Types bridge desktop (SoT @creezio/shell) — re-export UI pour cutover O9p. 
export type {
  DesktopContentRect,
  DesktopTabLoadState,
  DesktopTabInfo,
} from "@creezio/shell";

 Types update desktop plateforme (O9) — extrait gold TF.

### `ui/desktop/auth-window-chrome.tsx`

- **Lignes** : 52
- **Exports** : `AuthWindowChrome`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/desktop/desktop-bridge.tsx`

- **Lignes** : 88
- **Exports** : `DesktopBridge`, `openExternalSiteFromWorkspace`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/desktop/external-site-slot.tsx`

- **Lignes** : 301
- **Exports** : `ExternalSiteSlotPhase`, `SupplierSlotPhase`, `reduceExternalSiteLoadState`, `reduceSupplierLoadState`, `ExternalSiteSlot`, `SupplierSiteSlot`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/desktop/external-site-surface.ts`

- **Lignes** : 59
- **Exports** : `ExternalSiteSurfaceSignal`, `ExternalSiteSurfaceCommand`, `reduceExternalSiteSurfaceCommand`, `SupplierSurfaceSignal`, `SupplierSurfaceCommand`, `reduceSupplierSurfaceCommand`

Commandes de surface native (WebContentsView) dérivées de l'onglet workspace.
Pur / testable - pas d'Electron.
Quitter un onglet site externe -> showCrm (masquer Chromium).
Entrer / revenir sur un onglet site externe avec electronTabId -> activate.

### `ui/desktop/site-link.tsx`

- **Lignes** : 106
- **Exports** : `SiteLink`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/desktop/window-chrome-controls.tsx`

- **Lignes** : 6
- **Exports** : `WindowChromeControls`

Re-export — source : `src/components/workspace/window-chrome-controls.tsx`.
Conservé aussi sous `desktop/` pour le chemin checklist du port shell.

### `ui/faceted-filters.tsx`

- **Lignes** : 119
- **Exports** : `FacetOption`, `FacetDef`, `FacetedFilters`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/global-search-host.ts`

- **Lignes** : 21
- **Exports** : `GlobalSearchHost`, `configureGlobalSearchHost`, `useGlobalSearch`

Host marque pour GlobalSearch (dépend tab-workspace).

### `ui/global-search.tsx`

- **Lignes** : 67
- **Exports** : `GlobalSearchTrigger`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 137
- **Exports** : `configureShellUiBrand`, `getShellUiBrand`, `getShellDesktopApi`, `resetShellUiBrandForTests`, `configureTabWorkspaceHost`, `useTabWorkspace`, `useTabWorkspaceOptional`, `useOpenTab`, `openExternalSiteFromWorkspace`, `normalizeOpenExternalSiteOpts`, `configureGlobalSearchHost`, `useGlobalSearch`, `TabWorkspaceProvider`, `useTabWorkspaceImpl`, `useTabWorkspaceOptionalImpl`, `useOpenTabImpl`, `TabWorkspaceOpenExternalSiteOpts`, `TabWorkspaceOpenSupplierSiteOpts`, `configureAiActivityPanel`, `AiActivityPanelHost`, `GlobalSearchProvider`, `useGlobalSearchImpl`

@creezio/shell-ui/ui — primitives + shell CRM UI (O9, gold TF).
Consommer via `@creezio/shell-ui/ui`.

### `ui/layout/app-shell.tsx`

- **Lignes** : 59
- **Exports** : `AppShell`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/desktop-update-banner.tsx`

- **Lignes** : 101
- **Exports** : `DesktopUpdateBanner`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/entity-header.tsx`

- **Lignes** : 45
- **Exports** : `EntityHeader`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/page-chrome.tsx`

- **Lignes** : 91
- **Exports** : `PageChrome`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/page-toolbar-context.tsx`

- **Lignes** : 83
- **Exports** : `toolbarKey`, `PageToolbarProvider`, `useRegisterPageToolbar`, `usePageToolbarActions`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/sandbox-banner.tsx`

- **Lignes** : 39
- **Exports** : `SandboxBanner`

Bandeau permanent en environnement sandbox (clone restaurant).
Activé via APP_ENV=sandbox — jamais en prod / client.
Lecture dynamique de process.env pour éviter l'inlining Next au build.

### `ui/layout/section-view-shell.tsx`

- **Lignes** : 74
- **Exports** : `SECTION_VIEW_DYNAMIC`, `SectionViewShellProps`, `SectionViewShell`, `SectionViewLoadingProps`, `SectionViewLoading`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/sidebar-host.ts`

- **Lignes** : 54
- **Exports** : `SidebarNavItem`, `SidebarAdminItem`, `SidebarHost`, `configureSidebar`, `getSidebarHost`, `getSidebarHostOptional`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/layout/sidebar.tsx`

- **Lignes** : 1058
- **Exports** : `Sidebar`, `CrmSidebar`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/lib/ai-screencast-hub.ts`

- **Lignes** : 128
- **Exports** : `ScreencastFrame`, `publishScreencastFrame`, `subscribeScreencast`, `screencastViewerCount`, `clearScreencastFrame`

Hub screencast des espaces IA — côté serveur Next (mémoire process).
L'app desktop POSTe des frames JPEG (base64) via
POST /api/v1/desktop/screencast/frame ; les spectateurs s'abonnent en SSE
via GET /api/v1/tasks/screencast/:aiUserId/stream.
Backpressure : on ne garde QUE la dernière frame par IA. Chaque spectateur
a un slot « latest » écrasé à chaque publication ; la livraison est
planifiée (setImmediate) et n'envoie que la frame la plus récente — un
spectateur lent saute des frames au lieu d'accumuler une file.
Singleton globalThis : survit au HMR dev, simple module en prod.

### `ui/lib/ai-workspace-client.ts`

- **Lignes** : 47
- **Exports** : `aiWorkspaceAvailable`, `openAiWorkspaceView`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/lib/desktop-host.ts`

- **Lignes** : 115
- **Exports** : `DesktopHostInfo`, `getDesktopHostInfo`, `isRemoteDesktopClient`, `FleetActionPayload`, `mirrorFleetAction`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/lib/fleet-tracker-client.ts`

- **Lignes** : 237
- **Exports** : `setFleetTrackerSession`, `trackFleetPageView`, `trackFleetEvent`, `ensureFleetTrackerDom`, `trackFleetCommerce`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/lib/hermes-ui.ts`

- **Lignes** : 115
- **Exports** : `HERMES_WEBUI_SITE_ID`, `HERMES_WEBUI_TAB_TITLE`, `HermesWebuiOpenTarget`, `hermesUnavailableMessage`, `resolveHermesWebuiOpenTarget`, `isHermesWebuiOpenTarget`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/lib/n8n-ui.ts`

- **Lignes** : 116
- **Exports** : `N8N_UI_SITE_ID`, `N8N_UI_TAB_TITLE`, `N8nUiOpenTarget`, `N8nUiOpenFail`, `resolveN8nUiOpenTarget`, `isN8nUiOpenTarget`, `openN8nUiInWorkspace`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/list-toolbar.tsx`

- **Lignes** : 310
- **Exports** : `configureListToolbarClearKeys`, `getListToolbarClearKeys`, `PresetDef`, `ViewOption`, `ViewToggle`, `ViewToggleSkeleton`, `PresetChips`, `KpiStrip`, `AlertChips`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/page-loading/entity-page-loading.tsx`

- **Lignes** : 60
- **Exports** : `EntityPageLoading`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/page-loading/list-page-loading.tsx`

- **Lignes** : 62
- **Exports** : `ListPageLoading`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/pagination.tsx`

- **Lignes** : 57
- **Exports** : `Pagination`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/avatar.tsx`

- **Lignes** : 34
- **Exports** : `Avatar`, `AvatarFallback`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/badge.tsx`

- **Lignes** : 37
- **Exports** : `BadgeProps`, `Badge`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/breadcrumb.tsx`

- **Lignes** : 94
- **Exports** : `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/button.tsx`

- **Lignes** : 45
- **Exports** : `ButtonProps`, `Button`, `buttonVariants`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/card.tsx`

- **Lignes** : 45
- **Exports** : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/chart.tsx`

- **Lignes** : 318
- **Exports** : `ChartConfig`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/command.tsx`

- **Lignes** : 112
- **Exports** : `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/dialog.tsx`

- **Lignes** : 101
- **Exports** : `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogPortal`, `DialogOverlay`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/dropdown-menu.tsx`

- **Lignes** : 188
- **Exports** : `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/input.tsx`

- **Lignes** : 20
- **Exports** : `Input`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/label.tsx`

- **Lignes** : 18
- **Exports** : `Label`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/scroll-area.tsx`

- **Lignes** : 42
- **Exports** : `ScrollArea`, `ScrollBar`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/select.tsx`

- **Lignes** : 74
- **Exports** : `Select`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/separator.tsx`

- **Lignes** : 27
- **Exports** : `Separator`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/sheet.tsx`

- **Lignes** : 91
- **Exports** : `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/skeleton.tsx`

- **Lignes** : 8
- **Exports** : `Skeleton`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/sonner.tsx`

- **Lignes** : 23
- **Exports** : `Toaster`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/tabs.tsx`

- **Lignes** : 52
- **Exports** : `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/pwa/client-error-reporter.tsx`

- **Lignes** : 63
- **Exports** : `report`, `ClientErrorReporter`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/pwa/register-sw.tsx`

- **Lignes** : 51
- **Exports** : `RegisterServiceWorker`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/range-filters.tsx`

- **Lignes** : 175
- **Exports** : `RangeFilters`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/search-input.tsx`

- **Lignes** : 146
- **Exports** : `SEARCH_DEBOUNCE_MS`, `SearchInput`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/search/global-search-config.ts`

- **Lignes** : 33
- **Exports** : `GlobalSearchHit`, `GlobalSearchConfig`, `configureGlobalSearch`, `getGlobalSearchConfig`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/search/global-search-provider.tsx`

- **Lignes** : 529
- **Exports** : `useGlobalSearch`, `GlobalSearchProvider`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/search/search-history.ts`

- **Lignes** : 75
- **Exports** : `SearchHistory`, `configureSearchHistoryKey`, `loadSearchHistory`, `pushSearchQuery`, `pushRecentHit`, `clearSearchHistory`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/account-settings.tsx`

- **Lignes** : 141
- **Exports** : `AccountSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/agent-profile-settings.tsx`

- **Lignes** : 184
- **Exports** : `AgentProfileSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/api-keys-settings.tsx`

- **Lignes** : 291
- **Exports** : `ApiKeyItem`, `LinkableUser`, `ApiKeysSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-background-settings.tsx`

- **Lignes** : 128
- **Exports** : `DesktopBackgroundSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-connection-settings.tsx`

- **Lignes** : 250
- **Exports** : `DesktopConnectionSettings`, `useIsRemoteDesktopClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-embed-env-panel.tsx`

- **Lignes** : 258
- **Exports** : `DesktopEmbedEnvPanel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-fleet-telemetry-settings.tsx`

- **Lignes** : 268
- **Exports** : `DesktopFleetTelemetrySettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-hermes-settings.tsx`

- **Lignes** : 340
- **Exports** : `DesktopHermesSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-llm-keys.tsx`

- **Lignes** : 191
- **Exports** : `DesktopLlmKeys`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-n8n-settings.tsx`

- **Lignes** : 305
- **Exports** : `DesktopN8nSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-tunnel.tsx`

- **Lignes** : 263
- **Exports** : `DesktopTunnel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/desktop-update-settings.tsx`

- **Lignes** : 174
- **Exports** : `DesktopUpdateSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/factory-reset-settings.tsx`

- **Lignes** : 87
- **Exports** : `FactoryResetSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/host-only-settings.tsx`

- **Lignes** : 61
- **Exports** : `HostManagedNotice`, `HostOnlySettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/locked-config-field.tsx`

- **Lignes** : 31
- **Exports** : `LockedConfigField`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/ops-diagnostic-settings.tsx`

- **Lignes** : 222
- **Exports** : `OpsDiagnosticSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/settings/search-reindex-settings.tsx`

- **Lignes** : 141
- **Exports** : `SearchReindexSettings`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/ai-activity-panel-host.tsx`

- **Lignes** : 20
- **Exports** : `configureAiActivityPanel`, `AiActivityPanelHost`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/ai-workspace-agent-host.tsx`

- **Lignes** : 55
- **Exports** : `AiWorkspaceAgentHost`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/ai-workspace-banner.tsx`

- **Lignes** : 168
- **Exports** : `AiWorkspaceBanner`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/keep-alive.tsx`

- **Lignes** : 206
- **Exports** : `usePaneHref`, `usePaneActive`, `KeepAliveOutlet`, `invalidateKeepAlive`, `unfreezeKeepAlive`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/tab-workspace-context.tsx`

- **Lignes** : 1136
- **Exports** : `NavigateOptions`, `OpenExternalSiteOpts`, `OpenSupplierSiteOpts`, `TabWorkspaceProvider`, `useTabWorkspace`, `useTabWorkspaceOptional`, `useOpenTab`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/tab-workspace-host.ts`

- **Lignes** : 90
- **Exports** : `OpenExternalSiteOpts`, `OpenSupplierSiteOpts`, `TabWorkspaceHost`, `configureTabWorkspaceHost`, `useTabWorkspace`, `useOpenTab`, `useTabWorkspaceOptional`, `normalizeOpenExternalSiteOpts`, `openExternalSiteFromWorkspace`

Host marque pour le tab-workspace (nav / surfaces métier reste marque).
O9 — injection ; pas de jumeau.
Capacité native = ouvrir un **site externe** (onglet), pas un « fournisseur ».
Les libellés métier (Fournisseur, Outil, …) = config/UI marque.

### `ui/workspace/types.ts`

- **Lignes** : 501
- **Exports** : `PageKind`, `TrailCrumb`, `TabMeta`, `ExternalSiteTabMeta`, `SupplierTabMeta`, `WorkspaceTab`, `WorkspacePersistedState`, `MAX_TABS`, `MAX_KEEPALIVE`, `configureWorkspaceStorageKey`, `DASHBOARD_PATH`, `TF_LEGACY_PANIER_PATH`, `TF_LEGACY_OPTIMISER_PATH`, `configureFullscreenPaths`, `isDashboardHref`, `isWorkspaceTabLocked`, `normalizeHref`, `configureEntityRouteRoots`, `pageKindFromHref`, `configureSectionLabels`, `configureEntityLabels`, `titleFromHref`, `isOptimiserCanvasHref`, `isFullscreenHref`, `isExternalSiteHref`, `isSupplierHref`, `siteIdFromHref`, `fournisseurIdFromHref`, `externalSiteHref`, `supplierHref`, `createExternalSiteTab`, `isWorkspacePath`, `newTabId`, `createTab`, `resolvePageKind`, `applyTabMeta`, `ensureTabHistory`, `createSupplierTab`, `samePathname`, `shouldOpenLockedNavigationInNewTab`

Type de page CRM — standard unique.
- section : listes (toolbar recherche + titre + actions sous les onglets)
- entity  : fiches détail (fil d'Ariane sticky ; titre via EntityHeader)

### `ui/workspace/use-location-search.tsx`

- **Lignes** : 51
- **Exports** : `useLocationSearch`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/window-chrome-controls.tsx`

- **Lignes** : 117
- **Exports** : `WindowChromeControls`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/workspace-config.ts`

- **Lignes** : 48
- **Exports** : `ProductDetailCtxAdapter`, `configureSidebarCollapsedKey`, `getSidebarCollapsedKey`, `configureDefaultNewTabHref`, `getDefaultNewTabHref`, `configurePreferCatalogueSelector`, `getPreferCatalogueSelector`, `configureProductDetailCtx`, `getProductDetailCtxAdapter`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/workspace-root.tsx`

- **Lignes** : 103
- **Exports** : `WorkspaceRoot`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/workspace-shell.tsx`

- **Lignes** : 268
- **Exports** : `WorkspaceShell`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/workspace/workspace-tab-bar.tsx`

- **Lignes** : 573
- **Exports** : `configureWorkspaceTabIcons`, `WorkspaceTabBar`

_(pas de cartouche JSDoc en tête — voir le code)_

