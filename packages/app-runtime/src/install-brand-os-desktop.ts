/**
 * Couche supérieure : installBrandDesktopRuntime derrière la façade.
 * Hosts = composeBrandOs (kit). Vertical = adaptateurs kit + no-op métier.
 */
import path from "node:path";
import {
  AiScreencaster,
  AiWorkspaceManager,
  AssistantChromeOverlay,
  BridgeClient,
  createLocalSplashSteps,
  errorPageDataUrl,
  executeAiWorkspaceAction,
  getBootStage,
  getBootTimeline,
  initCrashReporter,
  installBrandDesktopRuntime,
  installGlobalHandlers,
  instrumentWebContents,
  isAiWorkspaceActionType,
  profilePickerHtml,
  reportCrash,
  reportCrashDebounced,
  setBootStage,
  type BrandDesktopDeps,
} from "@creezio/electron-shell";
import {
  buildEmbedEnvPanel,
  consumeInstallerPrefsFile,
  hermesPublicStatus,
  isEmbedEnvService,
  n8nPublicStatus,
  sanitizeHermesEmbedConfig,
  sanitizeN8nEmbedConfig,
  shouldSpawnEmbeddedHermes,
  shouldSpawnEmbeddedN8n,
} from "@creezio/platform-core";
import type { AppManifest } from "@creezio/brand-config";
import type { BrandOsComposition } from "./compose-brand-os.js";

export type InstallBrandOsDesktopOptions = {
  manifest: AppManifest;
  os: BrandOsComposition;
  electron: BrandDesktopDeps["electron"];
  appKind: string;
  bootBehavior: unknown;
  bootProfileLaunch: unknown;
  sessionPartition: string;
  /** Callback boot métier (kernel HTTP / Next déjà géré hors runtime). */
  bootBrandRuntime?: () => Promise<unknown>;
  shutdownBrandRuntime?: () => Promise<void>;
};

/**
 * Installe le runtime desktop prod (splash/tray/embeds) avec hosts kit.
 * Ne crée pas de fichiers host-stack dans la marque.
 */
export function installBrandOsDesktop(
  opts: InstallBrandOsDesktopOptions,
): void {
  const m = opts.manifest;
  const product = m.client.productName;
  const accent = "#0f3d32";
  const cssPrefix = m.brandId.slice(0, 2) || "cz";
  const stack = opts.os.hostStack;
  const paths = opts.os.paths;

  const errorBrand = {
    productName: product,
    bridgeName: m.bridgeName,
    accent,
    cssPrefix,
  };
  const pickerBrand = {
    productName: product,
    bridgeName: m.bridgeName,
    tunnelRootDomain: m.tunnelRootDomain || "localhost",
    deepLinkScheme: m.deepLinkProtocol,
    accent,
    cssPrefix,
  };
  const assistantBrand = {
    productName: product,
    assistantProtocol: `${m.deepLinkProtocol}-assistant`,
    accent,
  };

  installBrandDesktopRuntime({
    manifest: m,
    bridgeName: m.bridgeName,
    accentColor: accent,
    cssPrefix,
    envPrefix: m.envPrefix,
    sessionCookieName: `${m.brandId}_session`,
    profileArgPrefix: m.envPrefix.toLowerCase(),
    defaultDesktopPort: 18790,
    appKind: opts.appKind,
    bootBehavior: opts.bootBehavior,
    bootProfileLaunch: opts.bootProfileLaunch,
    sessionPartition: opts.sessionPartition,
    deepLinkProtocol: m.deepLinkProtocol,
    store: () => opts.os.store,
    hosts: {
      catalog: () => stack.hostCatalog(),
      factoryReset: () => stack.hostFactoryReset(),
      fleetAgent: () => stack.hostFleetAgent(),
      fleetSamples: () => stack.hostFleetSamples(),
      hermes: () => stack.hostHermes(),
      hermesCrmKey: () => stack.hostHermesCrmKey(),
      hermesSeed: () => stack.hostHermesSeed(),
      meili: () => stack.hostMeili(),
      meiliCoherence: () => stack.hostMeiliCoherence(),
      n8n: () => stack.hostN8n(),
      nodeRuntime: () => stack.hostNodeRuntime(),
      pluginAccept: () => stack.hostPluginAccept(),
      pluginControl: () => stack.hostPluginControl(),
      pluginRuntime: () => stack.hostPluginRuntime(),
      pluginTests: () => stack.hostPluginTests(),
      plugins: () => stack.hostPlugins(),
      server: () => stack.hostServer(),
      tunnel: () => stack.hostTunnel(),
    },
    paths: {
      userDataDir: paths.userDataDir,
      isPackaged: paths.isPackaged,
      resourcesRoot: paths.resourcesRoot,
      dbPath: paths.dbPath,
      meiliDataDir: paths.meiliDataDir,
      nodeBinary: paths.nodeBinary,
      nodeScript: paths.nodeScript,
      nodeModulesPathForScripts: paths.nodeModulesPathForScripts,
      preloadPath: paths.preloadPath,
    },
    vertical: {
      instrumentWebContents,
      googleLoginLoopback: async () => ({ ok: false, detail: "not_configured" }),
      checkLicense: async () => ({ ok: true, licensed: true }),
      parseJoinDeepLink: () => null,
      assertProfileReady: () => true,
      resolveBootProfile: () => ({ mode: "local", chosen: true }),
      sanitizeConnectionProfile: (p: unknown) => p,
      testRemoteHealth: async () => ({ ok: false }),
      hermesPublicStatus,
      sanitizeHermesEmbedConfig,
      shouldSpawnEmbeddedHermes,
      n8nPublicStatus,
      sanitizeN8nEmbedConfig,
      shouldSpawnEmbeddedN8n,
      buildEmbedEnvPanel,
      isEmbedEnvService,
      portFromLocalUrl: (url: string) => {
        try {
          return Number(new URL(url).port) || null;
        } catch {
          return null;
        }
      },
      createSupplierTabs: () => ({
        dispose: () => undefined,
        open: () => undefined,
      }),
      createAiWorkspaces: (
        win: ConstructorParameters<typeof AiWorkspaceManager>[0],
        view: ConstructorParameters<typeof AiWorkspaceManager>[1],
        tabs: ConstructorParameters<typeof AiWorkspaceManager>[2],
        o: ConstructorParameters<typeof AiWorkspaceManager>[3],
      ) => new AiWorkspaceManager(win, view, tabs, o),
      createAssistantChrome: (
        win: ConstructorParameters<typeof AssistantChromeOverlay>[0],
        onOpen: ConstructorParameters<typeof AssistantChromeOverlay>[1],
      ) => new AssistantChromeOverlay(win, onOpen, assistantBrand),
      createBridgeClient: (o: ConstructorParameters<typeof BridgeClient>[0]) =>
        new BridgeClient(o),
      createAiScreencaster: (
        o: ConstructorParameters<typeof AiScreencaster>[0],
      ) => new AiScreencaster(o),
      executeSupplierAction: async () => ({ ok: false }),
      executeAiWorkspaceAction,
      isAiWorkspaceActionType,
      errorPageDataUrl: (title: string, message: string) =>
        errorPageDataUrl(errorBrand, title, message),
      profilePickerHtml: (o: Parameters<typeof profilePickerHtml>[1]) =>
        profilePickerHtml(pickerBrand, o),
      consumeInstallerPrefsFile,
      bootBrandRuntime:
        opts.bootBrandRuntime ||
        (async () => ({ ok: true, kit: true })),
      shutdownBrandRuntime:
        opts.shutdownBrandRuntime || (async () => undefined),
      getActiveBrandRuntime: () => null,
      parseProfileArgv: () => ({ mode: "server" }),
      profileArgFor: () => [],
      profileUserDataDir: () => null,
      isAllowedServerCockpitPath: () => true,
      initCrashReporter,
      installGlobalHandlers,
      reportCrash,
      reportCrashDebounced,
      getBootTimeline,
      getBootStage,
      setBootStage,
    },
    createLocalSplashSteps: (o) =>
      createLocalSplashSteps({
        needIndex: true,
        needNode: o.needNode,
        needHermes: o.needHermes,
        needN8n: o.needN8n,
        needTunnel: o.needTunnel,
        catalogLabel: "Catalogue",
        nodeLabel: `Runtime Node ${product}`,
        includeRuntime: true,
        runtimeLabel: "Runtime plateforme",
      }),
    electron: opts.electron,
  });
}

/** Chemin preload marque. */
export function brandPreloadPath(electronDirname: string): string {
  return path.join(electronDirname, "preload.js");
}
