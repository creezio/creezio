/**
 * Main Electron mince — boot plateforme + sandbox H2 multi-DB.
 * Le métier vit dans vertical-slot.ts (notes brand sandbox uniquement).
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
import { demobrandManifest as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { createDemobrandSandbox } from "./sandbox-runtime.js";
import { setDemobrandProductHubStore } from "./product-hub-stub.js";
import { demobrandNavShell } from "./nav-shell.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", `kind=${boot.appKind} product=${manifest.client.productName}`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  // H2 — isolation réelle : SqliteRuntime + api-kernel + mcp scindé
  // I1 — auth sqlite core (session persistée)
  const sandbox = createDemobrandSandbox({ userDataRoot: boot.userDataDir });
  setDemobrandProductHubStore(sandbox.productHub);
  const auth = sandbox.auth;
  // I7 — adapter shell-ui (marque = registerBrandNav only)
  const navModel = demobrandNavShell.getRenderModel();
  const navHtml = demobrandNavShell.renderNavHtml();
  void auth;
  void verticalSlot;
  void navModel;
  void navHtml;
  log("nav", `items=${navModel.items.length} brand=${navModel.groups.find((g) => g.id === "brand")?.items.length || 0}`);

  const status = sandbox.runtime.status();
  log(
    "sqlite",
    `core=${status.coreOpen} brand=${status.brandOpen} pluginsOpen=${status.openPlugins.length}`,
  );

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    sandbox.close();
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

  const arch = await sandbox.api.handle({
    method: "GET",
    path: "/api/v1/core/architecture",
  });
  log(
    "nav",
    `merged=${navModel.items.length} brand=${navModel.groups.find((g) => g.id === "brand")?.items.length || 0} apiMounts=${sandbox.api.listMounts().length} arch=${JSON.stringify((arch.body as { architectureVersion?: string })?.architectureVersion)}`,
  );

  app.on("will-quit", () => {
    sandbox.close();
  });
}

main().catch((err) => {
  console.error(err);
  app.exit(1);
});
