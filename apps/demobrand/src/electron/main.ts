/**
 * Main Electron mince — boot plateforme uniquement.
 * Le métier vit dans vertical-slot.ts (vide par défaut).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
} from "@creezio/electron-shell";
import { createApiKernel } from "@creezio/api-kernel";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createMemoryAuthStore } from "@creezio/auth";
import { mergeNav } from "@creezio/shell-ui";
import { demobrandManifest as manifest } from "./app-manifest.js";
import { coreNavItems } from "./nav-core.js";
import { verticalSlot } from "./vertical-slot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", `kind=${boot.appKind} product=${manifest.client.productName}`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  const api = createApiKernel({ brandId: manifest.brandId });
  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
  });
  const auth = createMemoryAuthStore();
  const navItems = mergeNav(coreNavItems, verticalSlot.items);
  void mcp;
  void auth;

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  await app.whenReady();

  const win = new BrowserWindow({
    width: 1100,
    height: 720,
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
    `core=${coreNavItems.length} vertical=${verticalSlot.items.length} merged=${navItems.length} apiMounts=${api.listMounts().length}`,
  );
}

main().catch((err) => {
  console.error(err);
  app.exit(1);
});
