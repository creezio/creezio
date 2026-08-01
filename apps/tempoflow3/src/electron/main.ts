/**
 * Main Electron — OS kit + runtime natif (SQLite + api-kernel + HTTP).
 * Généré --from-prd. Pas de sidecar JSON métier.
 * Meili optionnel via maybeBootBrandMeili (sans binaire → SQL).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";
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
import { createMemoryAuthStore } from "@creezio/auth";
import { createNavShellAdapter } from "@creezio/shell-ui";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { bootBrandKernel } from "./brand-runtime.js";
import { brandMeiliFeed } from "./meili-feed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", `kind=${boot.appKind} product=${manifest.client.productName} fromPrd=1 nativeKernel=1`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  const session = createDesktopSessionStore({
    userDataDir: boot.userDataDir,
    manifest,
  });

  const { api, runtime, close: closeKernel } = bootBrandKernel({
    userDataDir: boot.userDataDir,
    isPackaged: app.isPackaged,
  });

  const resourcesRoot = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, "../../resources");
  const meiliBin = path.join(resourcesRoot, "meili");
  const meiliBoot = await maybeBootBrandMeili({
    binaryPath: fs.existsSync(meiliBin) ? meiliBin : null,
    dataDir: path.join(boot.userDataDir, "meili"),
    userDataDir: boot.userDataDir,
    dbPath: runtime.getBrand().path,
    feed: brandMeiliFeed,
    log: (line) => log("meili", line),
  });

  const kernelHttp = await listenBrandKernelHttp({ api });
  process.env.METIER_BASE_URL = kernelHttp.baseUrl;

  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => ({ module: [], plugin: [] }),
  });
  const auth = createMemoryAuthStore();
  const navShell = createNavShellAdapter();
  navShell.registerBrandNav(verticalSlot.items);
  const navModel = navShell.getRenderModel();
  void mcp;
  void auth;

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    meiliBoot.meili?.stop();
    await kernelHttp.close();
    closeKernel();
    app.quit();
    return;
  }

  await app.whenReady();

  registerDesktopSessionIpc({
    ipcMain,
    session,
    info: {
      brandId: manifest.brandId,
      productName: manifest.client.productName,
      appKind: boot.appKind,
      metierPort: kernelHttp.port,
    },
  });

  const win = new BrowserWindow({
    width: 1180,
    height: 760,
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
    ? path.join(process.resourcesPath, "renderer", "index.html")
    : path.join(__dirname, "../../resources/renderer/index.html");
  await win.loadFile(renderer);

  log(
    "nav",
    `merged=${navModel.items.length} mounts=${api.listMounts().length} entities=5 setup=${session.isSetupComplete()} api=${kernelHttp.baseUrl} search=${meiliBoot.engine}`,
  );

  app.on("will-quit", () => {
    meiliBoot.meili?.stop();
    void kernelHttp.close();
    closeKernel();
  });
}

main().catch((err) => {
  console.error(err);
  app.exit(1);
});
