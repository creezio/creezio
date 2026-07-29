/**
 * @creezio/electron-shell — runtime Electron plateforme (Phase B / B.2).
 */

export {
  initLogger,
  log,
  logError,
  logFilePath,
  getLogRing,
  feedChildLine,
  setOpsLineHandler,
} from "./logger.js";

export {
  windowChromeBarHtml,
  windowChromeCss,
  windowChromeJs,
} from "./window-chrome.js";

export type {
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

export type { SetupAutoUpdaterOptions, UpdaterSend } from "./updater.js";
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
  openValue,
  sealValue,
} from "./host/safe-storage.js";

export type {
  LocalAuth,
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

export type { HermesHost, RunningHermes, StartHermesOptions } from "./host/hermes/launcher.js";
export { createHermesHost } from "./host/hermes/launcher.js";
export {
  ensureHermesRuntime,
  ensureHermesWebuiTree,
  getBootstrapError,
  getBootstrapPhase,
  hermesRuntimeCacheDir,
  hermesVendorDir,
  hermesWebuiInstallDir,
  loadRuntimeManifest,
  resolveHermesAgentDir,
  resolveHermesPython,
  __resetBootstrapStateForTests,
} from "./host/hermes/runtime-bootstrap.js";
export type { BootstrapPhase, RuntimeManifest } from "./host/hermes/runtime-bootstrap.js";

export type { N8nHost, RunningN8n, StartN8nOptions } from "./host/n8n/launcher.js";
export { createN8nHost } from "./host/n8n/launcher.js";
export {
  ensureN8nRuntime,
  getN8nBootstrapError,
  getN8nBootstrapPhase,
  loadN8nRuntimeManifest,
  n8nEntryPath,
  n8nRuntimeCacheDir,
  n8nVendorDir,
  __resetN8nBootstrapStateForTests,
} from "./host/n8n/runtime-bootstrap.js";
export type {
  N8nBootstrapPhase,
  N8nRuntimeManifest,
} from "./host/n8n/runtime-bootstrap.js";

export type { PluginsHost, RunningPlugin } from "./host/plugins/host.js";
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

export type { HostStack } from "./host/host-stack.js";
export { createHostStack, lazyHost } from "./host/host-stack.js";

export {
  createHostRuntime,
  localConfigPathForBoot,
  pathsContextFromBoot,
  prepareHostDesktop,
  vendorDir,
} from "./main-facade.js";
export type { CreateHostRuntimeOptions } from "./main-facade.js";
