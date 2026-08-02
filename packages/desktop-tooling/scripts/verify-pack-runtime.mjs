#!/usr/bin/env node
/**
 * Gate pré-publish : vérifie que l'asar win-unpacked embarque les deps
 * runtime critiques (hono, better-sqlite3 + .node, zod…).
 *
 * Usage :
 *   node …/verify-pack-runtime.mjs [appRoot] [--kind=server|client]
 * Exit 1 si manquant — ne pas publier.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const kindArg = args.find((a) => a.startsWith("--kind="));
const kind = kindArg ? kindArg.slice("--kind=".length) : "server";
const appRoot = path.resolve(
  args.find((a) => !a.startsWith("--")) || process.cwd(),
);

const REQUIRED = [
  "hono",
  "better-sqlite3",
  "bindings",
  "file-uri-to-path",
  "zod",
  "jose",
  "@hono/zod-openapi",
];

const distDir =
  kind === "client" ? "dist-electron" : "dist-electron-server";
const unpacked = path.join(appRoot, distDir, "win-unpacked");
const asarPath = path.join(unpacked, "resources", "app.asar");
const unpackedAsar = path.join(unpacked, "resources", "app.asar.unpacked");

if (!fs.existsSync(asarPath)) {
  console.error(`verify-pack-runtime: asar manquant: ${asarPath}`);
  console.error("  → lancer pack:win / pack:win:server d'abord");
  process.exit(1);
}

const require = createRequire(import.meta.url);
let Asar;
try {
  Asar = require("@electron/asar");
} catch {
  try {
    Asar = require(path.join(appRoot, "node_modules/@electron/asar"));
  } catch {
    console.error("verify-pack-runtime: @electron/asar requis");
    process.exit(1);
  }
}

const list = Asar.listPackage(asarPath);
const tops = new Set();
for (const p of list) {
  const m = String(p).match(/^\/?node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (m) tops.add(m[1]);
}

const missing = REQUIRED.filter((p) => !tops.has(p));
if (missing.length) {
  console.error("verify-pack-runtime: packages manquants dans asar:");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

// .node : dans asar ou asar.unpacked
const nodeInAsar = list.some((p) => String(p).endsWith(".node"));
let nodeUnpacked = false;
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith(".node")) nodeUnpacked = true;
  }
}
walk(unpackedAsar);

if (!nodeInAsar && !nodeUnpacked) {
  console.error(
    "verify-pack-runtime: aucun .node (better-sqlite3) dans asar/asar.unpacked",
  );
  process.exit(1);
}

// Smoke resolve depuis extract temporaire
const tmp = fs.mkdtempSync(path.join(appRoot, ".tmp", "pack-runtime-"));
try {
  Asar.extractAll(asarPath, tmp);
  // Copier unpacked .node par-dessus si besoin
  if (fs.existsSync(unpackedAsar)) {
    fs.cpSync(unpackedAsar, tmp, { recursive: true });
  }

  const honoPkg = path.join(tmp, "node_modules/hono/package.json");
  const bsqlPkg = path.join(tmp, "node_modules/better-sqlite3/package.json");
  if (!fs.existsSync(honoPkg) || !fs.existsSync(bsqlPkg)) {
    console.error("verify-pack-runtime: extract incomplet (hono/better-sqlite3)");
    process.exit(1);
  }

  // import hono (ESM)
  const honoMod = await import(
    pathToFileURL(path.join(tmp, "node_modules/hono/dist/index.js")).href
  );
  if (!honoMod.Hono) {
    console.error("verify-pack-runtime: Hono export manquant");
    process.exit(1);
  }

  // better-sqlite3 : require CJS — sur Linux le .node est win32 → on vérifie
  // seulement la présence du fichier + package.json (load natif = hôte Win).
  const nodeFile = path.join(
    tmp,
    "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
  );
  if (!fs.existsSync(nodeFile)) {
    console.error("verify-pack-runtime: better_sqlite3.node absent après extract");
    process.exit(1);
  }
  const fd = fs.openSync(nodeFile, "r");
  const buf = Buffer.alloc(2);
  fs.readSync(fd, buf, 0, 2, 0);
  fs.closeSync(fd);
  const isMz = buf[0] === 0x4d && buf[1] === 0x5a;
  const isElf = buf[0] === 0x7f && buf[1] === 0x45;
  if (!isMz && !isElf) {
    console.error("verify-pack-runtime: better_sqlite3.node format inconnu");
    process.exit(1);
  }
  // Pack win doit être PE (MZ). Si on pack linux, ELF ok.
  const expectWin = kind === "server" || kind === "client";
  if (expectWin && process.env.CREEZIO_VERIFY_WIN_NATIVE !== "0" && !isMz) {
    console.error(
      "verify-pack-runtime: better_sqlite3.node n'est pas win32 (MZ) — relancer ensure-win-native-modules",
    );
    process.exit(1);
  }

  console.log("verify-pack-runtime: OK");
  console.log("  asar     ", asarPath);
  console.log("  packages ", REQUIRED.join(", "));
  console.log(
    "  .node    ",
    isMz ? "win32 PE" : "ELF",
    nodeUnpacked ? "(asar.unpacked)" : "(asar)",
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
