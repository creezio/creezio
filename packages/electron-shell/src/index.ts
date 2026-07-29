/**
 * @creezio/electron-shell — runtime Electron plateforme (Phase B).
 *
 * Consommation future (Phase G) :
 * ```ts
 * import { certivanManifest } from "@creezio/brand-config";
 * import { prepareDesktopBoot, setupAutoUpdater, TrayController } from "@creezio/electron-shell";
 *
 * const boot = await prepareDesktopBoot(certivanManifest);
 * await setupAutoUpdater({ feedUrl: certivanManifest.client.feedUrl });
 * ```
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
