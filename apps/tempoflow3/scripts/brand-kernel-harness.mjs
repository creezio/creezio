#!/usr/bin/env node
/**
 * Harness Node — même api-kernel + SQLite que le desktop (pas de store.json).
 * Usage: npm run build:electron && METIER_DATA_DIR=... METIER_PORT=... node scripts/brand-kernel-harness.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { listenBrandKernelHttp, maybeBootBrandMeili } from "@creezio/electron-shell";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const DATA_DIR =
  process.env.METIER_DATA_DIR ||
  fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-kernel-"));

const bootMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-runtime.js")).href
);
const feedMod = await import(
  pathToFileURL(path.join(root, "build/electron/meili-feed.js")).href
);
const { api, runtime, close } = bootMod.bootBrandKernel({ userDataDir: DATA_DIR });

const meiliBin =
  process.env.MEILI_BINARY ||
  path.join(root, "resources", "meili");
const meiliBoot = await maybeBootBrandMeili({
  binaryPath: fs.existsSync(meiliBin) ? meiliBin : null,
  dataDir: path.join(DATA_DIR, "meili"),
  userDataDir: DATA_DIR,
  dbPath: runtime.getBrand().path,
  feed: feedMod.brandMeiliFeed,
  index: process.env.MEILI_SKIP_INDEX !== "1",
});

const httpServer = await listenBrandKernelHttp({ api, port: PORT });
console.log(
  `brand-kernel-harness tempoflow3 on ${httpServer.baseUrl} data=${DATA_DIR} search=${meiliBoot.engine}`,
);

async function shutdown() {
  meiliBoot.meili?.stop();
  await httpServer.close();
  close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
