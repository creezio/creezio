#!/usr/bin/env node
/**
 * Smoke Meili générique — config feed + fallback sans binaire + fake Meili HTTP.
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const creezioRoot = process.env.CREEZIO_ROOT || "";
const localNm = path.join(root, "node_modules");
if (creezioRoot && !fs.existsSync(localNm)) {
  const kitNm = path.join(creezioRoot, "node_modules");
  if (fs.existsSync(kitNm)) fs.symlinkSync(kitNm, localNm, "dir");
}
const binPath = [
  path.join(root, "node_modules", ".bin"),
  creezioRoot ? path.join(creezioRoot, "node_modules", ".bin") : "",
  process.env.PATH || "",
].filter(Boolean).join(path.delimiter);
const nodePathParts = [
  process.env.NODE_PATH,
  path.join(root, "node_modules"),
  creezioRoot ? path.join(creezioRoot, "node_modules") : "",
].filter(Boolean);
const toolEnv = {
  ...process.env,
  PATH: binPath,
  NODE_PATH: nodePathParts.join(path.delimiter),
  CREEZIO_ROOT: creezioRoot,
};

const build = spawnSync("npm", ["run", "build:electron"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
  env: toolEnv,
});
assert.equal(build.status, 0, build.stderr || build.stdout);

const feedSrc = fs.readFileSync(path.join(root, "src/electron/meili-feed.ts"), "utf8");
assert.doesNotMatch(feedSrc, /tf2_produits|tf2_marketplaces|tf2_all/);

const { startMeili } = await import(
  pathToFileURL(
    path.join(creezioRoot || path.join(root, "../.."), "packages/electron-shell/dist/host/meili-launcher.js"),
  ).href
);
const none = await startMeili({
  binaryPath: null,
  dataDir: path.join(os.tmpdir(), "tempoflow3-meili-none"),
  userDataDir: path.join(os.tmpdir(), "tempoflow3-ud-none"),
});
assert.equal(none, null, "sans binaire → null (fallback SQL documenté)");

const feedMod = await import(
  pathToFileURL(path.join(root, "build/electron/meili-feed.js")).href
);
assert.ok(feedMod.brandMeiliFeed?.indexes?.length >= 1);
for (const idx of feedMod.brandMeiliFeed.indexes) {
  assert.ok(!String(idx.uid).startsWith("tf2_"), `UID legacy interdit dans feed: ${idx.uid}`);
}
feedMod.applyBrandMeiliConfig();

// Fake Meili HTTP minimal (create/settings/docs/swap/health/search)
const indexes = new Map();
const tasks = [];
const fake = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const json = (code, body) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (url.pathname === "/health") return json(200, { status: "available" });
  if (req.method === "GET" && url.pathname.startsWith("/indexes/")) {
    const uid = url.pathname.slice("/indexes/".length).split("/")[0];
    if (!indexes.has(uid)) return json(404, { message: "not found" });
    return json(200, { uid });
  }
  if (req.method === "POST" && url.pathname === "/indexes") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      indexes.set(body.uid, { docs: [], settings: {} });
      const taskUid = tasks.length + 1;
      tasks.push({ taskUid, status: "succeeded" });
      json(202, { taskUid, status: "succeeded" });
    });
    return;
  }
  if (req.method === "DELETE" && url.pathname.startsWith("/indexes/")) {
    const uid = url.pathname.slice("/indexes/".length);
    indexes.delete(uid);
    const taskUid = tasks.length + 1;
    tasks.push({ taskUid, status: "succeeded" });
    return json(202, { taskUid, status: "succeeded" });
  }
  if (req.method === "PATCH" && url.pathname.includes("/settings")) {
    const taskUid = tasks.length + 1;
    tasks.push({ taskUid, status: "succeeded" });
    return json(202, { taskUid, status: "succeeded" });
  }
  if (req.method === "POST" && url.pathname.includes("/documents")) {
    const uid = url.pathname.split("/")[2];
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const docs = JSON.parse(raw || "[]");
      const cur = indexes.get(uid) || { docs: [], settings: {} };
      cur.docs.push(...docs);
      indexes.set(uid, cur);
      const taskUid = tasks.length + 1;
      tasks.push({ taskUid, status: "succeeded" });
      json(202, { taskUid, status: "succeeded" });
    });
    return;
  }
  if (req.method === "POST" && url.pathname === "/swap-indexes") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "[]");
      for (const pair of body) {
        const [a, b] = pair.indexes;
        const da = indexes.get(a);
        const db = indexes.get(b);
        indexes.set(a, db || { docs: [], settings: {} });
        indexes.set(b, da || { docs: [], settings: {} });
      }
      const taskUid = tasks.length + 1;
      tasks.push({ taskUid, status: "succeeded" });
      json(202, { taskUid, status: "succeeded" });
    });
    return;
  }
  if (req.method === "GET" && url.pathname.startsWith("/tasks/")) {
    const id = Number(url.pathname.split("/")[2]);
    return json(200, tasks[id - 1] || { taskUid: id, status: "succeeded" });
  }
  if (req.method === "POST" && url.pathname.includes("/search")) {
    const uid = url.pathname.split("/")[2];
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      const q = String(body.q || "").toLowerCase();
      const docs = (indexes.get(uid)?.docs || []).filter((d) =>
        JSON.stringify(d).toLowerCase().includes(q),
      );
      json(200, { hits: docs.slice(0, body.limit || 20) });
    });
    return;
  }
  json(404, { message: "unhandled " + req.method + " " + url.pathname });
});

await new Promise((r) => fake.listen(0, "127.0.0.1", r));
const port = fake.address().port;
const host = `http://127.0.0.1:${port}`;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-meili-idx-"));
const { createBrandKernel } = await import("@creezio/app-runtime");
const manifestMod = await import(
  pathToFileURL(path.join(root, "build/electron/app-manifest.js")).href
);
const migMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-migrations.js")).href
);
const apiMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-module-api.js")).href
);
const manifestKey = Object.keys(manifestMod).find((k) => k.endsWith("Manifest"));
const { runtime, close } = createBrandKernel({
  manifest: manifestMod[manifestKey],
  userDataDir: dataDir,
  brandMigrations: migMod.brandMigrations(),
  registerModuleApi: apiMod.registerBrandModuleApi,
  beforeBoot: feedMod.applyBrandMeiliConfig,
});
const brand = runtime.getBrand();
const resolvedDb = brand.path;
assert.ok(fs.existsSync(resolvedDb), "brand.db attendu après boot");

const now = new Date().toISOString();
try {
  brand.prepare(
    `INSERT INTO fournisseurs (id, nom, created_at, updated_at) VALUES (?, ?, ?, ?)`,
  ).run("f1", "Metro", now, now);
  brand.prepare(
    `INSERT INTO produits (id, nom, fournisseur_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
  ).run("p1", "Tomates", "f1", now, now);
} catch {
  try {
    brand.prepare(
      `INSERT INTO notes (id, titre, contenu, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    ).run("n1", "Tomates", "note", now, now);
  } catch {
    /* schéma minimal */
  }
}
close();

const { runFeedIndexation, searchMeiliIndexes } = await import(
  pathToFileURL(
    path.join(creezioRoot || path.join(root, "../.."), "packages/electron-shell/dist/host/meili/generic-indexer.js"),
  ).href
);

const result = await runFeedIndexation({
  feed: feedMod.brandMeiliFeed,
  dbPath: resolvedDb,
  meiliHost: host,
  masterKey: "test",
  log: () => {},
});
assert.equal(result.engine, "meili");
assert.ok(Object.keys(result.indexed).length >= 1);

const hits = await searchMeiliIndexes({
  host,
  masterKey: "test",
  indexUids: feedMod.brandMeiliFeed.indexes.map((i) => i.uid),
  query: "tom",
});
assert.ok(hits.length >= 1, "search fake Meili doit trouver Tomates");

fake.close();
console.log("OK test:meili-config (tempoflow3 feed générique + fake Meili)");
