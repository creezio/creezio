/**
 * Main Electron mince — déclaration marque uniquement.
 * Orchestration OS = @creezio/app-runtime (startBrandDesktop).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { startBrandDesktop } from "@creezio/app-runtime";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { bootBrandKernel } from "./brand-runtime.js";
import { brandMeiliFeed } from "./meili-feed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  bootKernel: (opts) =>
    bootBrandKernel({ ...opts, isPackaged: app.isPackaged }),
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
}).catch((err) => {
  console.error(err);
  app.exit(1);
});
