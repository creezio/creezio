# @creezio/platform-core — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/platform-core/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/app-kind.ts`](../src/app-kind.ts) | 182 | `RuntimeAppKind`, `APP_KIND_FILENAME`, `PickerVariant`, `BootBehavior`, `parseAppKind`, `resolveAppKind`, `readAppKindFile`, `userDataDirForAppKind` |
| [`src/architecture-version.ts`](../src/architecture-version.ts) | 8 | `ARCHITECTURE_VERSION`, `ArchitectureVersion` |
| [`src/connection-profile.ts`](../src/connection-profile.ts) | 170 | `ConnectionMode`, `LocalBindHost`, `ConnectionProfile`, `ConnectionProfilePublic`, `defaultLocalProfile`, `unsetConnectionProfile`, `normalizeRemoteUrl`, `normalizeLocalBind` |
| [`src/core-db-env.ts`](../src/core-db-env.ts) | 47 | `resolveCoreDbPathFromEnv`, `ensureCoreDbParent`, `resolvePluginDocumentsDirFromEnv` |
| [`src/core-migrations.ts`](../src/core-migrations.ts) | 116 | `PLATFORM_CORE_MIGRATION_IDS`, `PlatformCoreMigrationId`, `PlatformCoreMigrationsOptions`, `platformCoreMigrations` |
| [`src/disk-space.ts`](../src/disk-space.ts) | 132 | `WINDOWS_NPM_ENOSPC_EXIT`, `N8N_INSTALL_MIN_FREE_BYTES`, `isDiskSpaceError`, `formatBytesFr`, `formatN8nDiskSpaceError`, `getFreeDiskBytes`, `cleanupN8nInstallArtifacts`, `diskSpacePreflightMessage` |
| [`src/embeds/embed-env-catalog.ts`](../src/embeds/embed-env-catalog.ts) | 441 | `EmbedEnvService`, `EmbedEnvVarDef`, `OS_SANDBOX_LOCKED_KEYS`, `N8N_LOCKED_KEYS`, `HERMES_LOCKED_KEYS`, `N8N_ENV_CATALOG`, `HERMES_ENV_CATALOG`, `catalogFor` |
| [`src/embeds/embed-stack-hooks.ts`](../src/embeds/embed-stack-hooks.ts) | 74 | `EmbedToolMode`, `EmbedHostGate`, `shouldSpawnHostOnlyEmbed`, `normalizeEmbedHttpOrigin`, `EMBED_TOOL_SITE_IDS`, `PLUGIN_SITE_ID_RANGE`, `EMBED_IPC` |
| [`src/embeds/hermes-embed.ts`](../src/embeds/hermes-embed.ts) | 298 | `HermesEmbedMode`, `HermesEmbedConfig`, `HermesRuntimeStatus`, `HermesWebuiStatus`, `HERMES_DEFAULT_API_PORT`, `HERMES_DEFAULT_WEBUI_PORT`, `HERMES_DESKTOP_API_PORT`, `HERMES_DESKTOP_WEBUI_PORT` |
| [`src/embeds/n8n-embed.ts`](../src/embeds/n8n-embed.ts) | 373 | `N8nEmbedMode`, `N8nEmbedConfig`, `N8nRuntimeStatus`, `N8N_DEFAULT_PORT`, `N8N_DESKTOP_PORT`, `N8N_EXE_BUNDLE_CEILING_MB`, `N8N_AUDIT`, `sanitizeN8nEmbedConfig` |
| [`src/env-brand.ts`](../src/env-brand.ts) | 69 | `brandEnv`, `buildNextHostEnv`, `nodeBinaryEnvKey` |
| [`src/factory-reset.ts`](../src/factory-reset.ts) | 79 | `factoryResetTargets`, `factoryResetPartitionPrefixes` |
| [`src/fleet-telemetry.ts`](../src/fleet-telemetry.ts) | 145 | `FLEET_CONSENT_VERSION`, `FLEET_SCOPE_IDS`, `FleetScopeId`, `FleetTelemetryScopes`, `FleetTelemetryConfig`, `FleetTelemetryPatch`, `defaultFleetScopes`, `basicSupportScopes` |
| [`src/historical-migrations/index.ts`](../src/historical-migrations/index.ts) | 30 | `addColumnIfMissing`, `tableColumns`, `tableExists`, `runHistoricalMigrations`, `PLATFORM_HISTORICAL_STEP_VERSIONS`, `platformHistoricalMigrationByName`, `platformHistoricalMigrations` |
| [`src/historical-migrations/runner.ts`](../src/historical-migrations/runner.ts) | 147 | `HistoricalMigrationReport`, `RunHistoricalMigrationsOptions`, `runHistoricalMigrations` |
| [`src/historical-migrations/steps/017_agent_todos.ts`](../src/historical-migrations/steps/017_agent_todos.ts) | 45 | — |
| [`src/historical-migrations/steps/020_api_keys.ts`](../src/historical-migrations/steps/020_api_keys.ts) | 33 | — |
| [`src/historical-migrations/steps/022_mcp_oauth.ts`](../src/historical-migrations/steps/022_mcp_oauth.ts) | 59 | — |
| [`src/historical-migrations/steps/023_users.ts`](../src/historical-migrations/steps/023_users.ts) | 23 | — |
| [`src/historical-migrations/steps/024_users_kind.ts`](../src/historical-migrations/steps/024_users_kind.ts) | 14 | — |
| [`src/historical-migrations/steps/025_desktop_presence.ts`](../src/historical-migrations/steps/025_desktop_presence.ts) | 24 | — |
| [`src/historical-migrations/steps/026_collab_ia_kanban.ts`](../src/historical-migrations/steps/026_collab_ia_kanban.ts) | 41 | — |
| [`src/historical-migrations/steps/027_mcp_admin.ts`](../src/historical-migrations/steps/027_mcp_admin.ts) | 50 | — |
| [`src/historical-migrations/steps/028_plugin_product_hub.ts`](../src/historical-migrations/steps/028_plugin_product_hub.ts) | 143 | — |
| [`src/historical-migrations/steps/029_unified_tasks.ts`](../src/historical-migrations/steps/029_unified_tasks.ts) | 169 | — |
| [`src/historical-migrations/steps/030_plugin_prd_sections.ts`](../src/historical-migrations/steps/030_plugin_prd_sections.ts) | 39 | — |
| [`src/historical-migrations/steps/031_ai_recurrence_quotas.ts`](../src/historical-migrations/steps/031_ai_recurrence_quotas.ts) | 25 | — |
| [`src/historical-migrations/steps/032_plugin_acl.ts`](../src/historical-migrations/steps/032_plugin_acl.ts) | 26 | — |
| [`src/historical-migrations/steps/033_database_automations.ts`](../src/historical-migrations/steps/033_database_automations.ts) | 30 | — |
| [`src/historical-migrations/steps/034_emails.ts`](../src/historical-migrations/steps/034_emails.ts) | 54 | — |
| [`src/historical-migrations/steps/035_usage_analytics.ts`](../src/historical-migrations/steps/035_usage_analytics.ts) | 48 | — |
| [`src/historical-migrations/steps/index.ts`](../src/historical-migrations/steps/index.ts) | 70 | `PLATFORM_HISTORICAL_STEP_VERSIONS`, `PlatformHistoricalStepVersion`, `platformHistoricalMigrations`, `platformHistoricalMigrationByName` |
| [`src/historical-migrations/types.ts`](../src/historical-migrations/types.ts) | 65 | `HistoricalSqliteDb`, `HistoricalMigration`, `tableColumns`, `tableExists`, `addColumnIfMissing`, `Migration` |
| [`src/index.ts`](../src/index.ts) | 408 | `ARCHITECTURE_VERSION`, `feedUrlForKind`, `meiliBinaryCandidates`, `resolveAssistantDbPath`, `resolveDbPath`, `resolveHermesHomeDir`, `resolveLocalConfigPath`, `resolveLogsDir` |
| [`src/installer-prefs.ts`](../src/installer-prefs.ts) | 68 | `INSTALLER_PREFS_FILENAME`, `InstallerPrefs`, `installerPrefsPath`, `parseInstallerPrefs`, `consumeInstallerPrefsFile` |
| [`src/licensing.ts`](../src/licensing.ts) | 99 | `LicenseStatus`, `LicensingOptions`, `storeLicenseKey`, `checkLicense` |
| [`src/local-config-schema.ts`](../src/local-config-schema.ts) | 140 | `StoredValue`, `LocalBindHost`, `ConnectionProfile`, `TunnelServicePorts`, `TunnelPublicUrlsStored`, `TunnelMetaStored`, `EmbedMode`, `HermesEmbedConfig` |
| [`src/paths.ts`](../src/paths.ts) | 156 | `PathsContext`, `resolveUserDataDir`, `resolveDbPath`, `resolveLocalConfigPath`, `resolveAssistantDbPath`, `resolveUploadsDir`, `resolveMeiliDataDir`, `resolveHermesHomeDir` |
| [`src/platform-stores-contract.ts`](../src/platform-stores-contract.ts) | 66 | `PlatformDomain`, `PlatformBackend`, `PlatformDomainContract`, `PLATFORM_STORES_CONTRACT`, `DEPRECATED_SHADOW_ONLY` |
| [`src/plugins/plugin-events.ts`](../src/plugins/plugin-events.ts) | 86 | `PLUGIN_RUNTIME_FILE`, `PluginRuntimeEntry`, `PluginRuntimeState`, `pluginRuntimePath`, `writePluginRuntimeState`, `readPluginRuntimeState`, `pluginAcceptsHook`, `pluginHookUrl` |
| [`src/plugins/plugin-execution-grant.ts`](../src/plugins/plugin-execution-grant.ts) | 108 | `PluginGrantAction`, `PluginExecutionGrantPayload`, `issuePluginExecutionGrant`, `verifyPluginExecutionGrant` |
| [`src/plugins/plugin-manifest.ts`](../src/plugins/plugin-manifest.ts) | 214 | `PLUGIN_MANIFEST_FILE`, `PluginPermission`, `PluginPanelConfig`, `PluginAcceptanceSmoke`, `PluginAcceptance`, `PluginManifest`, `DiscoveredPlugin`, `pluginsRootDir` |
| [`src/ports.ts`](../src/ports.ts) | 86 | `BindHost`, `findFreePort`, `httpGetStatus`, `waitForHealth`, `waitForMeiliHealth` |
| [`src/profile-launch.ts`](../src/profile-launch.ts) | 153 | `ProfileMode`, `ProfileLaunch`, `sanitizeProfileSegment`, `parseJoinDeepLink`, `parseProfileArgv`, `profileDirSegment`, `profileUserDataDir`, `profileArgFor` |
| [`src/recovery-key.ts`](../src/recovery-key.ts) | 156 | `RecoveryVerifier`, `RecoveryEnvelope`, `RecoveryWrappedSecrets`, `generateRecoveryKey`, `normalizeRecoveryKey`, `createRecoveryVerifier`, `verifyRecoveryKey`, `wrapSecretsWithRecoveryKey` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 48 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-layout.ts`](../src/sqlite-layout.ts) | 156 | `CORE_DB_FILENAME`, `SQLITE_LAYOUT_DIR`, `PLUGIN_DB_SUBDIR`, `resolveSqliteRoot`, `resolveCoreDbPath`, `resolveBrandDbPath`, `resolvePluginDbPath`, `EnsurePluginDbResult` |
| [`src/sqlite-migrations.ts`](../src/sqlite-migrations.ts) | 126 | `SQLITE_MIGRATIONS_TABLE`, `SqliteMigration`, `EnsureMigrationsResult`, `ensureMigrations`, `listAppliedMigrations`, `SQLITE_META_MIGRATION`, `composeMigrations` |
| [`src/sqlite-runtime.ts`](../src/sqlite-runtime.ts) | 311 | `SqliteLayerKind`, `SqliteLayerRef`, `SqliteHandle`, `SqliteRuntimeStatus`, `OpenPluginResult`, `SqliteRuntime`, `CreateSqliteRuntimeOptions`, `createSqliteRuntime` |
| [`src/tunnel-urls.ts`](../src/tunnel-urls.ts) | 106 | `TUNNEL_EMBED_SERVICES`, `TunnelEmbedService`, `TunnelPublicUrls`, `tunnelServiceHostname`, `buildTunnelPublicUrls`, `deriveTunnelServiceUrl`, `portFromLocalUrl` |
| [`src/updater-state.ts`](../src/updater-state.ts) | 125 | `UpdateState`, `UpdateStatus`, `UpdateEvent`, `initialUpdateStatus`, `reduceUpdateEvent` |

---

## Détail par fichier

### `src/app-kind.ts`

- **Lignes** : 182
- **Exports** : `RuntimeAppKind`, `APP_KIND_FILENAME`, `PickerVariant`, `BootBehavior`, `parseAppKind`, `resolveAppKind`, `readAppKindFile`, `userDataDirForAppKind`, `appUserModelIdFor`, `displayNameFor`, `appKindEnvValue`, `bootBehaviorFor`, `isAllowedServerCockpitPath`, `appKindFilePayload`

Split Serveur / Client — logique PURE, testable depuis Node.
Port brand-agnostic de electron/app-kind.ts (TF2 0.10.26).

### `src/architecture-version.ts`

- **Lignes** : 8
- **Exports** : `ARCHITECTURE_VERSION`, `ArchitectureVersion`

Cadre architecture Creezio (Phase H0+).
Bump uniquement au sign-off de phase (H0 → H1 → … → H5 ACL → H6 freeze I*).

### `src/connection-profile.ts`

- **Lignes** : 170
- **Exports** : `ConnectionMode`, `LocalBindHost`, `ConnectionProfile`, `ConnectionProfilePublic`, `defaultLocalProfile`, `unsetConnectionProfile`, `normalizeRemoteUrl`, `normalizeLocalBind`, `sanitizeConnectionProfile`, `resolveBootProfile`, `assertProfileReady`, `testRemoteHealth`

Profils de connexion desktop : serveur local embarqué vs API distante.
Logique pure (pas d'import Electron) — port de electron/connection-profile.ts.

### `src/core-db-env.ts`

- **Lignes** : 47
- **Exports** : `resolveCoreDbPathFromEnv`, `ensureCoreDbParent`, `resolvePluginDocumentsDirFromEnv`

Résolution chemin `core.db` côté process Next/CRM (sans PathsContext Electron).
Ordre :
1. `CREEZIO_CORE_DB_PATH` (injecté par Electron server-launcher)
2. voisin de `DB_PATH` → `{userData}/sqlite/core.db`
3. `/data/sqlite/core.db` (cloud/docker)

### `src/core-migrations.ts`

- **Lignes** : 116
- **Exports** : `PLATFORM_CORE_MIGRATION_IDS`, `PlatformCoreMigrationId`, `PlatformCoreMigrationsOptions`, `platformCoreMigrations`

Migrations SQLite **cœur** plateforme (M11).
Compose auth + Product Hub (ACL H5 + runtime) — SoT kit.
Les marques ne doivent plus dupliquer cette liste ; elles gardent
uniquement `brand-migrations` métier.
N4 — couverture vs steps historiques brand.db :
- `028/030/032` plugin_* → `PRODUCT_HUB_*_SQL` + `migrateLegacyBrandProductHubOnce`
- auth utilisateurs kit → `AUTH_CORE_SQL` (`creezio_users`, pas table `users` legacy)
- autres steps plateforme (api_keys, mcp, tasks brand, emails, analytics, …)
  → `platformHistoricalMigrations()` (brand.db / schema_version)
Chargement SQL via `createRequire`

### `src/disk-space.ts`

- **Lignes** : 132
- **Exports** : `WINDOWS_NPM_ENOSPC_EXIT`, `N8N_INSTALL_MIN_FREE_BYTES`, `isDiskSpaceError`, `formatBytesFr`, `formatN8nDiskSpaceError`, `getFreeDiskBytes`, `cleanupN8nInstallArtifacts`, `diskSpacePreflightMessage`

Détection espace disque insuffisant (npm install n8n, cache userData).
Testable sans I/O réseau.

### `src/embeds/embed-env-catalog.ts`

- **Lignes** : 441
- **Exports** : `EmbedEnvService`, `EmbedEnvVarDef`, `OS_SANDBOX_LOCKED_KEYS`, `N8N_LOCKED_KEYS`, `HERMES_LOCKED_KEYS`, `N8N_ENV_CATALOG`, `HERMES_ENV_CATALOG`, `catalogFor`, `lockedKeySet`, `sanitizeUserEnvOverlay`, `mergeEmbedUserEnv`, `isEmbedEnvService`, `EmbedEnvPanelVar`, `EmbedEnvPanel`, `buildEmbedEnvPanel`

Catalogue env embeds (n8n / Hermes) — port brand-agnostic TF2 0.10.26.
Les libellés UI restent génériques ; le productName est injecté à l'affichage.

### `src/embeds/embed-stack-hooks.ts`

- **Lignes** : 74
- **Exports** : `EmbedToolMode`, `EmbedHostGate`, `shouldSpawnHostOnlyEmbed`, `normalizeEmbedHttpOrigin`, `EMBED_TOOL_SITE_IDS`, `PLUGIN_SITE_ID_RANGE`, `EMBED_IPC`

Hooks partagés — stack d'outils embarqués (Hermes, n8n).
Port brand-agnostic de electron/embed-stack-hooks.ts (TF2 0.10.26).

### `src/embeds/hermes-embed.ts`

- **Lignes** : 298
- **Exports** : `HermesEmbedMode`, `HermesEmbedConfig`, `HermesRuntimeStatus`, `HermesWebuiStatus`, `HERMES_DEFAULT_API_PORT`, `HERMES_DEFAULT_WEBUI_PORT`, `HERMES_DESKTOP_API_PORT`, `HERMES_DESKTOP_WEBUI_PORT`, `HERMES_EXE_BUNDLE_CEILING_MB`, `sanitizeHermesEmbedConfig`, `normalizeHttpOrigin`, `shouldSpawnEmbeddedHermes`, `hermesBinaryCandidates`, `resolveHermesBinary`, `hermesBinEnvKey`, `buildNextHermesEnv`, `buildHermesHomeEnvFile`, `hermesPublicStatus`

Logique pure Hermes Agent — port brand-agnostic TF2 0.10.26 hermes-embed.ts.
Aucun import Electron : testable depuis Node.

### `src/embeds/n8n-embed.ts`

- **Lignes** : 373
- **Exports** : `N8nEmbedMode`, `N8nEmbedConfig`, `N8nRuntimeStatus`, `N8N_DEFAULT_PORT`, `N8N_DESKTOP_PORT`, `N8N_EXE_BUNDLE_CEILING_MB`, `N8N_AUDIT`, `sanitizeN8nEmbedConfig`, `shouldSpawnEmbeddedN8n`, `n8nEntryCandidates`, `isNodeSpawnableN8nEntry`, `n8nBinEnvKey`, `resolveN8nEntry`, `n8nHomeLooksWarm`, `describeN8nSpawnKind`, `buildNextN8nEnv`, `normalizeN8nPublicBaseUrl`, `buildN8nSpawnEnv`, `n8nPublicStatus`, `normalizeHttpOrigin`

Logique pure n8n — port brand-agnostic TF2 0.10.26 n8n-embed.ts.

### `src/env-brand.ts`

- **Lignes** : 69
- **Exports** : `brandEnv`, `buildNextHostEnv`, `nodeBinaryEnvKey`

Helpers env marque pour launchers (Next / Meili / Hermes / n8n).
Remplace les hardcodes TEMPOFLOW_* / TF2_* dans le runtime kit.

### `src/factory-reset.ts`

- **Lignes** : 79
- **Exports** : `factoryResetTargets`, `factoryResetPartitionPrefixes`

Cibles factory-reset — logique PURE (chemins).
Le wipe Electron (sessions) reste dans @creezio/electron-shell.
Port paramétré de electron/factory-reset.ts (TF2 0.10.26).

### `src/fleet-telemetry.ts`

- **Lignes** : 145
- **Exports** : `FLEET_CONSENT_VERSION`, `FLEET_SCOPE_IDS`, `FleetScopeId`, `FleetTelemetryScopes`, `FleetTelemetryConfig`, `FleetTelemetryPatch`, `defaultFleetScopes`, `basicSupportScopes`, `defaultFleetTelemetry`, `sanitizeFleetTelemetry`, `isFleetScopeActive`, `applyFleetTelemetryPatch`

Consentement télémétrie flotte — extrait TempoFlow fleet-telemetry.ts (M4).
Labels UI marque restent hors kit ; ici : types + sanitize/patch purs.

### `src/historical-migrations/index.ts`

- **Lignes** : 30
- **Exports** : `addColumnIfMissing`, `tableColumns`, `tableExists`, `runHistoricalMigrations`, `PLATFORM_HISTORICAL_STEP_VERSIONS`, `platformHistoricalMigrationByName`, `platformHistoricalMigrations`

Migrations historiques brand.db (schema_version) — plateforme SoT kit (N4).
Hors scope : steps métier TF/CV/Fidu ; `platformCoreMigrations` (core.db).

### `src/historical-migrations/runner.ts`

- **Lignes** : 147
- **Exports** : `HistoricalMigrationReport`, `RunHistoricalMigrationsOptions`, `runHistoricalMigrations`

Runner de migrations SQLite historiques (brand.db / schema_version).
IMPORTANT ABI : better-sqlite3 est compilé pour Node vanilla. Ce runner ne
doit PAS être importé dans le process Electron : le main le lance en
sous-process via le même binaire Node que le serveur :
  node …/runner.js <dbPath>
Extrait TF gold (N4) — ops event optionnel via `@creezio/observability`.

### `src/historical-migrations/steps/017_agent_todos.ts`

- **Lignes** : 45

Step 017 — todos agent synchronisés avec Hermes Kanban.
Porté depuis scripts/migrate_v17_agent_todos.py.

### `src/historical-migrations/steps/020_api_keys.ts`

- **Lignes** : 33

Step 020 — clés API publiques (Zapier / Make / n8n).
Porté depuis scripts/migrate_v20_api_keys.py.

### `src/historical-migrations/steps/022_mcp_oauth.ts`

- **Lignes** : 59

Step 022 — OAuth 2.1 pour le serveur MCP (ChatGPT connectors).
Porté depuis scripts/migrate_v22_mcp_oauth.py.

### `src/historical-migrations/steps/023_users.ts`

- **Lignes** : 23

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/024_users_kind.ts`

- **Lignes** : 14

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/025_desktop_presence.ts`

- **Lignes** : 24

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/026_collab_ia_kanban.ts`

- **Lignes** : 41

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/027_mcp_admin.ts`

- **Lignes** : 50

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/028_plugin_product_hub.ts`

- **Lignes** : 143

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/029_unified_tasks.ts`

- **Lignes** : 169

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/030_plugin_prd_sections.ts`

- **Lignes** : 39

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/031_ai_recurrence_quotas.ts`

- **Lignes** : 25

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/032_plugin_acl.ts`

- **Lignes** : 26

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/033_database_automations.ts`

- **Lignes** : 30

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/034_emails.ts`

- **Lignes** : 54

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/035_usage_analytics.ts`

- **Lignes** : 48

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/historical-migrations/steps/index.ts`

- **Lignes** : 70
- **Exports** : `PLATFORM_HISTORICAL_STEP_VERSIONS`, `PlatformHistoricalStepVersion`, `platformHistoricalMigrations`, `platformHistoricalMigrationByName`

Registre des migrations historiques **plateforme** (TF gold N4).
Versions = schema_version brand.db (chaîne TF / Certivan héritée).
Les steps métier (catalogue, commandes, …) restent dans les marques.

### `src/historical-migrations/types.ts`

- **Lignes** : 65
- **Exports** : `HistoricalSqliteDb`, `HistoricalMigration`, `tableColumns`, `tableExists`, `addColumnIfMissing`, `Migration`

Contrat d'une migration SQLite historique (brand.db / schema_version).
IMPORTANT ABI : ces migrations tournent dans un process Node VANILLA
(spawn depuis le main Electron), jamais dans le process Electron lui-même,
pour charger better-sqlite3 compilé pour Node.
Extrait TF gold (N4) — ne pas inventer de DDL.

### `src/index.ts`

- **Lignes** : 408
- **Exports** : `ARCHITECTURE_VERSION`, `feedUrlForKind`, `meiliBinaryCandidates`, `resolveAssistantDbPath`, `resolveDbPath`, `resolveHermesHomeDir`, `resolveLocalConfigPath`, `resolveLogsDir`, `resolveMainLogPath`, `resolveMeiliDataDir`, `resolveN8nHomeDir`, `resolveNodeRuntimeDir`, `resolvePreloadPath`, `resolveResourcesRoot`, `resolveTunnelHomeDir`, `resolveUploadsDir`, `resolveUserDataDir`, `userDataDirForKind`, `ensureCoreDbParent`, `resolveCoreDbPathFromEnv`, `resolvePluginDocumentsDirFromEnv`, `DEPRECATED_SHADOW_ONLY`, `PLATFORM_STORES_CONTRACT`, `CORE_DB_FILENAME`, `PLUGIN_DB_SUBDIR`, `SQLITE_LAYOUT_DIR`, `ensureDay0SqliteLayout`, `ensurePluginDb`, `pluginDbExists`, `removePluginDb`, `resolveBrandDbPath`, `resolveCoreDbPath`, `resolveDay0SqlitePaths`, `resolvePluginDbPath`, `resolveSqliteRoot`, `openNodeSqliteDatabase`, `SQLITE_META_MIGRATION`, `SQLITE_MIGRATIONS_TABLE`, `composeMigrations`, `ensureMigrations`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/installer-prefs.ts`

- **Lignes** : 68
- **Exports** : `INSTALLER_PREFS_FILENAME`, `InstallerPrefs`, `installerPrefsPath`, `parseInstallerPrefs`, `consumeInstallerPrefsFile`

Préférences écrites par l'installeur NSIS (`installer-prefs.json` sous userData).
Consommées une seule fois au boot packagé pour synchroniser
`launchAtStartup` avec local-config marque + setLoginItemSettings.
Module pur (pas d'import Electron) — testable depuis Node.

### `src/licensing.ts`

- **Lignes** : 99
- **Exports** : `LicenseStatus`, `LicensingOptions`, `storeLicenseKey`, `checkLicense`

Licence desktop hors-ligne (Ed25519) — gold TempoFlow paramétré.
Format clé : `{keyPrefix}-<payload base64url>-<signature base64url>`
où payload = { email, plan, exp }. Vérification avec clé publique PEM
(env ou option) — aucune connexion serveur requise.

### `src/local-config-schema.ts`

- **Lignes** : 140
- **Exports** : `StoredValue`, `LocalBindHost`, `ConnectionProfile`, `TunnelServicePorts`, `TunnelPublicUrlsStored`, `TunnelMetaStored`, `EmbedMode`, `HermesEmbedConfig`, `N8nEmbedConfig`, `BackgroundSettings`, `RememberedServer`, `AiWorkspacePresentationSetting`, `LocalConfigFileV1`, `LOCAL_CONFIG_VERSION`, `isLocalConfigV1`, `emptyLocalConfig`, `TunnelConfigPublic`

Schéma local-config (userData-config.json) — aligné TF2 0.10.26.
Le chiffrement safeStorage est dans @creezio/electron-shell.

### `src/paths.ts`

- **Lignes** : 156
- **Exports** : `PathsContext`, `resolveUserDataDir`, `resolveDbPath`, `resolveLocalConfigPath`, `resolveAssistantDbPath`, `resolveUploadsDir`, `resolveMeiliDataDir`, `resolveHermesHomeDir`, `resolveN8nHomeDir`, `resolveLogsDir`, `resolveMainLogPath`, `resolveTunnelHomeDir`, `resolveNodeRuntimeDir`, `userDataDirForKind`, `feedUrlForKind`, `resolveResourcesRoot`, `meiliBinaryCandidates`, `resolvePreloadPath`

Utilitaires de chemins génériques — paramétrés par AppManifest.
Pas d'import Electron ici (testable depuis Node). L'appelant fournit
`userDataRoot` (ex. `app.getPath("userData")`) et `isPackaged`.
Source d'abstraction : electron/paths.ts (TF2 0.10.26 / Certivan / Fidu).

### `src/platform-stores-contract.ts`

- **Lignes** : 66
- **Exports** : `PlatformDomain`, `PlatformBackend`, `PlatformDomainContract`, `PLATFORM_STORES_CONTRACT`, `DEPRECATED_SHADOW_ONLY`

Contrat cutover stores plateforme (SoT kit core.db) — M8.
Zéro dual-write runtime. Extensions brand (ACL, kanban, PJ) hors SoT.

### `src/plugins/plugin-events.ts`

- **Lignes** : 86
- **Exports** : `PLUGIN_RUNTIME_FILE`, `PluginRuntimeEntry`, `PluginRuntimeState`, `pluginRuntimePath`, `writePluginRuntimeState`, `readPluginRuntimeState`, `pluginAcceptsHook`, `pluginHookUrl`, `pluginN8nWebhookUrl`, `PLUGIN_SITE_ID_BASE`, `PLUGIN_SITE_ID_SPAN`, `pluginSiteId`

Bus d'événements CRM → plugins — logique pure (TF2 0.10.26 plugin-events.ts).

### `src/plugins/plugin-execution-grant.ts`

- **Lignes** : 108
- **Exports** : `PluginGrantAction`, `PluginExecutionGrantPayload`, `issuePluginExecutionGrant`, `verifyPluginExecutionGrant`

Grants d'exécution plugins (product-hub) — port brand-agnostic TF2.
Préfixe token paramétrable (défaut `exec_` ; TF2 utilisait `tf2_exec_`).

### `src/plugins/plugin-manifest.ts`

- **Lignes** : 214
- **Exports** : `PLUGIN_MANIFEST_FILE`, `PluginPermission`, `PluginPanelConfig`, `PluginAcceptanceSmoke`, `PluginAcceptance`, `PluginManifest`, `DiscoveredPlugin`, `pluginsRootDir`, `pluginEnabledFlagPath`, `isValidPluginId`, `hasPluginPermission`, `parsePluginManifest`, `discoverPlugins`, `setPluginEnabled`, `pluginSiteId`

Contrat manifest + découverte plugins — port TF2 plugin-runtime.ts (partie pure).
Le spawn / control-api restent dans @creezio/electron-shell.

### `src/ports.ts`

- **Lignes** : 86
- **Exports** : `BindHost`, `findFreePort`, `httpGetStatus`, `waitForHealth`, `waitForMeiliHealth`

Helpers ports / health — purs Node (utilisés par launchers hôte).
Extrait de electron/server-launcher.ts (TF2 0.10.26).

### `src/profile-launch.ts`

- **Lignes** : 153
- **Exports** : `ProfileMode`, `ProfileLaunch`, `sanitizeProfileSegment`, `parseJoinDeepLink`, `parseProfileArgv`, `profileDirSegment`, `profileUserDataDir`, `profileArgFor`

Profils de lancement multi-instances — logique PURE.
Port brand-agnostic de electron/profile.ts (TF2 0.10.26).

### `src/recovery-key.ts`

- **Lignes** : 156
- **Exports** : `RecoveryVerifier`, `RecoveryEnvelope`, `RecoveryWrappedSecrets`, `generateRecoveryKey`, `normalizeRecoveryKey`, `createRecoveryVerifier`, `verifyRecoveryKey`, `wrapSecretsWithRecoveryKey`, `unwrapSecretsWithRecoveryKey`

Clé de récupération locale — port TF2 recovery-key.ts (pur crypto).

### `src/sqlite-driver.ts`

- **Lignes** : 48
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal (H2) — compatible node:sqlite DatabaseSync.
Les apps Electron peuvent injecter better-sqlite3 via `openDatabase`.
Pas d'`import.meta` — dual-build CJS (Electron) l'interdit.

### `src/sqlite-layout.ts`

- **Lignes** : 156
- **Exports** : `CORE_DB_FILENAME`, `SQLITE_LAYOUT_DIR`, `PLUGIN_DB_SUBDIR`, `resolveSqliteRoot`, `resolveCoreDbPath`, `resolveBrandDbPath`, `resolvePluginDbPath`, `EnsurePluginDbResult`, `ensurePluginDb`, `pluginDbExists`, `removePluginDb`, `resolveDay0SqlitePaths`, `ensureDay0SqliteLayout`

Layout SQLite multi-fichiers (Phase H1.0) — core / brand / plugin/<id>.
Migration depuis `resolveDbPath` :
- `resolveBrandDbPath` === `resolveDbPath` (même fichier `manifest.dbFileName`)
  pour ne pas casser les marques déjà branchées ;
- `resolveCoreDbPath` / `resolvePluginDbPath` sont les nouveaux chemins
  sous `{userData}/sqlite/` ;
- `resolveDbPath` reste un alias déprécié de la base métier (brand).
Voir docs/archive/PHASE-H1.md et ARCHITECTURE-INTENTION.md.

### `src/sqlite-migrations.ts`

- **Lignes** : 126
- **Exports** : `SQLITE_MIGRATIONS_TABLE`, `SqliteMigration`, `EnsureMigrationsResult`, `ensureMigrations`, `listAppliedMigrations`, `SQLITE_META_MIGRATION`, `composeMigrations`

Migrations SQLite par couche (H2.1).
Chaque fichier DB (core / brand / plugin/<id>) a sa propre table
`_creezio_schema_migrations` — pas de versioning partagé entre couches.

### `src/sqlite-runtime.ts`

- **Lignes** : 311
- **Exports** : `SqliteLayerKind`, `SqliteLayerRef`, `SqliteHandle`, `SqliteRuntimeStatus`, `OpenPluginResult`, `SqliteRuntime`, `CreateSqliteRuntimeOptions`, `createSqliteRuntime`, `resolveLayerPath`

Runtime multi-DB SQLite (H2.0) — handles core / brand / plugin/<id>.
Jour 0 serveur : ouvre **core + brand** uniquement.
Plugin : `openPlugin(id)` à l'install (ensurePluginDb + migrations).

### `src/tunnel-urls.ts`

- **Lignes** : 106
- **Exports** : `TUNNEL_EMBED_SERVICES`, `TunnelEmbedService`, `TunnelPublicUrls`, `tunnelServiceHostname`, `buildTunnelPublicUrls`, `deriveTunnelServiceUrl`, `portFromLocalUrl`

URLs publiques multi-niveau pour embeds via tunnel Cloudflare.
Port brand-agnostic de electron/tunnel-service-urls.ts (TF2 0.10.26).
CRM     : https://{slug}.{tunnelRootDomain}
n8n     : https://n8n.{slug}.{tunnelRootDomain}
Hermes  : https://hermes.{slug}.{tunnelRootDomain}

### `src/updater-state.ts`

- **Lignes** : 125
- **Exports** : `UpdateState`, `UpdateStatus`, `UpdateEvent`, `initialUpdateStatus`, `reduceUpdateEvent`

État auto-update — logique PURE (reduce), sans Electron.
Extrait de electron/updater.ts (TF2 0.10.26).

