/**
 * Main Electron — déclaration marque uniquement (métier + identité).
 * Orchestration OS = @creezio/app-runtime (P&P natif : shell runtime,
 * hosts Hermes/n8n/tunnel, Meili/cloudflared kit, MCP local).
 * Opt-out shell : CREEZIO_DESKTOP_SHELL=window
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { startBrandDesktop } from "@creezio/app-runtime";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { brandMigrations } from "./brand-migrations.js";
import { registerBrandModuleApi } from "./brand-module-api.js";
import { brandMeiliFeed, applyBrandMeiliConfig } from "./meili-feed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  beforeBoot: applyBrandMeiliConfig,
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
  // Défaut kit = "runtime". Opt-out explicite pour CI/fenêtre seule.
  desktopShell:
    process.env.CREEZIO_DESKTOP_SHELL === "window" ? "window" : "runtime",
}).catch((err) => {
  console.error(err);
  app.exit(1);
});
// entities=5
