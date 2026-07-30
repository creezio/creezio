# @creezio/electron-shell — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/electron-shell/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/admin-window.ts`](../src/admin-window.ts) | 99 | `adminWindowVisible`, `openAdminWindow`, `closeAdminWindow` |
| [`src/boot.ts`](../src/boot.ts) | 109 | `DesktopBootContext`, `PrepareDesktopBootOptions`, `prepareDesktopBoot`, `writeAppKindFile` |
| [`src/desktop/assistant-chrome.ts`](../src/desktop/assistant-chrome.ts) | 214 | `ASSISTANT_FAB_SIZE_PX`, `ASSISTANT_FAB_MARGIN_PX`, `AssistantChromeMode`, `ContentRect`, `AssistantChromeBrand`, `assistantFabScreenRect`, `rectsOverlap`, `AssistantChromeOverlay` |
| [`src/desktop/brand-desktop-runtime.ts`](../src/desktop/brand-desktop-runtime.ts) | 4031 | `BrandDesktopHosts`, `BrandDesktopPaths`, `BrandDesktopVertical`, `BrandDesktopDeps`, `installBrandDesktopRuntime` |
| [`src/desktop/error-page-html.ts`](../src/desktop/error-page-html.ts) | 119 | `ErrorPageBrand`, `errorPageHtmlDocument`, `errorPageDataUrl` |
| [`src/desktop/oauth-loopback.ts`](../src/desktop/oauth-loopback.ts) | 195 | `GoogleTokens`, `GoogleOAuthTokenStore`, `GoogleOAuthLoopbackOptions`, `googleLoginLoopback`, `storedGoogleTokens` |
| [`src/desktop/profile-picker-html.ts`](../src/desktop/profile-picker-html.ts) | 257 | `PickerRememberedServer`, `ProfilePickerBrand`, `profilePickerHtml` |
| [`src/factory-reset-runtime.ts`](../src/factory-reset-runtime.ts) | 90 | `wipeLocalUserData`, `factoryResetSessionPartition` |
| [`src/host/ai-workspace/actions.ts`](../src/host/ai-workspace/actions.ts) | 274 | `executeAiWorkspaceAction`, `isAiWorkspaceActionType` |
| [`src/host/ai-workspace/bindings.ts`](../src/host/ai-workspace/bindings.ts) | 99 | `AiWorkspaceHostBindings`, `configureAiWorkspaceHost`, `getAiWorkspaceHostBindings`, `tryGetAiWorkspaceHostBindings`, `__resetAiWorkspaceHostBindingsForTests`, `aiShareWebSessions`, `aiPartitionName`, `aiSupplierPartitionPrefix` |
| [`src/host/ai-workspace/index.ts`](../src/host/ai-workspace/index.ts) | 47 | `__resetAiWorkspaceHostBindingsForTests`, `aiPartitionName`, `aiShareWebSessions`, `aiSupplierPartitionPrefix`, `configureAiWorkspaceHost`, `getAiWorkspaceHostBindings`, `tryGetAiWorkspaceHostBindings`, `AiProfileWindow` |
| [`src/host/ai-workspace/manager.ts`](../src/host/ai-workspace/manager.ts) | 616 | `AiWorkspacePresentation`, `AiWorkspaceInfo`, `AiWorkspaceManagerOptions`, `AiWorkspaceUiActionRequest`, `AiWorkspaceManager`, `aiSupplierPartitionPrefix`, `aiShareWebSessions` |
| [`src/host/ai-workspace/profile-window.ts`](../src/host/ai-workspace/profile-window.ts) | 126 | `AiProfileWindowOptions`, `AiProfileWindow` |
| [`src/host/ai-workspace/screencast.ts`](../src/host/ai-workspace/screencast.ts) | 289 | `PostFrameResult`, `AiScreencasterOptions`, `AiScreencaster` |
| [`src/host/ai-workspace/types.ts`](../src/host/ai-workspace/types.ts) | 44 | `AiTabInfo`, `AiSupplierTab`, `AiSupplierTabsLike`, `AiSupplierTabsFactory`, `SupplierActionRequest` |
| [`src/host/brand-host-runtime.ts`](../src/host/brand-host-runtime.ts) | 431 | `BrandRuntimePaths`, `BrandTunnelProvisionInput`, `BrandFleetInput`, `BrandHostRuntimeConfig`, `resolveTunnelProvision`, `createHermesCrmKeyPaths`, `createN8nAgentKeysHooks`, `createHermesCrmOnlyBridgeEnv` |
| [`src/host/brand-host-stack.ts`](../src/host/brand-host-stack.ts) | 346 | `BrandHostPathsModule`, `BrandLocalConfigStoreLike`, `BrandHostStackConfig`, `createBrandHostStack`, `BrandHostStack` |
| [`src/host/bridge-client.ts`](../src/host/bridge-client.ts) | 184 | `BridgeOptions`, `BridgeClient` |
| [`src/host/browser-tabs/browser-tab-driver.ts`](../src/host/browser-tabs/browser-tab-driver.ts) | 633 | `captureScreenshot`, `SupplierActionRequest`, `SupplierActionHooks`, `executeSupplierAction` |
| [`src/host/browser-tabs/browser-tab-manager.ts`](../src/host/browser-tabs/browser-tab-manager.ts) | 847 | `BrowserTabManagerDeps`, `configureBrowserTabs`, `TabInfo`, `TabLoadState`, `ContentRect`, `BrowserTab`, `SupplierTab`, `resolvePartitionId` |
| [`src/host/browser-tabs/browser-tab-preload-path.ts`](../src/host/browser-tabs/browser-tab-preload-path.ts) | 12 | `browserTabPreloadPath` |
| [`src/host/browser-tabs/browser-tab-preload.ts`](../src/host/browser-tabs/browser-tab-preload.ts) | 12 | — |
| [`src/host/browser-tabs/chrome-ua.ts`](../src/host/browser-tabs/chrome-ua.ts) | 41 | `CHROME_UA`, `installUserAgent` |
| [`src/host/browser-tabs/fake-cursor-inject.ts`](../src/host/browser-tabs/fake-cursor-inject.ts) | 149 | `FAKE_CURSOR_INJECT` |
| [`src/host/browser-tabs/index.ts`](../src/host/browser-tabs/index.ts) | 41 | `configureBrowserTabs`, `SupplierTabManager`, `BrowserTabManager`, `executeSupplierAction`, `captureScreenshot`, `reduceTabNativeLoadState`, `normalizeTabDocumentUrl`, `isSameTabDocument` |
| [`src/host/browser-tabs/tab-load-state.ts`](../src/host/browser-tabs/tab-load-state.ts) | 78 | `TabLoadPhase`, `TabLoadSignal`, `reduceTabNativeLoadState` |
| [`src/host/browser-tabs/tab-url.ts`](../src/host/browser-tabs/tab-url.ts) | 53 | `normalizeTabDocumentUrl`, `isSameTabDocument`, `isSameTabOrigin` |
| [`src/host/context.ts`](../src/host/context.ts) | 83 | `HostLogFn`, `TunnelProvisionConfig`, `HostRuntimeContext`, `hostProductName`, `hostLog` |
| [`src/host/contracts.ts`](../src/host/contracts.ts) | 62 | `HostProcessHandle`, `HermesLaunchRequest`, `N8nLaunchRequest`, `TunnelLaunchRequest`, `buildEmbedHostEnv`, `cloudflaredEnvKey`, `DEFAULT_HOST_ONLY_ELECTRON_MODULES` |
| [`src/host/crash-reporter.ts`](../src/host/crash-reporter.ts) | 237 | `CrashReporterConfig`, `configureCrashReporter`, `setBootStage`, `getBootStage`, `getBootTimeline`, `initCrashReporter`, `crashEndpoint`, `getInstallId` |
| [`src/host/feature-off-host.ts`](../src/host/feature-off-host.ts) | 253 | `FeatureOffHostOptions`, `FeatureOffPluginsStatus`, `FeatureOffPluginsHost`, `FeatureOffPluginControlExtras`, `FeatureOffPluginTestsHost`, `FeatureOffPluginAcceptHost`, `FeatureOffFleetAgentHost`, `FeatureOffFleetSamplesHost` |
| [`src/host/hermes/crm-key.ts`](../src/host/hermes/crm-key.ts) | 190 | `HermesCrmKeyBrand`, `HermesCrmKeyStored`, `HermesCrmKeyPaths`, `hermesCrmKeyPath`, `readHermesCrmApiKey`, `writeHermesCrmApiKey`, `generateHermesCrmApiKey`, `getHermesFullBridgeEnv` |
| [`src/host/hermes/ensure-crm-key-db.ts`](../src/host/hermes/ensure-crm-key-db.ts) | 111 | — |
| [`src/host/hermes/launcher.ts`](../src/host/hermes/launcher.ts) | 1166 | `RunningHermes`, `StartHermesOptions`, `HermesStatusPayload`, `HermesHost`, `clearGeneratedWebuiPassword`, `clearTempoflowGeneratedWebuiPassword`, `createHermesHost` |
| [`src/host/hermes/runtime-bootstrap.ts`](../src/host/hermes/runtime-bootstrap.ts) | 872 | `BootstrapPhase`, `RuntimeManifest`, `getBootstrapPhase`, `getBootstrapError`, `hermesVendorDir`, `loadRuntimeManifest`, `vendoredInstallScriptPath`, `hermesRuntimeCacheDir` |
| [`src/host/host-stack.ts`](../src/host/host-stack.ts) | 61 | `HostStack`, `createHostStack`, `lazyHost` |
| [`src/host/load-electron.ts`](../src/host/load-electron.ts) | 16 | `loadElectron` |
| [`src/host/local-config.ts`](../src/host/local-config.ts) | 781 | `LocalAuth`, `TunnelConfig`, `LocalConfigPath`, `LocalConfigStoreOptions`, `LocalConfigStore`, `createLocalConfigStore`, `createLocalConfigStoreSync` |
| [`src/host/meili-launcher.ts`](../src/host/meili-launcher.ts) | 153 | `RunningMeili`, `StartMeiliOptions`, `startMeili` |
| [`src/host/meili/coherence-db.ts`](../src/host/meili/coherence-db.ts) | 176 | `GedSqlCounts`, `countCatalogSql`, `countGedSql`, `readSqliteSchemaVersion`, `readFingerprintFromDb`, `writeFingerprintToDb`, `buildFingerprint`, `MeiliIndexInProgress` |
| [`src/host/meili/coherence-query.ts`](../src/host/meili/coherence-query.ts) | 26 | — |
| [`src/host/meili/coherence.ts`](../src/host/meili/coherence.ts) | 172 | `MeiliCoherencePaths`, `configureMeiliCoherencePaths`, `MeiliReadyDecision`, `decideMeiliReady`, `INDEX_SCHEMA_VERSION` |
| [`src/host/meili/index-schema.ts`](../src/host/meili/index-schema.ts) | 123 | `INDEX_SCHEMA_VERSION`, `MEILI_FINGERPRINT_META_KEY`, `MEILI_INDEX_IN_PROGRESS_KEY`, `CATALOG_INDEXES`, `CatalogIndexUid`, `GED_INDEXES`, `GedIndexUid`, `MeiliCatalogSqlTables` |
| [`src/host/meili/index.ts`](../src/host/meili/index.ts) | 45 | `CATALOG_INDEXES`, `GED_INDEXES`, `INDEX_SCHEMA_VERSION`, `MEILI_FINGERPRINT_META_KEY`, `MEILI_INDEX_IN_PROGRESS_KEY`, `configureMeiliCatalogSqlTables`, `expectedMeiliCounts`, `getMeiliCatalogSqlTables` |
| [`src/host/meili/indexer.ts`](../src/host/meili/indexer.ts) | 821 | `runIndexation` |
| [`src/host/n8n/agent-isolation.ts`](../src/host/n8n/agent-isolation.ts) | 255 | `N8nAgentIsolationBrand`, `N8nAgentKeyStored`, `N8nAgentKeysFile`, `agentIdSegment`, `n8nAgentKeyLabel`, `n8nAgentTag`, `n8nAgentKeysPath`, `readStoredN8nAgentKeys` |
| [`src/host/n8n/api-key.ts`](../src/host/n8n/api-key.ts) | 351 | `N8N_HERMES_API_SCOPES`, `N8nApiKeyBrand`, `N8nApiKeyStored`, `n8nApiKeyPath`, `readStoredN8nApiKey`, `writeStoredN8nApiKey`, `cookieHeaderFromSetCookie`, `n8nHttpJson` |
| [`src/host/n8n/launcher.ts`](../src/host/n8n/launcher.ts) | 1255 | `RunningN8n`, `StartN8nOptions`, `N8nAgentKeysHooks`, `N8nStatusPayload`, `N8nHost`, `createN8nHost` |
| [`src/host/n8n/runtime-bootstrap.ts`](../src/host/n8n/runtime-bootstrap.ts) | 325 | `N8nBootstrapPhase`, `N8nRuntimeManifest`, `getN8nBootstrapPhase`, `getN8nBootstrapError`, `n8nVendorDir`, `loadN8nRuntimeManifest`, `n8nRuntimeCacheDir`, `n8nPackageJsonPath` |
| [`src/host/node-runtime.ts`](../src/host/node-runtime.ts) | 282 | `DESKTOP_NODE_PIN`, `DESKTOP_NODE_MIN_FOR_EMBEDS`, `TF2_NODE_PIN`, `TF2_NODE_MIN_FOR_EMBEDS`, `NodeVersionTriple`, `parseNodeVersion`, `compareNodeVersions`, `nodeSatisfiesMin` |
| [`src/host/npm-cli.ts`](../src/host/npm-cli.ts) | 263 | `DESKTOP_NPM_PIN`, `TF2_NPM_PIN`, `EnsureNpmCliResult`, `npmUserDataRoot`, `npmCliCandidates`, `resolveNpmCliPath`, `ensureNpmCli`, `runNpmCli` |
| [`src/host/plugins/accept-check.ts`](../src/host/plugins/accept-check.ts) | 211 | `AcceptCheckItem`, `AcceptCheckResult`, `resolvePluginSmokes`, `runPluginAcceptCheck` |
| [`src/host/plugins/brand-bindings.ts`](../src/host/plugins/brand-bindings.ts) | 190 | `PluginLlmKeys`, `PluginHostBindings`, `configurePluginHost`, `getPluginHostBindings`, `tryGetPluginHostBindings`, `__resetPluginHostBindingsForTests`, `pluginEnvKeys`, `assignPluginEnv` |
| [`src/host/plugins/control-adapters.ts`](../src/host/plugins/control-adapters.ts) | 114 | `buildPluginControlPlaneAdapters` |
| [`src/host/plugins/control-extras.ts`](../src/host/plugins/control-extras.ts) | 461 | `PLUGIN_CONTROL_PREFERRED_PORT`, `PluginControlApiState`, `getPluginControlApi`, `getPluginControlBridgeEnv`, `migratePluginData`, `archivePluginRuntime`, `createPluginExecutionGrant`, `validatePluginExecutionGrant` |
| [`src/host/plugins/control-plane.ts`](../src/host/plugins/control-plane.ts) | 184 | `StartHostPluginControlPlaneOptions`, `startHostPluginControlPlane` |
| [`src/host/plugins/control-token.ts`](../src/host/plugins/control-token.ts) | 110 | `pluginControlTokenFile`, `pluginControlTokenPrefix`, `PluginControlTokenStored`, `pluginControlTokenPath`, `readPluginControlToken`, `writePluginControlToken`, `generatePluginControlToken`, `ensurePluginControlToken` |
| [`src/host/plugins/crm-key.ts`](../src/host/plugins/crm-key.ts) | 167 | `PluginCrmKeyStored`, `pluginCrmKeyPath`, `readPluginCrmApiKey`, `ensurePluginCrmApiKey`, `PLUGIN_CRM_KEY_FILE` |
| [`src/host/plugins/data.ts`](../src/host/plugins/data.ts) | 121 | `PluginDataMigrationReport`, `applyPluginDataMigrations`, `runPluginDataCli` |
| [`src/host/plugins/events.ts`](../src/host/plugins/events.ts) | 20 | `PLUGIN_RUNTIME_FILE`, `PLUGIN_SITE_ID_BASE`, `PLUGIN_SITE_ID_SPAN`, `pluginAcceptsHook`, `pluginHookUrl`, `pluginN8nWebhookUrl`, `pluginRuntimePath`, `pluginSiteId` |
| [`src/host/plugins/execution-grant.ts`](../src/host/plugins/execution-grant.ts) | 12 | `issuePluginExecutionGrant`, `verifyPluginExecutionGrant` |
| [`src/host/plugins/git.ts`](../src/host/plugins/git.ts) | 441 | `PluginGitCommit`, `PluginGitStatus`, `resetGitBinaryCache`, `resolveGitBinary`, `isPluginGitRepo`, `bumpPluginManifestPatch`, `ensurePluginGitRepo`, `commitPluginChanges` |
| [`src/host/plugins/host.ts`](../src/host/plugins/host.ts) | 222 | `RunningPlugin`, `PluginsHost`, `createPluginsHost`, `PLUGIN_VERTICAL_REMAINING` |
| [`src/host/plugins/launcher.ts`](../src/host/plugins/launcher.ts) | 654 | `RunningPlugin`, `setPluginsCrmPort`, `getPluginsCrmPort`, `listPlugins`, `getPluginLogs`, `getRunningPlugins`, `startEnabledPlugins`, `stopAllPlugins` |
| [`src/host/plugins/runtime.ts`](../src/host/plugins/runtime.ts) | 489 | `pluginsRootDir`, `discoverPlugins`, `scaffoldPluginUiCss`, `scaffoldPlugin`, `PLUGIN_MANIFEST_FILE`, `hasPluginPermission`, `isValidPluginId`, `parsePluginManifest` |
| [`src/host/plugins/test-runner.ts`](../src/host/plugins/test-runner.ts) | 130 | `PluginTestResult`, `runPluginTests` |
| [`src/host/safe-storage.ts`](../src/host/safe-storage.ts) | 68 | `SafeStorageBackend`, `loadElectronSafeStorage`, `loadElectronSafeStorageSync`, `canEncrypt`, `sealValue`, `openValue` |
| [`src/host/sandbox/embed-sandbox.ts`](../src/host/sandbox/embed-sandbox.ts) | 388 | `setSandboxEnvVar`, `ensureSandboxGitConfig`, `DESKTOP_SANDBOX_MARKER_BEGIN`, `DESKTOP_SANDBOX_MARKER_END`, `hermesSandboxPaths`, `desktopSandboxPaths`, `applyOsSandboxEnv`, `buildHermesSandboxYamlBlock` |
| [`src/host/sandbox/os-sandbox.ts`](../src/host/sandbox/os-sandbox.ts) | 134 | `overridesAllowed`, `resolveSystemBinary`, `buildConfinedPath` |
| [`src/host/server-env.ts`](../src/host/server-env.ts) | 119 | `RunningServer`, `StartServerPaths`, `StartServerCoreOptions`, `startNextServerCore`, `findFreePort`, `waitForHealth` |
| [`src/host/server-launcher.ts`](../src/host/server-launcher.ts) | 93 | `BrandServerLauncherDeps`, `StartBrandServerOptions`, `startBrandNextServer`, `ServerSpawnFn`, `findFreePort`, `waitForHealth` |
| [`src/host/tunnel/tunnel.ts`](../src/host/tunnel/tunnel.ts) | 408 | `TunnelRuntimeStatus`, `TunnelIngressPorts`, `TunnelService`, `createTunnelService`, `buildTunnelPublicUrls`, `deriveTunnelServiceUrl` |
| [`src/host/web-telemetry.ts`](../src/host/web-telemetry.ts) | 108 | `instrumentWebContents` |
| [`src/index.ts`](../src/index.ts) | 677 | `initLogger`, `log`, `logError`, `logFilePath`, `getLogRing`, `recentLines`, `logFileTail`, `scoped` |
| [`src/logger.ts`](../src/logger.ts) | 208 | `setOpsLineHandler`, `initLogger`, `logFilePath`, `log`, `logError`, `recentLines`, `getLogRing`, `logFileTail` |
| [`src/main-facade.ts`](../src/main-facade.ts) | 154 | `CreateHostRuntimeOptions`, `pathsContextFromBoot`, `createHostRuntime`, `prepareHostDesktop`, `localConfigPathForBoot`, `vendorDir` |
| [`src/splash-ui.ts`](../src/splash-ui.ts) | 543 | `SplashStepStatus`, `SplashStepId`, `SplashStepView`, `SplashViewModel`, `SPLASH_STEP_WEIGHTS`, `formatElapsedMs`, `sanitizeSplashDetail`, `estimateEmbedPercent` |
| [`src/tray.ts`](../src/tray.ts) | 203 | `TrayAiWorkspaceEntry`, `TrayControllerOptions`, `TrayController`, `installCloseToTray`, `applyLaunchAtStartup` |
| [`src/updater.ts`](../src/updater.ts) | 320 | `UpdaterSend`, `SetupAutoUpdaterOptions`, `getUpdaterStatus`, `checkForUpdatesNow`, `downloadAndInstallUpdate`, `registerUpdateIpc`, `setupAutoUpdater`, `setUpdaterRenderer` |
| [`src/window-chrome.ts`](../src/window-chrome.ts) | 99 | `windowChromeBarHtml`, `windowChromeCss`, `windowChromeJs` |

---

## Détail par fichier

### `src/admin-window.ts`

- **Lignes** : 99
- **Exports** : `adminWindowVisible`, `openAdminWindow`, `closeAdminWindow`

Fenêtre « app admin » (cockpit serveur → /dashboard).
Port paramétré de electron/admin-window.ts.

### `src/boot.ts`

- **Lignes** : 109
- **Exports** : `DesktopBootContext`, `PrepareDesktopBootOptions`, `prepareDesktopBoot`, `writeAppKindFile`

Façade boot Electron plateforme — structure générique (pas le métier).
Les apps marques appellent `prepareDesktopBoot(manifest)` **avant**
`app.requestSingleInstanceLock()` pour isoler userData Client/Serveur.
Le monolithe main.ts (catalogue, tabs fournisseurs, Hermes…) reste vertical.

### `src/desktop/assistant-chrome.ts`

- **Lignes** : 214
- **Exports** : `ASSISTANT_FAB_SIZE_PX`, `ASSISTANT_FAB_MARGIN_PX`, `AssistantChromeMode`, `ContentRect`, `AssistantChromeBrand`, `assistantFabScreenRect`, `rectsOverlap`, `AssistantChromeOverlay`

// @ts-nocheck — Electron BaseWindow / WebContentsView (shim kit mince)
Chrome assistant Electron (FAB) — gold TempoFlow paramétré (deepLink / title).
Electron chargé via loadElectron (pas d'import top-level — tests kit Node).

### `src/desktop/brand-desktop-runtime.ts`

- **Lignes** : 4031
- **Exports** : `BrandDesktopHosts`, `BrandDesktopPaths`, `BrandDesktopVertical`, `BrandDesktopDeps`, `installBrandDesktopRuntime`

Runtime desktop plateforme — extrait mécanique de tempoflow2/crm/electron/main.ts (M12).
Comportement préservé ; la marque injecte deps (store, hosts, paths, vertical).

### `src/desktop/error-page-html.ts`

- **Lignes** : 119
- **Exports** : `ErrorPageBrand`, `errorPageHtmlDocument`, `errorPageDataUrl`

Écran d’erreur boot / crash (hors React) — gold TempoFlow paramétré.

### `src/desktop/oauth-loopback.ts`

- **Lignes** : 195
- **Exports** : `GoogleTokens`, `GoogleOAuthTokenStore`, `GoogleOAuthLoopbackOptions`, `googleLoginLoopback`, `storedGoogleTokens`

// @ts-nocheck — Electron shell.openExternal (shim kit mince)
OAuth 2.0 RFC 8252 (native apps) Google — gold TempoFlow paramétré.
Store tokens injecté ; Electron via loadElectron (pas d'import top-level).

### `src/desktop/profile-picker-html.ts`

- **Lignes** : 257
- **Exports** : `PickerRememberedServer`, `ProfilePickerBrand`, `profilePickerHtml`

Écran de profils au boot — gold TempoFlow paramétré (brand / bridge / tunnel).

### `src/factory-reset-runtime.ts`

- **Lignes** : 90
- **Exports** : `wipeLocalUserData`, `factoryResetSessionPartition`

Wipe factory-reset (sessions Electron + chemins).
Les cibles fichiers viennent de @creezio/platform-core.

### `src/host/ai-workspace/actions.ts`

- **Lignes** : 274
- **Exports** : `executeAiWorkspaceAction`, `isAiWorkspaceActionType`

// @ts-nocheck — IPC WebContents + hooks marque
Exécuteur bridge des actions `ai_workspace_*` (N2 kit).
Route vers AiWorkspaceManager (+ supplier-tabs marque via bindings).

### `src/host/ai-workspace/bindings.ts`

- **Lignes** : 99
- **Exports** : `AiWorkspaceHostBindings`, `configureAiWorkspaceHost`, `getAiWorkspaceHostBindings`, `tryGetAiWorkspaceHostBindings`, `__resetAiWorkspaceHostBindingsForTests`, `aiShareWebSessions`, `aiPartitionName`, `aiSupplierPartitionPrefix`

Injection marque pour ai-workspace (N2).
Partitions / cookies / titres fenêtre — zéro hardcode TempoFlow.

### `src/host/ai-workspace/index.ts`

- **Lignes** : 47
- **Exports** : `__resetAiWorkspaceHostBindingsForTests`, `aiPartitionName`, `aiShareWebSessions`, `aiSupplierPartitionPrefix`, `configureAiWorkspaceHost`, `getAiWorkspaceHostBindings`, `tryGetAiWorkspaceHostBindings`, `AiProfileWindow`, `AiWorkspaceManager`, `AiScreencaster`, `executeAiWorkspaceAction`, `isAiWorkspaceActionType`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/host/ai-workspace/manager.ts`

- **Lignes** : 616
- **Exports** : `AiWorkspacePresentation`, `AiWorkspaceInfo`, `AiWorkspaceManagerOptions`, `AiWorkspaceUiActionRequest`, `AiWorkspaceManager`, `aiSupplierPartitionPrefix`, `aiShareWebSessions`

// @ts-nocheck — Electron session/WebContentsView (shim kit mince)
Espaces workspace dédiés aux collaborateurs IA sur le host Electron.
Chaque IA a :
- une WebContentsView CRM (partition `persist:{aiPartitionSlug}-<userId>`) avec JWT persona ;
- son propre manager onglets (partitions isolées marque) ;
- un TabWorkspaceProvider React isolé (sessionStorage de la partition).

### `src/host/ai-workspace/profile-window.ts`

- **Lignes** : 126
- **Exports** : `AiProfileWindowOptions`, `AiProfileWindow`

// @ts-nocheck
Fenêtre profil collaborateur IA (P2 multi-profils, décision Q1 : in-process).
Une BaseWindow dédiée par IA — « {productName} — <nom IA> » — qui porte la
WebContentsView CRM persona + les onglets web de son SupplierTabManager,
en PARALLÈLE de la fenêtre owner (jamais de masquage croisé).

### `src/host/ai-workspace/screencast.ts`

- **Lignes** : 289
- **Exports** : `PostFrameResult`, `AiScreencasterOptions`, `AiScreencaster`

// @ts-nocheck
Screencast des espaces IA — vue live à distance (lecture seule).
Capture CDP `Page.startScreencast` (JPEG q55, 1280×800, everyNthFrame:2)
sur la surface active de l'IA : son onglet web actif, sinon sa vue CRM.
Chaque frame est ACKée immédiatement (`Page.screencastFrameAck` — sinon
Chromium arrête d'en émettre), puis POSTée au serveur local (throttle

### `src/host/ai-workspace/types.ts`

- **Lignes** : 44
- **Exports** : `AiTabInfo`, `AiSupplierTab`, `AiSupplierTabsLike`, `AiSupplierTabsFactory`, `SupplierActionRequest`

Contrats mince pour découpler ai-workspace du métier supplier-tabs marque.
N2 — extraction TF gold.

### `src/host/brand-host-runtime.ts`

- **Lignes** : 431
- **Exports** : `BrandRuntimePaths`, `BrandTunnelProvisionInput`, `BrandFleetInput`, `BrandHostRuntimeConfig`, `resolveTunnelProvision`, `createHermesCrmKeyPaths`, `createN8nAgentKeysHooks`, `createHermesCrmOnlyBridgeEnv`, `createHermesCrmKeySurface`, `createBrandHostRuntimeContext`, `BrandHostSingletons`, `createBrandHostRuntime`, `brandEnsureCrmKeyDbScript`

Factories host-runtime-ctx marque (O7) — singletons, fleet, CRM key surface,
contexte HostRuntimeContext. Les brand opts restent dans la marque.

### `src/host/brand-host-stack.ts`

- **Lignes** : 346
- **Exports** : `BrandHostPathsModule`, `BrandLocalConfigStoreLike`, `BrandHostStackConfig`, `createBrandHostStack`, `BrandHostStack`

Lazy host-stack marque — composition mince du kit (O7).
Remplace ~220 LOC dupliqués TF/CV/Fidu par une factory + table de config.

### `src/host/bridge-client.ts`

- **Lignes** : 184
- **Exports** : `BridgeOptions`, `BridgeClient`

Pont serveur local ↔ Electron pour le pilotage bot des onglets fournisseurs.
- S'authentifie auprès du serveur Next local (POST /api/v1/auth/login avec
  les credentials bootstrappés) et conserve le cookie de session.
- S'abonne au flux SSE GET /api/v1/assistant/supplier-actions/stream
  (nouvelle route — voir src/server/routes/assistant.ts dans le fork).
- Pour chaque événement `supplier_action`, exécute l'action via
  supplier-driver puis POST le résultat sur la route EXISTANTE
  /api/v1/assistant/ui-actions/:id/result (résout la promesse serveur).
- Reconnexion automatique avec backoff.

### `src/host/browser-tabs/browser-tab-driver.ts`

- **Lignes** : 633
- **Exports** : `captureScreenshot`, `SupplierActionRequest`, `SupplierActionHooks`, `executeSupplierAction`

// @ts-nocheck — Electron WebContents/session (shim kit mince, N7)
Exécuteur des actions `external_*` (alias déprécié `supplier_*`) sur
les onglets sites externes.
Architecture hybride (portage de src/components/assistant/ui-driver.tsx) :
- ÉNUMÉRATION / RÉSOLUTION des cibles : JavaScript exécuté dans un MONDE
  ISOLÉ de la page (executeJavaScriptInIsolatedWorld) — même logique que

### `src/host/browser-tabs/browser-tab-manager.ts`

- **Lignes** : 847
- **Exports** : `BrowserTabManagerDeps`, `configureBrowserTabs`, `TabInfo`, `TabLoadState`, `ContentRect`, `BrowserTab`, `SupplierTab`, `resolvePartitionId`, `SupplierTabManagerOptions`, `SupplierTabManager`, `BrowserTabManager`

// @ts-nocheck — Electron WebContents/session (shim kit mince, N7)
Onglets sites externes : une WebContentsView par onglet, chacune dans une
partition persistante `persist:fournisseur-<id>` (cookies/sessions isolés
par outil, conservés entre les lancements).
Layout : la vue UI CRM occupe toute la fenêtre ; la vue site active
n'occupe QUE la content area du workspace (`ContentRect` : x, y, width,

### `src/host/browser-tabs/browser-tab-preload-path.ts`

- **Lignes** : 12
- **Exports** : `browserTabPreloadPath`

Chemin absolu du preload onglet kit (O1 — plus de façade marque).
Consommé en CJS Electron (`dist-cjs`) — `__dirname` = dossier émis.

### `src/host/browser-tabs/browser-tab-preload.ts`

- **Lignes** : 12

Preload onglet navigateur (WebContentsView) — gold TF `preload-supplier`.
Volontairement MINIMAL : contextIsolation + sandbox actifs, rien n'est
exposé au site tiers. Le pilotage bot passe par CDP + monde isolé
(browser-tab-driver), pas par ce preload.
O1 : SoT kit — marques hors TF pointent ici via `browserTabPreloadPath()`.

### `src/host/browser-tabs/chrome-ua.ts`

- **Lignes** : 41
- **Exports** : `CHROME_UA`, `installUserAgent`

// @ts-nocheck — Electron WebContents/session (shim kit mince, N7)
User-Agent cohérent pour toutes les vues (CRM + onglets fournisseurs).
Objectif : ne PAS exposer le token `Electron/x.y` ni le nom de l'app dans
l'UA (certains sites le refusent), tout en restant COHÉRENT avec les
Client Hints (`Sec-CH-UA`) que Chromium renseigne déjà (brands Chromium).

### `src/host/browser-tabs/fake-cursor-inject.ts`

- **Lignes** : 149
- **Exports** : `FAKE_CURSOR_INJECT`

Script injectable (monde isolé fournisseur) — même curseur visuel que
`src/components/assistant/fake-cursor.ts` (SVG + badge IA + halo de clic).
Nécessaire car la WebContentsView fournisseur est AU-DESSUS de la vue CRM :
le singleton DOM du chatbot ne peut pas peindre par-dessus. On réutilise
donc le même design / timing dans la page fournisseur avant le clic CDP.

### `src/host/browser-tabs/index.ts`

- **Lignes** : 41
- **Exports** : `configureBrowserTabs`, `SupplierTabManager`, `BrowserTabManager`, `executeSupplierAction`, `captureScreenshot`, `reduceTabNativeLoadState`, `normalizeTabDocumentUrl`, `isSameTabDocument`, `isSameTabOrigin`, `CHROME_UA`, `installUserAgent`, `FAKE_CURSOR_INJECT`, `browserTabPreloadPath`

Onglets sites externes génériques (N7).
Vocabulaire natif = site externe / BrowserTab — pas « fournisseur » (métier TF).
Alias Supplier* conservés dépréciés pour compat marques.

### `src/host/browser-tabs/tab-load-state.ts`

- **Lignes** : 78
- **Exports** : `TabLoadPhase`, `TabLoadSignal`, `reduceTabNativeLoadState`

Machine d'état pure du chargement d'onglet site externe (WebContentsView).
Objectif UX : spinner React uniquement pour un chargement **intentionnel**
(openTab / loadAndWait → intent-load). Les navigations main-frame initiées
par le site (liens, redirects SPA mal classées, History API) ne doivent
PAS masquer la WebContentsView — sinon flash « Chargement du site… » et
impression de reload de toute la zone contenu.
Ne jamais rebloquer l'UI sur did-start-loading parasite (iframes,
sous-ressources) après did-finish-load.

### `src/host/browser-tabs/tab-url.ts`

- **Lignes** : 53
- **Exports** : `normalizeTabDocumentUrl`, `isSameTabDocument`, `isSameTabOrigin`

Comparaison d'URL « même document » pour onglets sites externes.
Garder aligné avec src/lib/tab-document-url.ts (rootDir Electron isolé).

### `src/host/context.ts`

- **Lignes** : 83
- **Exports** : `HostLogFn`, `TunnelProvisionConfig`, `HostRuntimeContext`, `hostProductName`, `hostLog`

Contexte runtime hôte injecté dans tous les launchers B.2.
Remplace les singletons TF2 (userDataDir(), paths.ts, logger).

### `src/host/contracts.ts`

- **Lignes** : 62
- **Exports** : `HostProcessHandle`, `HermesLaunchRequest`, `N8nLaunchRequest`, `TunnelLaunchRequest`, `buildEmbedHostEnv`, `cloudflaredEnvKey`, `DEFAULT_HOST_ONLY_ELECTRON_MODULES`

Contrats des launchers hôte (Hermes / n8n / tunnel) — Phase B / B.2.
Les implémentations complètes sont dans host/hermes, host/n8n, host/tunnel.

### `src/host/crash-reporter.ts`

- **Lignes** : 237
- **Exports** : `CrashReporterConfig`, `configureCrashReporter`, `setBootStage`, `getBootStage`, `getBootTimeline`, `initCrashReporter`, `crashEndpoint`, `getInstallId`, `CrashKind`, `reportCrash`, `reportCrashDebounced`, `installGlobalHandlers`

Rapport de crash : fichier local (userData/logs/) + envoi automatique au
collecteur de l'éditeur (télémétrie de crash — service autonome sur le VPS,
voir scripts/crash-collector/).
Règles :
- best-effort intégral : timeout court, try/catch partout, JAMAIS de throw ;
- l'envoi ne bloque rien (fire-and-forget) ;
- identifiant d'installation anonyme (uuid v4 généré au 1er lancement,
  persisté dans userData) pour regrouper les rapports d'une même machine.

### `src/host/feature-off-host.ts`

- **Lignes** : 253
- **Exports** : `FeatureOffHostOptions`, `FeatureOffPluginsStatus`, `FeatureOffPluginsHost`, `FeatureOffPluginControlExtras`, `FeatureOffPluginTestsHost`, `FeatureOffPluginAcceptHost`, `FeatureOffFleetAgentHost`, `FeatureOffFleetSamplesHost`, `FeatureOffHost`, `createFeatureOffHost`

Feature-off host — contrat kit pour marques sans runtime plugins / flotte
(Phase N5, extraits des signatures Fidu `host-na-stubs.ts`).
Ne pas inventer de produit : réponses `ok: false` / listes vides honnêtes.
Les marques à plugins réels (TF/CV) utilisent `createPluginsHost` / fleet.

### `src/host/hermes/crm-key.ts`

- **Lignes** : 190
- **Exports** : `HermesCrmKeyBrand`, `HermesCrmKeyStored`, `HermesCrmKeyPaths`, `hermesCrmKeyPath`, `readHermesCrmApiKey`, `writeHermesCrmApiKey`, `generateHermesCrmApiKey`, `getHermesFullBridgeEnv`, `ensureHermesCrmApiKey`

Clé API CRM dédiée à Hermes — fichier local + upsert SQLite via sous-process.
Gold TempoFlow paramétré (prefix / file / env keys / paths injectés).

### `src/host/hermes/ensure-crm-key-db.ts`

- **Lignes** : 111

Sous-process Node vanilla — upsert clé service dans api_keys.
Usage : node ensure-crm-key-db.js <dbPath> <apiKey> <name> [scopes]
Ne jamais importer depuis electron/main (ABI better-sqlite3).

### `src/host/hermes/launcher.ts`

- **Lignes** : 1166
- **Exports** : `RunningHermes`, `StartHermesOptions`, `HermesStatusPayload`, `HermesHost`, `clearGeneratedWebuiPassword`, `clearTempoflowGeneratedWebuiPassword`, `createHermesHost`

Sidecar Hermes Agent + WebUI — factory brand-agnostic.
SoT extrait de TempoFlow hermes-launcher.ts (R3.3) — chemins gold intacts.

### `src/host/hermes/runtime-bootstrap.ts`

- **Lignes** : 872
- **Exports** : `BootstrapPhase`, `RuntimeManifest`, `getBootstrapPhase`, `getBootstrapError`, `hermesVendorDir`, `loadRuntimeManifest`, `vendoredInstallScriptPath`, `hermesRuntimeCacheDir`, `hermesInstallOsProfileDir`, `hermesWebuiInstallDir`, `hermesAgentDirCandidates`, `resolveHermesAgentDir`, `resolveHermesPython`, `WEBUI_DEPS_MARKER`, `WEBUI_DEPS_MARKER_LEGACY`, `WEBUI_DEPS_MARKER_LEGACY_CERTIVAN`, `WEBUI_DEPS_MARKER_LEGACY_FIDU`, `webuiDepsMarkerPath`, `readWebuiDepsMarker`, `writeWebuiDepsMarker`, `isWebuiDepsMarkerCurrent`, `webuiPythonDepsReady`, `installHermesAgent`, `ensureHermesWebuiTree`, `ensureHermesRuntime`, `__resetBootstrapStateForTests`

Bootstrap runtime Hermes (agent CLI + WebUI) — download-on-first-run.
Le full Python/venv n’est PAS dans l’exe (taille / remote-build). Au premier
Héberger sans CLI, on lance l’installeur officiel NousResearch, puis on
récupère l’archive WebUI pinée (checksum SHA-256) sous userData.
Chemins injectés via HostRuntimeContext (SoT kit — jumeau marque interdit).

### `src/host/host-stack.ts`

- **Lignes** : 61
- **Exports** : `HostStack`, `createHostStack`, `lazyHost`

Accès PARESSEUX aux modules host-only — port du pattern TF2 host-stack.ts.
Les apps marques construisent un HostStack via `createHostStack(deps)`
et n'importent les launchers que sur les chemins allowLocalStack.

### `src/host/load-electron.ts`

- **Lignes** : 16
- **Exports** : `loadElectron`

Charge electron en sync pour le main CJS des marques.
Évite `import "electron"` au top-level (casse les tests kit Node sans peer).

### `src/host/local-config.ts`

- **Lignes** : 781
- **Exports** : `LocalAuth`, `TunnelConfig`, `LocalConfigPath`, `LocalConfigStoreOptions`, `LocalConfigStore`, `createLocalConfigStore`, `createLocalConfigStoreSync`

Config locale + safeStorage — factory brand-agnostic (TF2 local-config.ts).
Usage :
```ts
const store = await createLocalConfigStore({
  configPath: resolveLocalConfigPath(ctx),
  manifest,
});
store.ensureAuthSecret();
```

### `src/host/meili-launcher.ts`

- **Lignes** : 153
- **Exports** : `RunningMeili`, `StartMeiliOptions`, `startMeili`

Meilisearch local OPTIONNEL — launcher générique (injecte chemins).
Port de electron/meili-launcher.ts sans dépendances marque.

### `src/host/meili/coherence-db.ts`

- **Lignes** : 176
- **Exports** : `GedSqlCounts`, `countCatalogSql`, `countGedSql`, `readSqliteSchemaVersion`, `readFingerprintFromDb`, `writeFingerprintToDb`, `buildFingerprint`, `MeiliIndexInProgress`, `readIndexInProgress`, `CoherenceDbSnapshot`, `readCoherenceDbSnapshot`

Accès SQLite pour la cohérence Meili — process Node vanilla uniquement
(better-sqlite3 ABI Node). Ne jamais importer depuis electron/main.ts.
Compteurs alignés sur l'indexeur catalogue (tables via
`configureMeiliCatalogSqlTables` — défaut TF produits + fournisseurs).

### `src/host/meili/coherence-query.ts`

- **Lignes** : 26

CLI Node vanilla : lit counts SQL + fingerprint (JSON sur stdout).
Spawn depuis electron/main via nodeBinary() + NODE_PATH (better-sqlite3).
  DB_PATH=... node …/meili/coherence-query.js
Dual-build safe : pas d'`import.meta` (CJS Electron).

### `src/host/meili/coherence.ts`

- **Lignes** : 172
- **Exports** : `MeiliCoherencePaths`, `configureMeiliCoherencePaths`, `MeiliReadyDecision`, `decideMeiliReady`, `INDEX_SCHEMA_VERSION`

Cohérence SQLite ↔ Meili au boot Electron.
IMPORTANT : pas de better-sqlite3 ici (ABI Node ≠ Electron). Les lectures
SQLite passent par un spawn Node vanilla (meili-coherence-query.js).

### `src/host/meili/index-schema.ts`

- **Lignes** : 123
- **Exports** : `INDEX_SCHEMA_VERSION`, `MEILI_FINGERPRINT_META_KEY`, `MEILI_INDEX_IN_PROGRESS_KEY`, `CATALOG_INDEXES`, `CatalogIndexUid`, `GED_INDEXES`, `GedIndexUid`, `MeiliCatalogSqlTables`, `configureMeiliCatalogSqlTables`, `getMeiliCatalogSqlTables`, `resetMeiliCatalogSqlTablesForTests`, `CatalogSqlCounts`, `GedSqlCounts`, `MeiliFingerprint`, `expectedMeiliCounts`, `parseFingerprint`, `serializeFingerprint`

Schéma logique des index Meili catalogue (TF gold — N2).
Bumper INDEX_SCHEMA_VERSION à chaque changement d'indexes / settings / docs
pour forcer une réindexation au boot.
Index réels (voir electron/meili-indexer.ts) :
  - tf2_produits
  - tf2_marketplaces
  - tf2_all  (unifié keyword = marketplaces uniquement)
Les marques CV/Fidu injectent leur propre schema au cutover N2p via
`configureMeiliCatalogSqlTables` (tables SQL comptées).

### `src/host/meili/index.ts`

- **Lignes** : 45
- **Exports** : `CATALOG_INDEXES`, `GED_INDEXES`, `INDEX_SCHEMA_VERSION`, `MEILI_FINGERPRINT_META_KEY`, `MEILI_INDEX_IN_PROGRESS_KEY`, `configureMeiliCatalogSqlTables`, `expectedMeiliCounts`, `getMeiliCatalogSqlTables`, `parseFingerprint`, `resetMeiliCatalogSqlTablesForTests`, `serializeFingerprint`, `buildFingerprint`, `countCatalogSql`, `countGedSql`, `readCoherenceDbSnapshot`, `readFingerprintFromDb`, `readIndexInProgress`, `readSqliteSchemaVersion`, `writeFingerprintToDb`, `configureMeiliCoherencePaths`, `decideMeiliReady`, `runIndexation`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/host/meili/indexer.ts`

- **Lignes** : 821
- **Exports** : `runIndexation`

// @ts-nocheck — better-sqlite3 runtime (cwd marque)
Indexeur Meilisearch catalogue (TF gold N2) — portage TypeScript de
scripts/index_meilisearch.py (v2 « agrégateurs », ~464k produits).
Exécuté comme script Node autonome (PAS dans Electron) :
  DB_PATH=… MEILI_HOST=… node build/electron/meili-indexer.js

### `src/host/n8n/agent-isolation.ts`

- **Lignes** : 255
- **Exports** : `N8nAgentIsolationBrand`, `N8nAgentKeyStored`, `N8nAgentKeysFile`, `agentIdSegment`, `n8nAgentKeyLabel`, `n8nAgentTag`, `n8nAgentKeysPath`, `readStoredN8nAgentKeys`, `writeStoredN8nAgentKeys`, `ensureN8nAgentApiKey`, `revokeN8nAgentApiKey`, `hermesAgentWorkspaceDir`, `ensureHermesAgentWorkspace`

Étanchéité par collaborateur IA (Q2 multi-profils) — gold TempoFlow paramétré.

### `src/host/n8n/api-key.ts`

- **Lignes** : 351
- **Exports** : `N8N_HERMES_API_SCOPES`, `N8nApiKeyBrand`, `N8nApiKeyStored`, `n8nApiKeyPath`, `readStoredN8nApiKey`, `writeStoredN8nApiKey`, `cookieHeaderFromSetCookie`, `n8nHttpJson`, `extractRawN8nApiKey`, `fetchN8nApiKeyScopes`, `ensureN8nApiKey`, `getN8nBridgeEnv`

Provisionnement silencieux d’une API key n8n (REST public /api/v1).
Gold TempoFlow — labels / fichier paramétrables par marque.

### `src/host/n8n/launcher.ts`

- **Lignes** : 1255
- **Exports** : `RunningN8n`, `StartN8nOptions`, `N8nAgentKeysHooks`, `N8nStatusPayload`, `N8nHost`, `createN8nHost`

Sidecar n8n — factory brand-agnostic.
SoT extrait de TempoFlow n8n-launcher.ts (R3.3) — chemins gold intacts.
Clés API / agent = hooks verticaux (onN8nReady, getN8nNextEnvExtra, n8nAgentKeys).

### `src/host/n8n/runtime-bootstrap.ts`

- **Lignes** : 325
- **Exports** : `N8nBootstrapPhase`, `N8nRuntimeManifest`, `getN8nBootstrapPhase`, `getN8nBootstrapError`, `n8nVendorDir`, `loadN8nRuntimeManifest`, `n8nRuntimeCacheDir`, `n8nPackageJsonPath`, `n8nEntryPath`, `ensureN8nRuntime`, `__resetN8nBootstrapStateForTests`

Bootstrap runtime n8n — download-on-first-run via npm (Node embarqué).
L’arbre npm n’est PAS dans l’exe (taille). Au premier mode embedded sans
entry, on `npm install n8n@pin` sous userData/n8n-runtime.
Chemins injectés via HostRuntimeContext (SoT kit — jumeau marque interdit).

### `src/host/node-runtime.ts`

- **Lignes** : 282
- **Exports** : `DESKTOP_NODE_PIN`, `DESKTOP_NODE_MIN_FOR_EMBEDS`, `TF2_NODE_PIN`, `TF2_NODE_MIN_FOR_EMBEDS`, `NodeVersionTriple`, `parseNodeVersion`, `compareNodeVersions`, `nodeSatisfiesMin`, `nodeUserDir`, `nodeUserBinary`, `packagedNodeBinary`, `resolveDesktopNodeBinary`, `probeNodeVersion`, `buildIsolatedNodeEnv`, `EnsureDesktopNodeResult`, `ensureDesktopNode`, `ensureTempoflowNode`, `resolveTempoflowNodeBinary`

Runtime Node propriété de la marque — port brand-agnostic TF2 node-runtime.ts.

### `src/host/npm-cli.ts`

- **Lignes** : 263
- **Exports** : `DESKTOP_NPM_PIN`, `TF2_NPM_PIN`, `EnsureNpmCliResult`, `npmUserDataRoot`, `npmCliCandidates`, `resolveNpmCliPath`, `ensureNpmCli`, `runNpmCli`

CLI npm sans PATH Windows — port brand-agnostic TF2 npm-cli.ts.

### `src/host/plugins/accept-check.ts`

- **Lignes** : 211
- **Exports** : `AcceptCheckItem`, `AcceptCheckResult`, `resolvePluginSmokes`, `runPluginAcceptCheck`

Accept-check plugins — port TF gold plugin-accept-check.ts (N1).

### `src/host/plugins/brand-bindings.ts`

- **Lignes** : 190
- **Exports** : `PluginLlmKeys`, `PluginHostBindings`, `configurePluginHost`, `getPluginHostBindings`, `tryGetPluginHostBindings`, `__resetPluginHostBindingsForTests`, `pluginEnvKeys`, `assignPluginEnv`, `resolveBuildIsolatedNodeEnv`, `resolveApplyOsSandboxEnv`, `resolveFindFreePort`, `pluginCrmKeyFileName`, `pluginGitIdentity`

Injection marque pour le runtime plugins kit (N1).
Les modules sous `host/plugins` ne hardcodent plus TEMPOFLOW_/TF2_ :
la marque appelle `configurePluginHost(bindings)` au boot (cutover N1p).
Aliases documentés :
- primaire : `${envPrefix}_*` (ex. TEMPOFLOW_PLUGIN_ID, CERTIVAN_API_URL)
- legacy optionnels : `legacyEnvAliases` (ex. TF2_* pour TempoFlow)

### `src/host/plugins/control-adapters.ts`

- **Lignes** : 114
- **Exports** : `buildPluginControlPlaneAdapters`

Factory adapters control-plane — port générique TF plugin-control-adapters (N1).
Injection marque : readHostCrmApiKey, envPrefix (+ aliases), plugins CRM port.

### `src/host/plugins/control-extras.ts`

- **Lignes** : 461
- **Exports** : `PLUGIN_CONTROL_PREFERRED_PORT`, `PluginControlApiState`, `getPluginControlApi`, `getPluginControlBridgeEnv`, `migratePluginData`, `archivePluginRuntime`, `createPluginExecutionGrant`, `validatePluginExecutionGrant`, `startPluginControlApi`, `stopPluginControlApi`, `handlePluginControlExtras`, `handleBrandExtras`

Control-plane plugins — boot kit + extras verticaux (N1).
Port TF gold plugin-control-extras.ts avec injection marque.

### `src/host/plugins/control-plane.ts`

- **Lignes** : 184
- **Exports** : `StartHostPluginControlPlaneOptions`, `startHostPluginControlPlane`

Control plane plugins — façade electron-shell sur @creezio/product-hub.
C7 : point d'entrée unifié `startHostPluginControlPlane` (4 boots).

### `src/host/plugins/control-token.ts`

- **Lignes** : 110
- **Exports** : `pluginControlTokenFile`, `pluginControlTokenPrefix`, `PluginControlTokenStored`, `pluginControlTokenPath`, `readPluginControlToken`, `writePluginControlToken`, `generatePluginControlToken`, `ensurePluginControlToken`, `getPluginControlBridgeEnv`

Token Bearer control plane plugins — brand-agnostic (TF2 plugin-control-token).
Env bridge : clés génériques + `{ENV_PREFIX}_*` (plus de hardcode TEMPOFLOW_).

### `src/host/plugins/crm-key.ts`

- **Lignes** : 167
- **Exports** : `PluginCrmKeyStored`, `pluginCrmKeyPath`, `readPluginCrmApiKey`, `ensurePluginCrmApiKey`, `PLUGIN_CRM_KEY_FILE`

Clé API CRM dédiée par plugin — port TF gold plugin-crm-key.ts (N1).
Injection : apiKeyPrefix, crmKeyFileName, dbPath, nodeBinary, nodeScript.

### `src/host/plugins/data.ts`

- **Lignes** : 121
- **Exports** : `PluginDataMigrationReport`, `applyPluginDataMigrations`, `runPluginDataCli`

Migrations SQLite des plugins — port TF gold plugin-data.ts (N1).
NE JAMAIS importer depuis le main Electron : exécuter en sous-process
Node vanilla via `bindings.nodeScript("plugin-data.js")` (cf. migratePluginData
dans control-extras). Utilise `node:sqlite` (kit) — les marques peuvent
injecter better-sqlite3 via `openDatabase`.

### `src/host/plugins/events.ts`

- **Lignes** : 20
- **Exports** : `PLUGIN_RUNTIME_FILE`, `PLUGIN_SITE_ID_BASE`, `PLUGIN_SITE_ID_SPAN`, `pluginAcceptsHook`, `pluginHookUrl`, `pluginN8nWebhookUrl`, `pluginRuntimePath`, `pluginSiteId`, `readPluginRuntimeState`, `writePluginRuntimeState`

Réexport platform-core — équivalent TF plugin-events (N1).
Pas de duplication : SoT = `@creezio/platform-core`.

### `src/host/plugins/execution-grant.ts`

- **Lignes** : 12
- **Exports** : `issuePluginExecutionGrant`, `verifyPluginExecutionGrant`

Réexport platform-core — équivalent TF plugin-execution-grant (N1).
Pas de duplication : SoT = `@creezio/platform-core`.

### `src/host/plugins/git.ts`

- **Lignes** : 441
- **Exports** : `PluginGitCommit`, `PluginGitStatus`, `resetGitBinaryCache`, `resolveGitBinary`, `isPluginGitRepo`, `bumpPluginManifestPatch`, `ensurePluginGitRepo`, `commitPluginChanges`, `listPluginVersions`, `restorePluginVersion`, `getPluginGitStatus`

Versioning Git local par plugin — port TF gold plugin-git.ts (N1).
Injection marque : gitBinary / userDataDir / isPackaged / applyOsSandboxEnv / identité git.

### `src/host/plugins/host.ts`

- **Lignes** : 222
- **Exports** : `RunningPlugin`, `PluginsHost`, `createPluginsHost`, `PLUGIN_VERTICAL_REMAINING`

Host plugins runtime — spawn sidecars minimal (boots C7 sans bindings).
Runtime riche TF (scaffold / git / control-extras / accept-check…) →
`host/plugins/{runtime,launcher,git,control-extras,...}` + `configurePluginHost`
(Phase N1). Product Hub → `@creezio/product-hub` + `startHostPluginControlPlane`.
Vertical restant après N1 (cutover N1p / UI N6) :
- wiring marque (`configurePluginHost`, barrels ≤40 LOC)
- UI Admin Plugins / MCP analytics

### `src/host/plugins/launcher.ts`

- **Lignes** : 654
- **Exports** : `RunningPlugin`, `setPluginsCrmPort`, `getPluginsCrmPort`, `listPlugins`, `getPluginLogs`, `getRunningPlugins`, `startEnabledPlugins`, `stopAllPlugins`, `enablePlugin`, `createPluginScaffold`, `createPluginScaffoldWithGit`, `deletePlugin`, `writePluginFiles`, `writePluginFilesAndCommit`, `getPluginVersions`, `restorePluginToVersion`, `restartPlugin`, `proxyPluginHealth`, `resolvePluginPanel`, `pluginsStatusPayload`, `pluginsStatusPayloadWithGit`

Spawn / stop des plugins (sidecars Node) — port TF gold plugin-launcher.ts (N1).
Env brandés via `${envPrefix}_*` (+ aliases legacy TF2_*).

### `src/host/plugins/runtime.ts`

- **Lignes** : 489
- **Exports** : `pluginsRootDir`, `discoverPlugins`, `scaffoldPluginUiCss`, `scaffoldPlugin`, `PLUGIN_MANIFEST_FILE`, `hasPluginPermission`, `isValidPluginId`, `parsePluginManifest`, `pluginEnabledFlagPath`, `pluginSiteId`, `setPluginEnabled`

Runtime plugins kit — scaffold UI + wrappers discover (N1).
Types / parse / discover purs → `@creezio/platform-core`.
Scaffold (CSS kit + index.js proxy CRM) porté depuis TF gold plugin-runtime.ts
avec injection `envPrefix` / `productName` via brand-bindings.

### `src/host/plugins/test-runner.ts`

- **Lignes** : 130
- **Exports** : `PluginTestResult`, `runPluginTests`

Runner tests plugins (`node --test`) — port TF gold plugin-test-runner.ts (N1).

### `src/host/safe-storage.ts`

- **Lignes** : 68
- **Exports** : `SafeStorageBackend`, `loadElectronSafeStorage`, `loadElectronSafeStorageSync`, `canEncrypt`, `sealValue`, `openValue`

Abstraction safeStorage Electron — chiffrement secrets local-config.
Fallback plain si backend OS indisponible (documenté TF2).

### `src/host/sandbox/embed-sandbox.ts`

- **Lignes** : 388
- **Exports** : `setSandboxEnvVar`, `ensureSandboxGitConfig`, `DESKTOP_SANDBOX_MARKER_BEGIN`, `DESKTOP_SANDBOX_MARKER_END`, `hermesSandboxPaths`, `desktopSandboxPaths`, `applyOsSandboxEnv`, `buildHermesSandboxYamlBlock`, `HERMES_DEFAULT_MODEL`, `HERMES_DEFAULT_REASONING_EFFORT`, `DESKTOP_REASONING_MIGRATION_MARKER`, `normalizeHermesModelProvider`, `ensureHermesAgentModelDefaults`, `upsertHermesSandboxConfig`, `tempoflowSandboxPaths`

Confinement « OS desktop » — tout ce que Hermes / n8n
voient comme HOME, workspace, temp et cache npm doit vivre sous userData.
Aucun import Electron : testable depuis Node.

### `src/host/sandbox/os-sandbox.ts`

- **Lignes** : 134
- **Exports** : `overridesAllowed`, `resolveSystemBinary`, `buildConfinedPath`

Politique « OS desktop Creezio » — périmètre d'exécution strict.
Principe : un build packagé ne doit JAMAIS résoudre un binaire via le PATH
utilisateur, ni accepter un override d'environnement pointant hors du
sandbox. Les seuls exécutables légitimes sont :
  - ceux packagés sous `process.resourcesPath` (Node, Meili, git, cloudflared…)
  - ceux installés par desktop sous `{userData}` (venv Hermes, npm-cli…)
  - les utilitaires système FONDAMENTAUX de l'OS, résolus par CHEMIN ABSOLU
    connu (jamais par nom sur le PATH) : PowerShell, tar, cmd, bash.
Aucun import Electron ici : module pur, test

### `src/host/server-env.ts`

- **Lignes** : 119
- **Exports** : `RunningServer`, `StartServerPaths`, `StartServerCoreOptions`, `startNextServerCore`, `findFreePort`, `waitForHealth`

Contrats / helpers pour le lancement du serveur Next embarqué.
Le spawn complet (node-runtime, secrets local-config) reste branché
par l'app marque — ici le noyau brand-agnostic.

### `src/host/server-launcher.ts`

- **Lignes** : 93
- **Exports** : `BrandServerLauncherDeps`, `StartBrandServerOptions`, `startBrandNextServer`, `ServerSpawnFn`, `findFreePort`, `waitForHealth`

Spawn serveur Next standalone — wrapper marque autour de `startNextServerCore` (N2).
Secrets / ports / paths / spawn injectés (plus de hardcode TF2_*).

### `src/host/tunnel/tunnel.ts`

- **Lignes** : 408
- **Exports** : `TunnelRuntimeStatus`, `TunnelIngressPorts`, `TunnelService`, `createTunnelService`, `buildTunnelPublicUrls`, `deriveTunnelServiceUrl`

Cloudflare Tunnel — service brand-agnostic (TF2 tunnel.ts).
Provision URLs / tokens injectés via HostRuntimeContext.tunnelProvision.

### `src/host/web-telemetry.ts`

- **Lignes** : 108
- **Exports** : `instrumentWebContents`

// @ts-nocheck — WebContents events Electron (shim kit volontairement mince)
Télémétrie des WebContents (UI CRM + onglets fournisseurs).
Couvre les plantages "invisibles" côté rendu que les handlers process-level
(uncaughtException…) ne voient pas : crash du process de rendu, preload qui
ne charge pas, page qui échoue à charger, page qui ne répond plus, erreurs
console. Chaque anomalie est loggée localement ET envoyée au collecteur

### `src/index.ts`

- **Lignes** : 677
- **Exports** : `initLogger`, `log`, `logError`, `logFilePath`, `getLogRing`, `recentLines`, `logFileTail`, `scoped`, `feedChildLine`, `setOpsLineHandler`, `windowChromeBarHtml`, `windowChromeCss`, `windowChromeJs`, `SPLASH_STEP_WEIGHTS`, `activateSplashStep`, `completeSplashStep`, `computeOverallPercent`, `createLocalSplashSteps`, `createRemoteSplashSteps`, `createSplashModel`, `estimateEmbedPercent`, `formatElapsedMs`, `sanitizeSplashDetail`, `splashDataUrl`, `splashHtmlDocument`, `stepProgressRatio`, `updateSplashStep`, `checkForUpdatesNow`, `downloadAndInstallUpdate`, `getUpdaterStatus`, `reduceUpdateEvent`, `registerUpdateIpc`, `sendUpdateToWebContents`, `setUpdaterRenderer`, `setupAutoUpdater`, `TrayController`, `applyLaunchAtStartup`, `installCloseToTray`, `adminWindowVisible`, `closeAdminWindow`

@creezio/electron-shell — runtime Electron plateforme (Phase B / B.2).

### `src/logger.ts`

- **Lignes** : 208
- **Exports** : `setOpsLineHandler`, `initLogger`, `logFilePath`, `log`, `logError`, `recentLines`, `getLogRing`, `logFileTail`, `scoped`, `feedChildLine`

Logger process principal — paramétré par logBasename (manifest).
Port de electron/logger.ts (TF2), sans hardcode TempoFlow.

### `src/main-facade.ts`

- **Lignes** : 154
- **Exports** : `CreateHostRuntimeOptions`, `pathsContextFromBoot`, `createHostRuntime`, `prepareHostDesktop`, `localConfigPathForBoot`, `vendorDir`

Façades supplémentaires pour un `main.ts` mince (Phase B.2 / G).
`prepareDesktopBoot` (boot.ts) + ces helpers couvrent le shell platform
avant le métier vertical (catalogue, tabs, AI workspace…).

### `src/splash-ui.ts`

- **Lignes** : 543
- **Exports** : `SplashStepStatus`, `SplashStepId`, `SplashStepView`, `SplashViewModel`, `SPLASH_STEP_WEIGHTS`, `formatElapsedMs`, `sanitizeSplashDetail`, `estimateEmbedPercent`, `stepProgressRatio`, `computeOverallPercent`, `createLocalSplashSteps`, `createRemoteSplashSteps`, `createSplashModel`, `activateSplashStep`, `updateSplashStep`, `completeSplashStep`, `SplashHtmlOptions`, `splashHtmlDocument`, `splashDataUrl`

Splash de démarrage — modèle + HTML riche (aucun import Electron).
Port brand-agnostic de electron/splash-ui.ts (TF2) — productName / bridgeName / cssPrefix.

### `src/tray.ts`

- **Lignes** : 203
- **Exports** : `TrayAiWorkspaceEntry`, `TrayControllerOptions`, `TrayController`, `installCloseToTray`, `applyLaunchAtStartup`

Icône Tray générique — labels depuis AppManifest.productName.
Port de electron/tray.ts (TF2) — setup/refresh sync (require electron).

### `src/updater.ts`

- **Lignes** : 320
- **Exports** : `UpdaterSend`, `SetupAutoUpdaterOptions`, `getUpdaterStatus`, `checkForUpdatesNow`, `downloadAndInstallUpdate`, `registerUpdateIpc`, `setupAutoUpdater`, `setUpdaterRenderer`, `sendUpdateToWebContents`, `reduceUpdateEvent`

Auto-update via electron-updater (provider generic).
Port de electron/updater.ts — feed URL fourni par l'appelant (manifest).
Les apps marques appellent `setupAutoUpdater({ feedUrl, … })` après boot UI.

### `src/window-chrome.ts`

- **Lignes** : 99
- **Exports** : `windowChromeBarHtml`, `windowChromeCss`, `windowChromeJs`

Chrome fenêtre frameless — HTML/CSS/JS purs.
Port de electron/window-chrome-html.ts, paramétré par bridgeName + cssPrefix.

