/**
 * Façade desktop marque — absorbe l'orchestration OS.
 * Profile `full` : hosts Hermes/n8n/tunnel + MCP HTTP + tasks/mails.
 * Profile `lite` : kernel + Meili seulement.
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
import { composeBrandOs } from "./compose-brand-os.js";
import { listenBrandOsHttp } from "./listen-brand-os-http.js";
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
  resourcesPath?: string;
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
  const { app, BrowserWindow, ipcMain } = await loadElectron();
  const manifest = config.manifest;
  const __dirname = config.electronDirname;
  const desktopProfile = config.desktopProfile || "full";

  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, config.logBasename || manifest.logBasename);
  log(
    "boot",
    `kind=${boot.appKind} product=${manifest.client.productName} facade=startBrandDesktop profile=${desktopProfile}`,
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
    });
  }

  let searchEngine: BrandDesktopHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    const meiliBin = path.join(resourcesRoot, "meili");
    try {
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
            content: { module: m.id },
          }),
        })),
      plugin: [],
    }),
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

  const httpServer =
    desktopProfile === "full"
      ? await listenBrandOsHttp({ api, mcp, os })
      : await listenBrandKernelHttp({ api });
  process.env.METIER_BASE_URL = httpServer.baseUrl;

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

  const cleanup = async () => {
    meiliStop?.();
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

  const renderer = path.join(resourcesRoot, "renderer", "index.html");
  await win.loadFile(renderer);

  const mounts = api.listMounts();
  const mcpTools = await mcp.listTools();
  log(
    "nav",
    `merged=${navModel.items.length} mounts=${mounts.length} mcp=${mcpTools.tools.length} os=${desktopProfile} setup=${session.isSetupComplete()} api=${httpServer.baseUrl} search=${searchEngine}`,
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
