/**
 * Façade desktop marque — absorbe l'orchestration OS.
 * La marque déclare : manifest, bootKernel, feed, nav.
 * Le kit monte kernel HTTP, session, Meili, MCP, nav cœur.
 */
import fs from "node:fs";
import path from "node:path";
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
  createDesktopSessionStore,
  registerDesktopSessionIpc,
  listenBrandKernelHttp,
  maybeBootBrandMeili,
} from "@creezio/electron-shell";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createNavShellAdapter } from "@creezio/shell-ui";
import { brandKernelBooter } from "./create-brand-kernel.js";
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
  resourcesPath: string;
};

type ElectronIpcMain = unknown;

type ElectronBrowserWindow = new (opts: Record<string, unknown>) => {
  loadFile: (p: string) => Promise<void>;
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

export async function startBrandDesktop(
  config: StartBrandDesktopConfig,
): Promise<BrandDesktopHandle> {
  const { app, BrowserWindow, ipcMain } = await loadElectron();
  const manifest = config.manifest;
  const __dirname = config.electronDirname;

  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, config.logBasename || manifest.logBasename);
  log(
    "boot",
    `kind=${boot.appKind} product=${manifest.client.productName} facade=startBrandDesktop`,
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
  const { api, runtime, close: closeKernel } = bootKernel({
    userDataDir: boot.userDataDir,
    isPackaged: app.isPackaged,
  });

  let searchEngine: BrandDesktopHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    const resourcesRoot = app.isPackaged
      ? app.resourcesPath
      : path.join(__dirname, config.resourcesRel || "../../resources");
    const meiliBin = path.join(resourcesRoot, "meili");
    const meiliBoot = await maybeBootBrandMeili({
      binaryPath: fs.existsSync(meiliBin) ? meiliBin : null,
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
  }

  const kernelHttp = await listenBrandKernelHttp({ api });
  process.env.METIER_BASE_URL = kernelHttp.baseUrl;

  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => ({
      module: api
        .listMounts()
        .filter((m) => m.space === "module")
        .map((m) => ({
          name: `module.${m.id}.health`,
          description: `Health module ${m.id}`,
          space: "module" as const,
          ownerId: m.id,
          handler: async () => ({
            ok: true,
            content: { module: m.id, api: kernelHttp.baseUrl },
          }),
        })),
      plugin: [],
    }),
  });
  mcp.registerTool({
    name: "module.platform.list_mounts",
    description: "Liste les mounts API kernel (modules + platform)",
    space: "module",
    ownerId: "platform",
    handler: async () => ({
      ok: true,
      content: { mounts: api.listMounts() },
    }),
  });

  const navShell = createNavShellAdapter();
  if (config.navItems?.length) {
    navShell.registerBrandNav(config.navItems);
  }
  // Alias OS FR (parity TF2 / oracle paths)
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

  const cleanup = async () => {
    meiliStop?.();
    await kernelHttp.close();
    closeKernel();
  };

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    await cleanup();
    app.quit();
    return {
      baseUrl: kernelHttp.baseUrl,
      port: kernelHttp.port,
      searchEngine,
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
      metierPort: kernelHttp.port,
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

  const renderer = app.isPackaged
    ? path.join(app.resourcesPath, "renderer", "index.html")
    : path.join(__dirname, "../../resources/renderer/index.html");
  await win.loadFile(renderer);

  const mounts = api.listMounts();
  const mcpTools = await mcp.listTools();
  log(
    "nav",
    `merged=${navModel.items.length} mounts=${mounts.length} mcp=${mcpTools.tools.length} setup=${session.isSetupComplete()} api=${kernelHttp.baseUrl} search=${searchEngine}`,
  );

  app.on("will-quit", () => {
    void cleanup();
  });

  return {
    baseUrl: kernelHttp.baseUrl,
    port: kernelHttp.port,
    searchEngine,
    close: cleanup,
  };
}
