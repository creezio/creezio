/**
 * Main Electron — runtime plateforme (installBrandDesktopRuntime) + métier nav.
 * Généré par creezio new-app --from-prd.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
  installBrandDesktopRuntime,
} from "@creezio/electron-shell";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";
import { createApiKernel } from "@creezio/api-kernel";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createMemoryAuthStore } from "@creezio/auth";
import { createNavShellAdapter } from "@creezio/shell-ui";
import { verticalSlot } from "./vertical-slot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", `kind=${boot.appKind} product=${manifest.client.productName} fromPrd=1`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  const api = createApiKernel({ brandId: manifest.brandId });
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

  // Référence runtime production — wiring hosts via src/lib/host-stack.ts
  // quand sidecars marque sont branchés. Ici: boot shell + UI métier.
  void installBrandDesktopRuntime;

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  await app.whenReady();

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
    `merged=${navModel.items.length} brand=${navModel.groups.find((g) => g.id === "brand")?.items.length || 0} entities=5 pages=5`,
  );
}

main().catch((err) => {
  console.error(err);
  app.exit(1);
});
