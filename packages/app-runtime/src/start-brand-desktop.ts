/**
 * Façade desktop marque — absorbe l'orchestration OS.
 * Profile `full` : hosts Hermes/n8n/tunnel + MCP HTTP + tasks/mails.
 * Profile `lite` : kernel + Meili seulement.
 */
import fs from "node:fs";
import path from "node:path";
import {
  guessPackagedDataDir,
  resolvePackagedDataDir,
} from "@creezio/platform-core";
import {
  initLogger,
  initEarlyBootLogger,
  ensureLogsDir,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
  createDesktopSessionStore,
  registerDesktopSessionIpc,
  listenBrandKernelHttp,
  maybeBootBrandMeili,
  ensureKitOsBinaries,
  kitBinaryPaths,
  configureCrashReporter,
  initCrashReporter,
  installGlobalHandlers,
  reportCrash,
  crashEndpoint,
  crashLogHint,
  crashReportsDir,
} from "@creezio/electron-shell";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createNavShellAdapter } from "@creezio/shell-ui";
import {
  brandKernelBooter,
  type BrandKernelBoot,
} from "./create-brand-kernel.js";
import { composeBrandOs } from "./compose-brand-os.js";
import { listenBrandOsHttp } from "./listen-brand-os-http.js";
import {
  mcpSurfaceHandlesPath,
  mountBrandMcpSurface,
} from "./mount-brand-mcp-surface.js";
import { startBrandUiPlane } from "./start-brand-ui-plane.js";
import { installBrandOsDesktop } from "./install-brand-os-desktop.js";
import { warmBrandNativeHosts } from "./warm-brand-native-hosts.js";
import type {
  BrandDesktopHandle,
  BootBrandKernelFn,
  StartBrandDesktopConfig,
} from "./types.js";

function resolveBootKernel(config: StartBrandDesktopConfig): BootBrandKernelFn {
  if (config.bootKernel) return config.bootKernel;
  if (config.brandMigrations && config.registerModuleApi) {
    return brandKernelBooter({
      manifest: config.manifest,
      brandMigrations: config.brandMigrations,
      registerModuleApi: config.registerModuleApi,
      beforeBoot: config.beforeBoot,
      enablePlatformServices: config.enablePlatformServices,
    });
  }
  throw new Error(
    "startBrandDesktop: fournir bootKernel OU brandMigrations+registerModuleApi",
  );
}

type ElectronApp = {
  isPackaged: boolean;
  requestSingleInstanceLock: () => boolean;
  whenReady: () => Promise<void>;
  quit: () => void;
  on: (event: string, cb: () => void) => void;
  getVersion?: () => string;
  resourcesPath?: string;
  getPath?: (name: string) => string;
  setPath?: (name: string, p: string) => void;
};

/** Ancre userData sous {installDir}/data — avant crash-reporter / sqlite. */
function anchorPackagedUserData(app: ElectronApp): string | null {
  if (!app.isPackaged || typeof app.setPath !== "function") return null;
  const dataDir = resolvePackagedDataDir({
    execPath: process.execPath,
    isPackaged: true,
    env: process.env,
  });
  if (!dataDir) return null;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    ensureLogsDir(dataDir);
    fs.mkdirSync(path.join(dataDir, "crash-reports"), { recursive: true });
    app.setPath("userData", dataDir);
    return dataDir;
  } catch {
    return null;
  }
}

type ElectronIpcMain = unknown;

type ElectronBrowserWindow = new (opts: Record<string, unknown>) => {
  loadFile: (p: string) => Promise<void>;
  loadURL: (u: string) => Promise<void>;
};

async function loadElectron(): Promise<{
  app: ElectronApp;
  BrowserWindow: ElectronBrowserWindow;
  ipcMain: ElectronIpcMain;
}> {
  const mod = await import("electron");
  return mod as unknown as {
    app: ElectronApp;
    BrowserWindow: ElectronBrowserWindow;
    ipcMain: ElectronIpcMain;
  };
}

function resolveResourcesRoot(
  app: ElectronApp,
  electronDirname: string,
  resourcesRel?: string,
): string {
  if (app.isPackaged) {
    return (
      app.resourcesPath ||
      path.join(path.dirname(process.execPath), "resources")
    );
  }
  return path.join(electronDirname, resourcesRel || "../../resources");
}

export async function startBrandDesktop(
  config: StartBrandDesktopConfig,
): Promise<BrandDesktopHandle> {
  const manifest = config.manifest;
  const logBasename = config.logBasename || manifest.logBasename;

  // Ultra-early : {install}/data/logs si arbre packagé détecté, sinon early-logs/tmpdir.
  const guessedData = guessPackagedDataDir({ execPath: process.execPath });
  const early = initEarlyBootLogger({
    basename: logBasename,
    userDataDir: guessedData,
    exePath: process.execPath,
  });

  const { app, BrowserWindow, ipcMain } = await loadElectron();
  const __dirname = config.electronDirname;
  const desktopProfile = config.desktopProfile || "full";
  // P&P : runtime kit par défaut (splash/tray/embeds). Opt-out = "window".
  const desktopShell = config.desktopShell || "runtime";

  // 1) Ancrer userData sous {installDir}/data AVANT crash-reporter / sqlite.
  const anchored =
    anchorPackagedUserData(app as ElectronApp) ||
    (() => {
      try {
        return typeof app.getPath === "function" ? app.getPath("userData") : "";
      } catch {
        return "";
      }
    })();

  // 2) Crash reporter + logger sur le vrai chemin (install/data).
  const prefix = manifest.envPrefix;
  const crashEp =
    (config.crashEndpoint || "").trim() ||
    (process.env[`${prefix}_CRASH_ENDPOINT`] || "").trim() ||
    (process.env.CREEZIO_CRASH_ENDPOINT || "").trim() ||
    "";
  configureCrashReporter({
    brandId: manifest.brandId,
    endpointEnvKey: `${prefix}_CRASH_ENDPOINT`,
    defaultEndpoint: crashEp || "http://127.0.0.1/crash-disabled",
  });
  installGlobalHandlers();
  if (anchored) {
    initEarlyBootLogger({
      basename: logBasename,
      userDataDir: anchored,
      exePath: process.execPath,
    });
    initCrashReporter(
      anchored,
      process.env.npm_package_version || app.getVersion?.() || "0.0.0",
    );
    log(
      "boot",
      `userData=${anchored} layout=${app.isPackaged ? "install-data" : "dev"}`,
    );
  } else if (early.logFile) {
    log("early", `log=${early.logFile} source=${early.source}`);
  }

  try {
    return await startBrandDesktopBody({
      config,
      app,
      BrowserWindow,
      ipcMain,
      manifest,
      __dirname,
      desktopProfile,
      desktopShell,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    reportCrash("boot-failure", {
      step: "startBrandDesktop",
      message,
      stack: e instanceof Error ? e.stack : undefined,
      logHint: crashLogHint(),
      earlyLog: early.logFile || null,
      earlySource: early.source,
      userData: anchored || null,
    });
    try {
      const electronMod = (await import("electron")) as unknown as {
        dialog?: { showErrorBox?: (title: string, content: string) => void };
      };
      const product =
        manifest.server?.productName ||
        manifest.client?.productName ||
        manifest.brandId;
      const dataHint =
        anchored ||
        guessedData ||
        path.join(path.dirname(process.execPath), "data");
      electronMod.dialog?.showErrorBox?.(
        `${product} — démarrage impossible`,
        `${message}\n\n` +
          `Journal : ${crashLogHint() || path.join(dataHint, "logs")}\n` +
          `Rapports : ${crashReportsDir() || path.join(dataHint, "crash-reports")}\n` +
          `Données : ${dataHint}\n` +
          `\nUn rapport a été enregistré localement et envoyé au support si le réseau est disponible.`,
      );
    } catch {
      /* headless / dialog indisponible */
    }
    throw e;
  }
}

async function startBrandDesktopBody(args: {
  config: StartBrandDesktopConfig;
  app: ElectronApp;
  BrowserWindow: ElectronBrowserWindow;
  ipcMain: ElectronIpcMain;
  manifest: StartBrandDesktopConfig["manifest"];
  __dirname: string;
  desktopProfile: "full" | "lite";
  desktopShell: "runtime" | "window";
}): Promise<BrandDesktopHandle> {
  const {
    config,
    app,
    BrowserWindow,
    ipcMain,
    manifest,
    __dirname,
    desktopProfile,
    desktopShell,
  } = args;

  // Binaires OS kit (Meili/cloudflared) — avant Meili/tunnel.
  if (process.env.CREEZIO_SKIP_KIT_BINARIES !== "1") {
    const bins = await ensureKitOsBinaries();
    if (!bins.ok) {
      console.warn(
        `[creezio-os] binaires kit incomplets: ${bins.errors.join("; ") || "meili/cloudflared manquants"}`,
      );
    }
  }

  const resourcesPath =
    typeof (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ===
    "string"
      ? (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath || ""
      : "";
  const boot = await prepareDesktopBoot(manifest, {
    appKindDirs: [
      __dirname,
      path.dirname(process.execPath),
      path.join(resourcesPath, "app"),
      path.join(resourcesPath, "build", "electron"),
    ],
  });
  // Segment server/client : logs/ dès le premier setPath (pas attendre whenReady).
  try {
    ensureLogsDir(boot.userDataDir);
  } catch {
    /* best-effort */
  }
  initLogger(boot.userDataDir, config.logBasename || manifest.logBasename);
  // Ré-init sur le vrai userData (server vs client peuvent différer).
  initCrashReporter(
    boot.userDataDir,
    process.env.npm_package_version || app.getVersion?.() || "0.0.0",
  );
  log(
    "boot",
    `kind=${boot.appKind} product=${manifest.client.productName} facade=startBrandDesktop profile=${desktopProfile} shell=${desktopShell} crashUpload=${/crash-disabled/i.test(crashEndpoint()) ? "off" : "on"} kitBin=${JSON.stringify(kitBinaryPaths())}`,
  );

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  const session = createDesktopSessionStore({
    userDataDir: boot.userDataDir,
    manifest,
  });

  const bootKernel = resolveBootKernel(config);
  const kernelBoot = bootKernel({
    userDataDir: boot.userDataDir,
    isPackaged: app.isPackaged,
  }) as BrandKernelBoot;
  const { api, runtime, close: closeKernel, mails } = kernelBoot;
  process.env.CREEZIO_CORE_DB_PATH = runtime.paths.core;

  const resourcesRoot = resolveResourcesRoot(
    app,
    __dirname,
    config.resourcesRel,
  );

  let os = null as ReturnType<typeof composeBrandOs> | null;
  if (desktopProfile === "full") {
    os = composeBrandOs({
      manifest,
      userDataDir: boot.userDataDir,
      isPackaged: app.isPackaged,
      resourcesRoot,
      electronDirname: __dirname,
      ...(config.pluginsFeatureOff !== undefined
        ? { pluginsFeatureOff: config.pluginsFeatureOff }
        : {}),
      ...(config.catalogHost ? { catalogHost: config.catalogHost } : {}),
      ...(config.crashEndpoint ? { crashEndpoint: config.crashEndpoint } : {}),
    });
  }

  let searchEngine: BrandDesktopHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    // P&P : binaire kit d'abord (resources/bin/meili), jamais requis dans la marque.
    const kitMeili = kitBinaryPaths().meili;
    const meiliCandidates = [
      kitMeili,
      process.platform === "win32"
        ? path.join(resourcesRoot, "bin", "meilisearch-win.exe")
        : path.join(resourcesRoot, "bin", "meili"),
      // Compatibilité avec les anciens stages Windows.
      ...(process.platform === "win32"
        ? [
            path.join(resourcesRoot, "bin", "meili.exe"),
            path.join(resourcesRoot, "meili.exe"),
          ]
        : [path.join(resourcesRoot, "meili")]),
    ];
    const meiliBin = meiliCandidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" && fs.existsSync(candidate),
    );
    try {
      const meiliBoot = await maybeBootBrandMeili({
        binaryPath: meiliBin || null,
        dataDir: path.join(boot.userDataDir, "meili"),
        userDataDir: boot.userDataDir,
        dbPath: runtime.getBrand().path,
        feed: config.meiliFeed,
        log: (line) => log("meili", line),
      });
      searchEngine = meiliBoot.engine;
      if (meiliBoot.meili) {
        meiliStop = () => meiliBoot.meili?.stop();
      }
    } catch (err) {
      log(
        "meili",
        `boot skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
      searchEngine = "off";
    }
  }

  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => {
      const health = api
        .listMounts()
        .filter((m) => m.space === "module")
        .map((m) => ({
          name: `module.${m.id}.health`,
          description: `Health module ${m.id}`,
          space: "module" as const,
          ownerId: m.id,
          handler: async () => ({
            ok: true,
            content: { module: m.id },
          }),
        }));
      const brandTools = config.discoverModuleTools
        ? await config.discoverModuleTools(api)
        : [];
      return { module: [...health, ...brandTools], plugin: [] };
    },
  });
  mcp.registerTool({
    name: "module.platform.list_mounts",
    description: "Liste les mounts API kernel",
    space: "module",
    ownerId: "platform",
    handler: async () => ({
      ok: true,
      content: { mounts: api.listMounts() },
    }),
  });
  if (os) {
    mcp.registerTool({
      name: "module.os.status",
      description: "Statut hosts OS Creezio (Hermes/n8n/tunnel)",
      space: "module",
      ownerId: "os",
      handler: async () => ({ ok: true, content: os!.status() }),
    });
  }

  let mcpSurface: ReturnType<typeof mountBrandMcpSurface> | null = null;
  const httpServer =
    desktopProfile === "full"
      ? await listenBrandOsHttp({
          api,
          mcp,
          os,
          getMailsStore: () => mails ?? null,
          mcpSurfaceFetch: async (request) => {
            if (!mcpSurface) {
              return new Response(
                JSON.stringify({ error: "mcp_surface_pending" }),
                {
                  status: 503,
                  headers: { "content-type": "application/json" },
                },
              );
            }
            return mcpSurface.app.fetch(request);
          },
          mcpSurfaceHandlesPath,
        })
      : await listenBrandKernelHttp({ api });
  process.env.METIER_BASE_URL = httpServer.baseUrl;
  process.env.MCP_PUBLIC_URL = httpServer.baseUrl;
  process.env.APP_PUBLIC_URL = httpServer.baseUrl;
  if (os && desktopProfile === "full") {
    mcpSurface = mountBrandMcpSurface({
      manifest,
      runtime,
      os,
      mcp,
      publicBaseUrl: () => httpServer.baseUrl,
    });
    log(
      "mcp",
      `oauth ready=${mcpSurface.oauthReady()} public=${mcpSurface.publicUrl()}`,
    );
  }

  // Fullstack natif kit (n8n + Hermes) — CREEZIO_NATIVE_WARM=0 pour skip.
  // shell=runtime : le splash (installBrandOsDesktop) ensure/start n8n+Hermes
  // avec UI — un warm bloquant ICI laisse l'utilisateur sans fenêtre ("rien").
  const skipWarmForRuntimeShell =
    desktopShell === "runtime" && process.env.CREEZIO_NATIVE_WARM !== "1";
  if (
    os &&
    desktopProfile === "full" &&
    process.env.CREEZIO_NATIVE_WARM !== "0" &&
    !skipWarmForRuntimeShell
  ) {
    const warm = await warmBrandNativeHosts(os, {
      start: process.env.CREEZIO_NATIVE_START !== "0",
      n8n: true,
      hermes: process.env.CREEZIO_NATIVE_WARM_HERMES !== "0",
    });
    log(
      "native",
      `warm n8n.started=${warm.n8n.started} entry=${warm.n8n.entry} hermes.started=${warm.hermes.started} binary=${warm.hermes.binary}`,
    );
  } else if (skipWarmForRuntimeShell && os && desktopProfile === "full") {
    log(
      "native",
      "warm différé au shell runtime (splash) — pas de blocage pré-UI",
    );
  }

  if (os && desktopProfile === "full" && process.env.CREEZIO_TUNNEL_LOCAL !== "0") {
    const tunnel = os.hostRuntime.tunnelService() as unknown as {
      enableLocalPublicSurface: (o: {
        localPort: number;
        slug?: string;
      }) => { publicMcp: string };
    };
    const local = tunnel.enableLocalPublicSurface({
      localPort: httpServer.port,
      slug: manifest.brandId,
    });
    log("tunnel", `surface locale mcp=${local.publicMcp}`);
  }

  const navShell = createNavShellAdapter();
  if (config.navItems?.length) {
    navShell.registerBrandNav(config.navItems);
  }
  navShell.registerBrandNav([
    { id: "os.setup", label: "Setup", href: "/setup", group: "core" },
    { id: "os.login", label: "Login", href: "/login", group: "core" },
    { id: "os.taches", label: "Tâches", href: "/taches", group: "core" },
    { id: "os.mails", label: "Mails", href: "/mails", group: "core" },
    {
      id: "os.developers",
      label: "Developers",
      href: "/developers",
      group: "core",
    },
  ]);
  const navModel = navShell.getRenderModel();

  const appRoot = path.resolve(__dirname, "../..");
  const uiPlane = await startBrandUiPlane({
    appRoot,
    metierBaseUrl: httpServer.baseUrl,
  });

  const cleanup = async () => {
    meiliStop?.();
    await uiPlane.close();
    await httpServer.close();
    os?.close();
    closeKernel();
  };

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    await cleanup();
    app.quit();
    return {
      baseUrl: httpServer.baseUrl,
      port: httpServer.port,
      searchEngine,
      desktopProfile,
      close: cleanup,
    };
  }

  // Shell runtime prod (splash/tray/embeds) — hosts déjà composés dans le kit.
  if (desktopShell === "runtime" && os) {
    const electronMod = await import("electron");
    installBrandOsDesktop({
      manifest,
      os,
      appKind: boot.appKind,
      bootBehavior: boot.bootBehavior,
      bootProfileLaunch: boot.profileLaunch,
      sessionPartition: boot.sessionPartition,
      electron: electronMod as unknown as Parameters<
        typeof installBrandOsDesktop
      >[0]["electron"],
      bootBrandRuntime: async () => ({
        ok: true,
        metierBaseUrl: httpServer.baseUrl,
        ui: uiPlane.kind,
        uiBaseUrl: uiPlane.baseUrl,
      }),
      shutdownBrandRuntime: cleanup,
    });
    log(
      "nav",
      `shell=runtime mounts=${api.listMounts().length} os=full ui=${uiPlane.kind} api=${httpServer.baseUrl}`,
    );
    app.on("will-quit", () => {
      void cleanup();
    });
    return {
      baseUrl: httpServer.baseUrl,
      port: httpServer.port,
      searchEngine,
      desktopProfile,
      close: cleanup,
    };
  }

  await app.whenReady();

  registerDesktopSessionIpc({
    ipcMain: ipcMain as Parameters<typeof registerDesktopSessionIpc>[0]["ipcMain"],
    session,
    info: {
      brandId: manifest.brandId,
      productName: manifest.client.productName,
      appKind: boot.appKind,
      metierPort: httpServer.port,
    },
  });

  const win = new BrowserWindow({
    width: config.window?.width ?? 1180,
    height: config.window?.height ?? 760,
    title:
      boot.appKind === "server"
        ? manifest.server.productName
        : manifest.client.productName,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: boot.sessionPartition,
    },
  });

  if (uiPlane.kind === "next" && uiPlane.baseUrl) {
    await win.loadURL(uiPlane.baseUrl);
  } else {
    const renderer = path.join(resourcesRoot, "renderer", "index.html");
    await win.loadFile(renderer);
  }

  const mounts = api.listMounts();
  const mcpTools = await mcp.listTools();
  log(
    "nav",
    `merged=${navModel.items.length} mounts=${mounts.length} mcp=${mcpTools.tools.length} os=${desktopProfile} ui=${uiPlane.kind} shell=${desktopShell} setup=${session.isSetupComplete()} api=${httpServer.baseUrl} search=${searchEngine}`,
  );

  app.on("will-quit", () => {
    void cleanup();
  });

  return {
    baseUrl: httpServer.baseUrl,
    port: httpServer.port,
    searchEngine,
    desktopProfile,
    close: cleanup,
  };
}
