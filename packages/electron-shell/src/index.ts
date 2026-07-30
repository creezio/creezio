/**
 * @creezio/electron-shell — runtime Electron plateforme (Phase B / B.2).
 */

export {
  initLogger,
  log,
  logError,
  logFilePath,
  getLogRing,
  recentLines,
  logFileTail,
  scoped,
  feedChildLine,
  setOpsLineHandler,
} from "./logger.js";

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
  factoryResetSessionPartition,
  wipeLocalUserData,
} from "./factory-reset-runtime.js";

export type { RunningMeili, StartMeiliOptions } from "./host/meili-launcher.js";
export { startMeili } from "./host/meili-launcher.js";

export type {
  RunningServer,
  StartServerCoreOptions,
  StartServerPaths,
} from "./host/server-env.js";
export {
  findFreePort,
  startNextServerCore,
  waitForHealth,
} from "./host/server-env.js";

export type {
  HermesLaunchRequest,
  HostProcessHandle,
  N8nLaunchRequest,
  TunnelLaunchRequest,
} from "./host/contracts.js";
export {
  DEFAULT_HOST_ONLY_ELECTRON_MODULES,
  buildEmbedHostEnv,
  cloudflaredEnvKey,
} from "./host/contracts.js";

/* ── Phase B.2 ── */
export type {
  HostLogFn,
  HostRuntimeContext,
  TunnelProvisionConfig,
} from "./host/context.js";
export { hostLog, hostProductName } from "./host/context.js";

export type { SafeStorageBackend } from "./host/safe-storage.js";
export {
  canEncrypt,
  loadElectronSafeStorage,
  loadElectronSafeStorageSync,
  openValue,
  sealValue,
} from "./host/safe-storage.js";

export type {
  LocalAuth,
  LocalConfigPath,
  LocalConfigStore,
  LocalConfigStoreOptions,
  TunnelConfig,
} from "./host/local-config.js";
export {
  createLocalConfigStore,
  createLocalConfigStoreSync,
} from "./host/local-config.js";

export type {
  TunnelIngressPorts,
  TunnelRuntimeStatus,
  TunnelService,
} from "./host/tunnel/tunnel.js";
export {
  createTunnelService,
  buildTunnelPublicUrls,
  deriveTunnelServiceUrl,
} from "./host/tunnel/tunnel.js";

export {
  DESKTOP_NODE_MIN_FOR_EMBEDS,
  DESKTOP_NODE_PIN,
  TF2_NODE_MIN_FOR_EMBEDS,
  TF2_NODE_PIN,
  buildIsolatedNodeEnv,
  compareNodeVersions,
  ensureDesktopNode,
  ensureTempoflowNode,
  nodeSatisfiesMin,
  nodeUserBinary,
  nodeUserDir,
  parseNodeVersion,
  probeNodeVersion,
  resolveDesktopNodeBinary,
  resolveTempoflowNodeBinary,
} from "./host/node-runtime.js";
export type { EnsureDesktopNodeResult, NodeVersionTriple } from "./host/node-runtime.js";

export {
  DESKTOP_NPM_PIN,
  TF2_NPM_PIN,
  ensureNpmCli,
  npmCliCandidates,
  npmUserDataRoot,
  resolveNpmCliPath,
  runNpmCli,
} from "./host/npm-cli.js";
export type { EnsureNpmCliResult } from "./host/npm-cli.js";

export {
  applyOsSandboxEnv,
  buildHermesSandboxYamlBlock,
  desktopSandboxPaths,
  ensureSandboxGitConfig,
  hermesSandboxPaths,
  setSandboxEnvVar,
  tempoflowSandboxPaths,
  upsertHermesSandboxConfig,
  DESKTOP_SANDBOX_MARKER_BEGIN,
  DESKTOP_SANDBOX_MARKER_END,
} from "./host/sandbox/embed-sandbox.js";
export {
  buildConfinedPath,
  overridesAllowed,
  resolveSystemBinary,
} from "./host/sandbox/os-sandbox.js";

export type {
  HermesHost,
  HermesStatusPayload,
  RunningHermes,
  StartHermesOptions,
} from "./host/hermes/launcher.js";
export {
  clearGeneratedWebuiPassword,
  clearTempoflowGeneratedWebuiPassword,
  createHermesHost,
} from "./host/hermes/launcher.js";
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
  hermesInstallOsProfileDir,
  hermesRuntimeCacheDir,
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
} from "./host/hermes/runtime-bootstrap.js";
export type { BootstrapPhase, RuntimeManifest } from "./host/hermes/runtime-bootstrap.js";

export type {
  N8nAgentKeysHooks,
  N8nHost,
  N8nStatusPayload,
  RunningN8n,
  StartN8nOptions,
} from "./host/n8n/launcher.js";
export { createN8nHost } from "./host/n8n/launcher.js";
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
} from "./host/n8n/runtime-bootstrap.js";

/* ── O3 : jumeaux Electron plateforme (extract gold TF) ── */
export type { N8nApiKeyBrand, N8nApiKeyStored } from "./host/n8n/api-key.js";
export {
  N8N_HERMES_API_SCOPES,
  cookieHeaderFromSetCookie,
  ensureN8nApiKey,
  extractRawN8nApiKey,
  fetchN8nApiKeyScopes,
  getN8nBridgeEnv,
  n8nApiKeyPath,
  n8nHttpJson,
  readStoredN8nApiKey,
  writeStoredN8nApiKey,
} from "./host/n8n/api-key.js";

export type {
  N8nAgentIsolationBrand,
  N8nAgentKeyStored,
  N8nAgentKeysFile,
} from "./host/n8n/agent-isolation.js";
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
} from "./host/n8n/agent-isolation.js";

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

export type {
  HermesCrmKeyBrand,
  HermesCrmKeyPaths,
  HermesCrmKeyStored,
} from "./host/hermes/crm-key.js";
export {
  ensureHermesCrmApiKey,
  generateHermesCrmApiKey,
  getHermesFullBridgeEnv,
  hermesCrmKeyPath,
  readHermesCrmApiKey,
  writeHermesCrmApiKey,
} from "./host/hermes/crm-key.js";
export type {
  N8nBootstrapPhase,
  N8nRuntimeManifest,
} from "./host/n8n/runtime-bootstrap.js";

export type {
  PluginsHost,
  RunningPlugin as HostRunningPlugin,
} from "./host/plugins/host.js";
export {
  PLUGIN_VERTICAL_REMAINING,
  createPluginsHost,
} from "./host/plugins/host.js";
export {
  ensurePluginControlToken,
  generatePluginControlToken,
  getPluginControlBridgeEnv,
  pluginControlTokenPath,
  pluginControlTokenPrefix,
  readPluginControlToken,
} from "./host/plugins/control-token.js";
export type { StartHostPluginControlPlaneOptions } from "./host/plugins/control-plane.js";
export { startHostPluginControlPlane } from "./host/plugins/control-plane.js";

/* ── Phase N1 : runtime plugins TF → kit ── */
export type {
  PluginHostBindings,
  PluginLlmKeys,
} from "./host/plugins/brand-bindings.js";
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
} from "./host/plugins/brand-bindings.js";

export type {
  DiscoveredPlugin,
  PluginAcceptance,
  PluginAcceptanceSmoke,
  PluginManifest,
  PluginPanelConfig,
  PluginPermission,
} from "./host/plugins/runtime.js";
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
} from "./host/plugins/runtime.js";

export type { RunningPlugin } from "./host/plugins/launcher.js";
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
} from "./host/plugins/launcher.js";

export type {
  PluginGitCommit,
  PluginGitStatus,
} from "./host/plugins/git.js";
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
} from "./host/plugins/git.js";

export type {
  PluginControlApiState,
} from "./host/plugins/control-extras.js";
export {
  PLUGIN_CONTROL_PREFERRED_PORT,
  archivePluginRuntime,
  createPluginExecutionGrant,
  getPluginControlApi,
  /** Bridge env depuis API running (TF gold) — distinct du helper token+ctx. */
  getPluginControlBridgeEnv as getPluginControlApiBridgeEnv,
  handleBrandExtras,
  handlePluginControlExtras,
  migratePluginData,
  startPluginControlApi,
  stopPluginControlApi,
  validatePluginExecutionGrant,
} from "./host/plugins/control-extras.js";

export { buildPluginControlPlaneAdapters } from "./host/plugins/control-adapters.js";

export type { PluginCrmKeyStored } from "./host/plugins/crm-key.js";
export {
  PLUGIN_CRM_KEY_FILE,
  ensurePluginCrmApiKey,
  pluginCrmKeyPath,
  readPluginCrmApiKey,
} from "./host/plugins/crm-key.js";

export type {
  AcceptCheckItem,
  AcceptCheckResult,
} from "./host/plugins/accept-check.js";
export {
  resolvePluginSmokes,
  runPluginAcceptCheck,
} from "./host/plugins/accept-check.js";

export type { PluginTestResult } from "./host/plugins/test-runner.js";
export { runPluginTests } from "./host/plugins/test-runner.js";

export type { PluginDataMigrationReport } from "./host/plugins/data.js";
export {
  applyPluginDataMigrations,
  runPluginDataCli,
} from "./host/plugins/data.js";

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
} from "./host/plugins/events.js";
export type {
  PluginRuntimeEntry,
  PluginRuntimeState,
} from "./host/plugins/events.js";

export {
  issuePluginExecutionGrant,
  verifyPluginExecutionGrant,
} from "./host/plugins/execution-grant.js";
export type {
  PluginExecutionGrantPayload,
  PluginGrantAction,
} from "./host/plugins/execution-grant.js";

export type { HostStack } from "./host/host-stack.js";
export { createHostStack, lazyHost } from "./host/host-stack.js";

/* ── Phase N5 : feature-off host (marques sans plugins/flotte) ── */
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
} from "./host/feature-off-host.js";
export { createFeatureOffHost } from "./host/feature-off-host.js";

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

/* ── Phase N2 : jumeaux hosts → kit ── */
export type { CrashKind, CrashReporterConfig } from "./host/crash-reporter.js";
export {
  configureCrashReporter,
  crashEndpoint,
  getBootStage,
  getBootTimeline,
  getInstallId,
  initCrashReporter,
  installGlobalHandlers,
  reportCrash,
  reportCrashDebounced,
  setBootStage,
} from "./host/crash-reporter.js";

export { instrumentWebContents } from "./host/web-telemetry.js";

export type { BridgeOptions } from "./host/bridge-client.js";
export { BridgeClient } from "./host/bridge-client.js";

export type {
  BrandServerLauncherDeps,
  ServerSpawnFn,
  StartBrandServerOptions,
} from "./host/server-launcher.js";
export {
  startBrandNextServer,
  findFreePort as findServerFreePort,
  waitForHealth as waitForServerHealth,
} from "./host/server-launcher.js";

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
} from "./host/ai-workspace/index.js";
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
} from "./host/ai-workspace/index.js";

/* ── N7 : browser tabs → import `@creezio/electron-shell/browser-tabs`
 * (pas le barrel principal : évite de tirer `electron` dans les tests Node). */

export type {
  CatalogIndexUid,
  CatalogSqlCounts,
  CoherenceDbSnapshot,
  GedIndexUid,
  GedSqlCounts,
  MeiliCoherencePaths,
  MeiliFingerprint,
  MeiliIndexInProgress,
  MeiliReadyDecision,
} from "./host/meili/index.js";
export {
  CATALOG_INDEXES,
  GED_INDEXES,
  INDEX_SCHEMA_VERSION,
  MEILI_FINGERPRINT_META_KEY,
  MEILI_INDEX_IN_PROGRESS_KEY,
  buildFingerprint,
  configureMeiliCoherencePaths,
  countCatalogSql,
  countGedSql,
  decideMeiliReady,
  expectedMeiliCounts,
  parseFingerprint,
  readCoherenceDbSnapshot,
  readFingerprintFromDb,
  readIndexInProgress,
  readSqliteSchemaVersion,
  runIndexation,
  serializeFingerprint,
  writeFingerprintToDb,
} from "./host/meili/index.js";
