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

const bootMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-runtime.js")).href
);
const feedMod = await import(
  pathToFileURL(path.join(root, "build/electron/meili-feed.js")).href
);

await startBrandKernelHarness({
  brandId: "tempoflow3",
  appRoot: root,
  port: PORT,
  bootKernel: (opts) => bootMod.bootBrandKernel(opts),
  meiliFeed: feedMod.brandMeiliFeed,
});
