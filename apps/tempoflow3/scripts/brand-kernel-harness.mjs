#!/usr/bin/env node
/**
 * Harness Node — façade @creezio/app-runtime (même kernel que le desktop).
 * Usage: npm run build:electron && METIER_DATA_DIR=... METIER_PORT=... node scripts/brand-kernel-harness.mjs
 */
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { startBrandKernelHarness } from "@creezio/app-runtime";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const electron = path.join(root, "build/electron");

const manifestMod = await import(
  pathToFileURL(path.join(electron, "app-manifest.js")).href
);
const migMod = await import(
  pathToFileURL(path.join(electron, "brand-migrations.js")).href
);
const apiMod = await import(
  pathToFileURL(path.join(electron, "brand-module-api.js")).href
);
const feedMod = await import(
  pathToFileURL(path.join(electron, "meili-feed.js")).href
);

const manifestExport = Object.keys(manifestMod).find((k) =>
  k.endsWith("Manifest"),
);
if (!manifestExport) throw new Error("AppManifest introuvable");

await startBrandKernelHarness({
  brandId: "tempoflow3",
  appRoot: root,
  port: PORT,
  manifest: manifestMod[manifestExport],
  brandMigrations: migMod.brandMigrations(),
  registerModuleApi: apiMod.registerBrandModuleApi,
  beforeBoot: feedMod.applyBrandMeiliConfig,
  meiliFeed: feedMod.brandMeiliFeed,
});
