/**
 * @creezio/electron-shell — desktop Electron plateforme (réduit P1.b).
 *
 * Ce package ne contient plus que le desktop pur : boot, fenêtres, tray,
 * updater, splash, chrome, sessions desktop, browser-tabs, télémétrie
 * WebContents. Le host runtime Node pur vit dans `@creezio/host-runtime`,
 * le sous-domaine Meili dans `@creezio/search`, les helpers ressources kit
 * dans `@creezio/platform-core`.
 *
 * Les ré-exports `@deprecated` ci-dessous préservent TOUTE la surface
 * publique historique (aucun import existant ne casse). Cette liste est
 * FIGÉE : ne jamais y ajouter un symbole host — gate
 * `test-phase-electron-shell-frozen-exports`.
 */

/* ═══════════════ Desktop natif (SoT ici) ═══════════════ */

export {
  windowChromeBarHtml,
  windowChromeCss,
  windowChromeJs,
} from "./window-chrome.js";

export type {
  SplashHtmlOptions,
  SplashStepId,
  SplashStepStatus,
  SplashStepView,
  SplashViewModel,
} from "./splash-ui.js";
export {
  SPLASH_STEP_WEIGHTS,
  activateSplashStep,
  completeSplashStep,
  computeOverallPercent,
  createLocalSplashSteps,
  createRemoteSplashSteps,
  createSplashModel,
  estimateEmbedPercent,
  formatElapsedMs,
  sanitizeSplashDetail,
  splashDataUrl,
  splashHtmlDocument,
  stepProgressRatio,
  updateSplashStep,
} from "./splash-ui.js";

export type {
  SetupAutoUpdaterOptions,
  UpdateStatus,
  UpdaterSend,
} from "./updater.js";
export {
  checkForUpdatesNow,
  downloadAndInstallUpdate,
  getUpdaterStatus,
  reduceUpdateEvent,
  registerUpdateIpc,
  sendUpdateToWebContents,
  setUpdaterRenderer,
  setupAutoUpdater,
} from "./updater.js";

export type { TrayAiWorkspaceEntry, TrayControllerOptions } from "./tray.js";
export {
  TrayController,
  applyLaunchAtStartup,
  installCloseToTray,
} from "./tray.js";

export {
  adminWindowVisible,
  closeAdminWindow,
  openAdminWindow,
} from "./admin-window.js";

export type {
  DesktopBootContext,
  PrepareDesktopBootOptions,
} from "./boot.js";
export { prepareDesktopBoot, writeAppKindFile } from "./boot.js";

export {
  createHostRuntime,
  localConfigPathForBoot,
  pathsContextFromBoot,
  prepareHostDesktop,
  vendorDir,
} from "./main-facade.js";
export type { CreateHostRuntimeOptions } from "./main-facade.js";

export { installBrandDesktopRuntime } from "./desktop/brand-desktop-runtime.js";
export type {
  BrandDesktopDeps,
  BrandDesktopHosts,
  BrandDesktopPaths,
  BrandDesktopVertical,
} from "./desktop/brand-desktop-runtime.js";

export type {
  DesktopSessionApi,
  DesktopSessionInfo,
  DesktopSessionStatus,
} from "./desktop/desktop-session.js";
export {
  createDesktopSessionStore,
  registerDesktopSessionIpc,
  spawnBrandMetierApi,
} from "./desktop/desktop-session.js";

export type {
  AssistantChromeBrand,
  AssistantChromeMode,
  ContentRect as AssistantChromeContentRect,
} from "./desktop/assistant-chrome.js";
export {
  ASSISTANT_FAB_MARGIN_PX,
  ASSISTANT_FAB_SIZE_PX,
  AssistantChromeOverlay,
  assistantFabScreenRect,
  rectsOverlap,
} from "./desktop/assistant-chrome.js";

export type {
  GoogleOAuthLoopbackOptions,
  GoogleOAuthTokenStore,
  GoogleTokens,
} from "./desktop/oauth-loopback.js";
export {
  googleLoginLoopback,
  storedGoogleTokens,
} from "./desktop/oauth-loopback.js";

export type {
  PickerRememberedServer,
  ProfilePickerBrand,
} from "./desktop/profile-picker-html.js";
export { profilePickerHtml } from "./desktop/profile-picker-html.js";

export type { ErrorPageBrand } from "./desktop/error-page-html.js";
export {
  errorPageDataUrl,
  errorPageHtmlDocument,
} from "./desktop/error-page-html.js";

export { instrumentWebContents } from "./host/web-telemetry.js";

/* ── N7 : browser tabs → import `@creezio/electron-shell/browser-tabs`
 * (pas le barrel principal : évite de tirer `electron` dans les tests Node). */

/* ═══════════════ Ré-exports compat P1.b — FIGÉS ═══════════════ */

/**
 * @deprecated P1.b — le logger host vit dans `@creezio/host-runtime` ;
 * importer depuis là. Ré-export de compat, surface figée.
 */
export {
  initLogger,
  initEarlyBootLogger,
  ensureLogsDir,
  log,
  logError,
  logFilePath,
  getLogRing,
  recentLines,
  logFileTail,
  scoped,
  feedChildLine,
  setOpsLineHandler,
} from "@creezio/host-runtime";
export type {
  EarlyBootLogResult,
  EarlyBootLogSource,
} from "@creezio/host-runtime";

/**
 * @deprecated P1.b — factory-reset runtime déplacé dans
 * `@creezio/host-runtime` ; importer depuis là.
 */
export {
  factoryResetSessionPartition,
  wipeLocalUserData,
} from "@creezio/host-runtime";

/**
 * @deprecated P1.b — sous-domaine Meili déplacé dans `@creezio/search` ;
 * importer depuis là.
 */
export type { RunningMeili, StartMeiliOptions } from "@creezio/search";
export { startMeili } from "@creezio/search";

/**
 * @deprecated P1.b — host runtime Node pur déplacé dans
 * `@creezio/host-runtime` ; importer depuis là.
 */
export type {
  BrandKernelHttpHandle,
  BrandKernelLike,
} from "@creezio/host-runtime";
export { listenBrandKernelHttp } from "@creezio/host-runtime";

/**
 * @deprecated P1.b — boot Meili marque déplacé dans `@creezio/search` ;
 * importer depuis là.
 */
export type { BrandMeiliBootResult } from "@creezio/search";
export {
  isMeiliRequiredError,
  maybeBootBrandMeili,
  MeiliRequiredError,
} from "@creezio/search";

/**
 * @deprecated P1.b — déplacé dans `@creezio/host-runtime`.
 */
export type {
  RunningServer,
  StartServerCoreOptions,
  StartServerPaths,
} from "@creezio/host-runtime";
export {
  findFreePort,
  startNextServerCore,
  waitForHealth,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  HermesLaunchRequest,
  HostProcessHandle,
  N8nLaunchRequest,
  TunnelLaunchRequest,
} from "@creezio/host-runtime";
export {
  DEFAULT_HOST_ONLY_ELECTRON_MODULES,
  buildEmbedHostEnv,
  cloudflaredEnvKey,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  HostLogFn,
  HostRuntimeContext,
} from "@creezio/host-runtime";
export { hostLog, hostProductName } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { SafeStorageBackend } from "@creezio/host-runtime";
export {
  canEncrypt,
  loadElectronSafeStorage,
  loadElectronSafeStorageSync,
  openValue,
  sealValue,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  LocalAuth,
  LocalConfigPath,
  LocalConfigStore,
  LocalConfigStoreOptions,
  TunnelConfig,
} from "@creezio/host-runtime";
export {
  createLocalConfigStore,
  createLocalConfigStoreSync,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  TunnelIngressPorts,
  TunnelRuntimeStatus,
  TunnelService,
} from "@creezio/host-runtime";
export {
  createTunnelService,
  buildTunnelPublicUrls,
  deriveTunnelServiceUrl,
} from "@creezio/host-runtime";
export type {
  CloudflaredExitInfo,
  CloudflaredRespawnDecision,
  CloudflaredRespawnPolicy,
} from "@creezio/host-runtime";
export {
  CLOUDFLARED_RESPAWN,
  cloudflaredRespawnDelayMs,
  describeCloudflaredExit,
  resolveCloudflaredRespawnPolicy,
  shouldRespawnCloudflared,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  DESKTOP_NODE_MIN_FOR_EMBEDS,
  DESKTOP_NODE_PIN,
  TF2_NODE_MIN_FOR_EMBEDS,
  TF2_NODE_PIN,
  buildIsolatedNodeEnv,
  compareNodeVersions,
  ensureDesktopNode,
  ensureTempoflowNode,
  envForNodeScriptSpawn,
  nodeSatisfiesMin,
  nodeUserBinary,
  nodeUserDir,
  parseNodeVersion,
  probeNodeVersion,
  resolveDesktopNodeBinary,
  resolveTempoflowNodeBinary,
} from "@creezio/host-runtime";
export type { EnsureDesktopNodeResult, NodeVersionTriple } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  DESKTOP_NPM_PIN,
  TF2_NPM_PIN,
  ensureNpmCli,
  npmCliCandidates,
  npmUserDataRoot,
  resolveNpmCliPath,
  runNpmCli,
} from "@creezio/host-runtime";
export type { EnsureNpmCliResult } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  applyOsSandboxEnv,
  buildHermesMcpYamlBlock,
  buildHermesSandboxYamlBlock,
  desktopSandboxPaths,
  ensureSandboxGitConfig,
  hermesSandboxPaths,
  sanitizeHermesMcpServerName,
  setSandboxEnvVar,
  tempoflowSandboxPaths,
  upsertHermesMcpConfig,
  upsertHermesSandboxConfig,
  DESKTOP_MCP_ENTRY_MARKER_BEGIN,
  DESKTOP_MCP_ENTRY_MARKER_END,
  DESKTOP_MCP_MARKER_BEGIN,
  DESKTOP_MCP_MARKER_END,
  DESKTOP_SANDBOX_MARKER_BEGIN,
  DESKTOP_SANDBOX_MARKER_END,
} from "@creezio/host-runtime";
export type { HermesMcpServerConfig } from "@creezio/host-runtime";
export {
  buildConfinedPath,
  overridesAllowed,
  resolveSystemBinary,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  HermesHost,
  HermesStatusPayload,
  RunningHermes,
  StartHermesOptions,
} from "@creezio/host-runtime";
export {
  clearGeneratedWebuiPassword,
  createHermesHost,
  serverWebuiPassword,
} from "@creezio/host-runtime";
export {
  LEARNED_SITE_SKILL_PREFIX,
  brandHermesSkillsDirCandidates,
  isLearnedSiteSkillName,
  kitHermesSkillsDir,
  seedHermesSkillsFromDirs,
} from "@creezio/host-runtime";
export {
  WEBUI_DEPS_MARKER,
  WEBUI_DEPS_MARKER_LEGACY,
  WEBUI_DEPS_MARKER_LEGACY_CERTIVAN,
  WEBUI_DEPS_MARKER_LEGACY_FIDU,
  ensureHermesRuntime,
  ensureHermesWebuiTree,
  getBootstrapError,
  getBootstrapPhase,
  hermesAgentDirCandidates,
  hermesFhsFallbackDirs,
  hermesInstallLayoutEnv,
  hermesInstallOsProfileDir,
  hermesRuntimeCacheDir,
  hermesSpaceSafeUserDataRoot,
  patchHermesInstallShForSpaces,
  hermesVendorDir,
  hermesWebuiInstallDir,
  installHermesAgent,
  isWebuiDepsMarkerCurrent,
  loadRuntimeManifest,
  readWebuiDepsMarker,
  resolveHermesAgentDir,
  resolveHermesPython,
  vendoredInstallScriptPath,
  webuiDepsMarkerPath,
  webuiPythonDepsReady,
  writeWebuiDepsMarker,
  __resetBootstrapStateForTests,
} from "@creezio/host-runtime";
export type { BootstrapPhase, RuntimeManifest } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  N8nAgentKeysHooks,
  N8nHost,
  N8nStatusPayload,
  RunningN8n,
  StartN8nOptions,
} from "@creezio/host-runtime";
export { createN8nHost } from "@creezio/host-runtime";
export {
  ensureN8nRuntime,
  getN8nBootstrapError,
  getN8nBootstrapPhase,
  loadN8nRuntimeManifest,
  n8nEntryPath,
  n8nPackageJsonPath,
  n8nRuntimeCacheDir,
  n8nVendorDir,
  __resetN8nBootstrapStateForTests,
} from "@creezio/host-runtime";

/**
 * @deprecated P1.b — helpers ressources kit déplacés dans
 * `@creezio/platform-core` ; importer depuis là.
 */
export {
  electronShellPackageRoot,
  kitOsResourcesRoot,
  kitOsVendorDir,
} from "@creezio/platform-core";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  ensureKitOsBinaries,
  kitBinaryPaths,
  type EnsureKitBinariesResult,
  type KitBinaryName,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { N8nApiKeyBrand, N8nApiKeyStored } from "@creezio/host-runtime";
export {
  N8N_HERMES_API_SCOPES,
  cookieHeaderFromSetCookie,
  ensureN8nApiKey,
  extractRawN8nApiKey,
  fetchN8nApiKeyScopes,
  getN8nBridgeEnv,
  n8nApiKeyPath,
  n8nHttpJson,
  n8nLoginSucceeded,
  n8nNeedsOwnerSetup,
  readStoredN8nApiKey,
  writeStoredN8nApiKey,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  N8nAgentIsolationBrand,
  N8nAgentKeyStored,
  N8nAgentKeysFile,
} from "@creezio/host-runtime";
export {
  agentIdSegment,
  ensureHermesAgentWorkspace,
  ensureN8nAgentApiKey,
  hermesAgentWorkspaceDir,
  n8nAgentKeyLabel,
  n8nAgentKeysPath,
  n8nAgentTag,
  readStoredN8nAgentKeys,
  revokeN8nAgentApiKey,
  writeStoredN8nAgentKeys,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  HermesCrmKeyBrand,
  HermesCrmKeyPaths,
  HermesCrmKeyStored,
} from "@creezio/host-runtime";
export {
  ensureHermesCrmApiKey,
  generateHermesCrmApiKey,
  getHermesFullBridgeEnv,
  hermesCrmKeyPath,
  readHermesCrmApiKey,
  writeHermesCrmApiKey,
} from "@creezio/host-runtime";
export type {
  N8nBootstrapPhase,
  N8nRuntimeManifest,
} from "@creezio/host-runtime";

/**
 * @deprecated P1.b — plugins host (runtime plugins TF → kit, Phase N1)
 * déplacés dans `@creezio/host-runtime`.
 */
export type {
  PluginsHost,
  HostRunningPlugin,
} from "@creezio/host-runtime";
export {
  PLUGIN_VERTICAL_REMAINING,
  createPluginsHost,
} from "@creezio/host-runtime";
export {
  ensurePluginControlToken,
  generatePluginControlToken,
  getPluginControlBridgeEnv,
  pluginControlTokenPath,
  pluginControlTokenPrefix,
  readPluginControlToken,
} from "@creezio/host-runtime";
export type { StartHostPluginControlPlaneOptions } from "@creezio/host-runtime";
export { startHostPluginControlPlane } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  PluginHostBindings,
  PluginLlmKeys,
} from "@creezio/host-runtime";
export {
  __resetPluginHostBindingsForTests,
  assignPluginEnv,
  configurePluginHost,
  getPluginHostBindings,
  pluginCrmKeyFileName,
  pluginEnvKeys,
  pluginGitIdentity,
  resolveApplyOsSandboxEnv,
  resolveBuildIsolatedNodeEnv,
  resolveFindFreePort,
  tryGetPluginHostBindings,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  DiscoveredPlugin,
  PluginAcceptance,
  PluginAcceptanceSmoke,
  PluginManifest,
  PluginPanelConfig,
  PluginPermission,
} from "@creezio/host-runtime";
export {
  PLUGIN_MANIFEST_FILE,
  discoverPlugins,
  hasPluginPermission,
  isValidPluginId,
  parsePluginManifest,
  pluginEnabledFlagPath,
  pluginSiteId,
  pluginsRootDir,
  scaffoldPlugin,
  scaffoldPluginUiCss,
  setPluginEnabled,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { RunningPlugin } from "@creezio/host-runtime";
export {
  createPluginScaffold,
  createPluginScaffoldWithGit,
  deletePlugin,
  enablePlugin,
  getPluginLogs,
  getPluginVersions,
  getPluginsCrmPort,
  getRunningPlugins,
  listPlugins,
  pluginsStatusPayload,
  pluginsStatusPayloadWithGit,
  proxyPluginHealth,
  resolvePluginPanel,
  restartPlugin,
  restorePluginToVersion,
  setPluginsCrmPort,
  startEnabledPlugins,
  stopAllPlugins,
  writePluginFiles,
  writePluginFilesAndCommit,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  PluginGitCommit,
  PluginGitStatus,
} from "@creezio/host-runtime";
export {
  bumpPluginManifestPatch,
  commitPluginChanges,
  ensurePluginGitRepo,
  getPluginGitStatus,
  isPluginGitRepo,
  listPluginVersions,
  resetGitBinaryCache,
  resolveGitBinary,
  restorePluginVersion,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  PluginControlApiState,
} from "@creezio/host-runtime";
export {
  PLUGIN_CONTROL_PREFERRED_PORT,
  archivePluginRuntime,
  createPluginExecutionGrant,
  getPluginControlApi,
  getPluginControlApiBridgeEnv,
  handleBrandExtras,
  handlePluginControlExtras,
  migratePluginData,
  startPluginControlApi,
  stopPluginControlApi,
  validatePluginExecutionGrant,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export { buildPluginControlPlaneAdapters } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { PluginCrmKeyStored } from "@creezio/host-runtime";
export {
  PLUGIN_CRM_KEY_FILE,
  ensurePluginCrmApiKey,
  pluginCrmKeyPath,
  readPluginCrmApiKey,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  AcceptCheckItem,
  AcceptCheckResult,
} from "@creezio/host-runtime";
export {
  resolvePluginSmokes,
  runPluginAcceptCheck,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { PluginTestResult } from "@creezio/host-runtime";
export { runPluginTests } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { PluginDataMigrationReport } from "@creezio/host-runtime";
export {
  applyPluginDataMigrations,
  runPluginDataCli,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  PLUGIN_RUNTIME_FILE,
  PLUGIN_SITE_ID_BASE,
  PLUGIN_SITE_ID_SPAN,
  pluginAcceptsHook,
  pluginHookUrl,
  pluginN8nWebhookUrl,
  pluginRuntimePath,
  readPluginRuntimeState,
  writePluginRuntimeState,
} from "@creezio/host-runtime";
export type {
  PluginRuntimeEntry,
  PluginRuntimeState,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export {
  issuePluginExecutionGrant,
  verifyPluginExecutionGrant,
} from "@creezio/host-runtime";
export type {
  PluginExecutionGrantPayload,
  PluginGrantAction,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { HostStack } from "@creezio/host-runtime";
export { createHostStack, lazyHost } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  BrandHostPathsModule,
  BrandHostStack,
  BrandHostStackConfig,
  BrandLocalConfigStoreLike,
} from "@creezio/host-runtime";
export { createBrandHostStack } from "@creezio/host-runtime";
export type {
  BrandFleetInput,
  BrandHostRuntimeConfig,
  BrandHostSingletons,
  BrandRuntimePaths,
} from "@creezio/host-runtime";
export {
  brandEnsureCrmKeyDbScript,
  createBrandHostRuntime,
  createBrandHostRuntimeContext,
  createHermesCrmKeyPaths,
  createHermesCrmKeySurface,
  createHermesCrmOnlyBridgeEnv,
  createN8nAgentKeysHooks,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  FeatureOffFleetAgentHost,
  FeatureOffFleetSamplesHost,
  FeatureOffHost,
  FeatureOffHostOptions,
  FeatureOffPluginAcceptHost,
  FeatureOffPluginControlExtras,
  FeatureOffPluginTestsHost,
  FeatureOffPluginsHost,
  FeatureOffPluginsStatus,
} from "@creezio/host-runtime";
export { createFeatureOffHost } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { CrashKind, CrashReporterConfig } from "@creezio/host-runtime";
export {
  configureCrashReporter,
  crashEndpoint,
  crashLogHint,
  crashReportsDir,
  flushPendingCrashReports,
  getBootStage,
  getBootTimeline,
  getInstallId,
  initCrashReporter,
  installGlobalHandlers,
  installEarlyCrashWriter,
  reportCrash,
  reportCrashDebounced,
  setBootStage,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type { BridgeOptions } from "@creezio/host-runtime";
export { BridgeClient } from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  BrandServerLauncherDeps,
  ServerSpawnFn,
  StartBrandServerOptions,
} from "@creezio/host-runtime";
export {
  startBrandNextServer,
  findServerFreePort,
  waitForServerHealth,
} from "@creezio/host-runtime";

/** @deprecated P1.b — déplacé dans `@creezio/host-runtime`. */
export type {
  AiWorkspaceHostBindings,
  AiWorkspaceInfo,
  AiWorkspaceManagerOptions,
  AiWorkspacePresentation,
  AiWorkspaceUiActionRequest,
  AiProfileWindowOptions,
  AiScreencasterOptions,
  AiSupplierTabsFactory,
  AiSupplierTabsLike,
  AiTabInfo,
  PostFrameResult,
  SupplierActionRequest,
} from "@creezio/host-runtime";
export {
  AiProfileWindow,
  AiScreencaster,
  AiWorkspaceManager,
  __resetAiWorkspaceHostBindingsForTests,
  aiPartitionName,
  aiShareWebSessions,
  aiSupplierPartitionPrefix,
  configureAiWorkspaceHost,
  executeAiWorkspaceAction,
  getAiWorkspaceHostBindings,
  isAiWorkspaceActionType,
  tryGetAiWorkspaceHostBindings,
} from "@creezio/host-runtime";

/** @deprecated P1.b — sous-domaine Meili déplacé dans `@creezio/search`. */
export type {
  BrandMeiliDocument,
  BrandMeiliFeed,
  BrandMeiliIndexSpec,
  CatalogIndexUid,
  CatalogSqlCounts,
  CoherenceDbSnapshot,
  GedIndexUid,
  GedSqlCounts,
  GenericCatalogIndexUid,
  MeiliCatalogSqlTables,
  MeiliCoherencePaths,
  MeiliFingerprint,
  MeiliIndexInProgress,
  MeiliBrowseRequest,
  MeiliBrowseResult,
  MeiliReadyDecision,
} from "@creezio/search";
export {
  CATALOG_INDEXES,
  GED_INDEXES,
  GENERIC_CATALOG_INDEXES,
  INDEX_SCHEMA_VERSION,
  MEILI_FINGERPRINT_META_KEY,
  MEILI_INDEX_IN_PROGRESS_KEY,
  buildFingerprint,
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  configureMeiliCoherencePaths,
  countCatalogSql,
  countGedSql,
  decideMeiliReady,
  expectedCountsForFeed,
  expectedMeiliCounts,
  getMeiliBrandFeed,
  meiliCoherenceScriptPath,
  getMeiliCatalogSqlTables,
  parseFingerprint,
  readCoherenceDbSnapshot,
  readFingerprintFromDb,
  readIndexInProgress,
  readSqliteSchemaVersion,
  resetMeiliBrandFeedForTests,
  resetMeiliCatalogSqlTablesForTests,
  runFeedIndexation,
  runIndexation,
  browseMeiliIndex,
  meiliFilterEq,
  searchMeiliIndexes,
  serializeFingerprint,
  writeFingerprintToDb,
} from "@creezio/search";
