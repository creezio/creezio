/**
 * Générateurs de smokes — kernel natif (pas de store.json).
 */
import type { ProductModel } from "../product-model.js";

function harnessPrelude(model: ProductModel): string {
  return `
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-metier-"));
const port = 19000 + Math.floor(Math.random() * 1000);

const creezioRoot = process.env.CREEZIO_ROOT || "";
// Hors monorepo (/tmp) : partager node_modules du kit (tsc + @types + packages).
const localNm = path.join(root, "node_modules");
if (creezioRoot && !fs.existsSync(localNm)) {
  const kitNm = path.join(creezioRoot, "node_modules");
  if (fs.existsSync(kitNm)) {
    fs.symlinkSync(kitNm, localNm, "dir");
  }
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

const child = spawn(
  process.execPath,
  [path.join(root, "scripts/brand-kernel-harness.mjs")],
  {
    env: {
      ...toolEnv,
      METIER_DATA_DIR: dataDir,
      METIER_PORT: String(port),
      // Harness métier : session virtuelle (garde mounts F3). Surface prod-like = gate module-mount-session.
      AUTH_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

async function waitHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(\`http://127.0.0.1:\${port}/api/v1/core/health\`);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("brand-kernel-harness health timeout");
}

async function json(method, urlPath, body) {
  const res = await fetch(\`http://127.0.0.1:\${port}\${urlPath}\`, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.ok(res.ok, \`\${method} \${urlPath} -> \${res.status} \${JSON.stringify(data)}\`);
  return data;
}
`;
}

export function renderMetierParcoursSmoke(model: ProductModel): string {
  const hasChr =
    model.entities.some((e) => e.id === "fournisseurs") &&
    model.entities.some((e) => e.id === "panier_lignes") &&
    model.entities.some((e) => e.id === "commandes");

  if (!hasChr) {
    return `#!/usr/bin/env node
/**
 * Smoke métier générique — notes via api-kernel + SQLite.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
${harnessPrelude(model)}

async function main() {
  await waitHealth();
  const create = await json("POST", "/api/v1/modules/notes", {
    titre: "Hello",
    contenu: "world",
  });
  assert.ok(create.id);
  const list = await json("GET", "/api/v1/modules/notes");
  assert.ok(list.items.length >= 1);
  assert.ok(!fs.existsSync(path.join(dataDir, "store.json")));
  console.log("OK test:metier-parcours (notes / api-kernel)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
`;
  }

  return `#!/usr/bin/env node
/**
 * Smoke parcours cœur — api-kernel + brand.db (pas de store.json).
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
${harnessPrelude(model)}

async function main() {
  await waitHealth();

  const fournisseur = await json("POST", "/api/v1/modules/fournisseurs", {
    nom: "Metro CHR",
    contact: "Jean",
    email: "jean@metro.test",
  });
  assert.ok(fournisseur.id);

  const produit = await json("POST", "/api/v1/modules/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
    fournisseur_id: fournisseur.id,
  });

  const prix = await json("POST", "/api/v1/modules/prix", {
    produit_id: produit.id,
    fournisseur_id: fournisseur.id,
    montant: 2.4,
    devise: "EUR",
  });
  assert.equal(prix.montant, 2.4);

  await json("POST", "/api/v1/modules/panier_lignes", {
    produit_id: produit.id,
    fournisseur_id: fournisseur.id,
    quantite: 5,
    prix_unitaire: 2.4,
  });

  const commande = await json("POST", "/api/v1/modules/commandes/from-panier", {
    fournisseur_id: fournisseur.id,
  });
  assert.equal(commande.statut, "brouillon");
  assert.equal(commande.total_ht, 12);
  assert.ok(Array.isArray(commande.lignes) && commande.lignes.length === 1);

  const panier = await json("GET", "/api/v1/modules/panier_lignes");
  assert.equal(panier.items.length, 0);

  const commandes = await json("GET", "/api/v1/modules/commandes");
  assert.equal(commandes.items.length, 1);

  const search = await json("GET", "/api/v1/modules/search?q=tom");
  assert.ok(search.engine === "sql" || search.engine === "meili");
  assert.ok(Array.isArray(search.items) && search.items.length >= 1);

  // Preuve persistence native SQLite (pas store.json)
  assert.ok(
    !fs.existsSync(path.join(dataDir, "store.json")),
    "store.json interdit — SoT = brand.db",
  );

  console.log("OK test:metier-parcours api-kernel fournisseurs→commande");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
`;
}

export function renderFirstRunAuthSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * Smoke first-run + wiring natif (kernel, pas sidecar JSON).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "src/electron/main.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "src/electron/meili-feed.ts",
  "src/electron/vertical-slot.ts",
  "scripts/brand-kernel-harness.mjs",
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), \`manquant: \${rel}\`);
}

const forbidden = [
  "src/lib/host-stack.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/product-hub-stub.ts",
  "scripts/metier-api.mjs",
];
for (const rel of forbidden) {
  assert.ok(!fs.existsSync(path.join(root, rel)), \`interdit: \${rel}\`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.match(main, /@creezio\\/app-runtime/);
assert.doesNotMatch(main, /spawnBrandMetierApi|metier-api\\.mjs|bootBrandKernel|brand-runtime|listenBrandKernelHttp|prepareDesktopBoot/);

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, ${JSON.stringify(model.brandId)});

console.log("OK test:first-run-auth (wiring natif ${model.brandId})");
`;
}

export function renderSetupLoginSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * First-run setup + login — API OS kit (@creezio/electron-shell).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadCreateDesktopSessionStore() {
  try {
    const mod = await import("@creezio/electron-shell");
    if (typeof mod.createDesktopSessionStore === "function") {
      return mod.createDesktopSessionStore;
    }
  } catch {
    /* fallback */
  }
  const candidates = [];
  if (process.env.CREEZIO_ROOT) {
    candidates.push(
      path.join(process.env.CREEZIO_ROOT, "packages/electron-shell/dist/index.js"),
    );
  }
  let dir = root;
  for (let i = 0; i < 8; i++) {
    candidates.push(path.join(dir, "packages/electron-shell/dist/index.js"));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      const mod = await import(pathToFileURL(cand).href);
      return mod.createDesktopSessionStore;
    }
  }
  throw new Error("createDesktopSessionStore introuvable");
}

const createDesktopSessionStore = await loadCreateDesktopSessionStore();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/electron/app-manifest.json"), "utf8"),
);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-setup-"));
const session = createDesktopSessionStore({ userDataDir: tmp, manifest });

assert.equal(session.isSetupComplete(), false);
const done = session.completeSetup("chef", "secret-os");
assert.equal(done.ok, true);
assert.equal(session.login("chef", "secret-os").ok, true);
session.logout();

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.doesNotMatch(main, /spawnBrandMetierApi|bootBrandKernel/);

console.log("OK test:setup-login (OS kit + startBrandDesktop)");
`;
}

export function renderAllowlistSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * Allowlist — pas de launchers OS / pas de sidecar JSON métier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const forbiddenNameSnippets = [
  "hermes-launcher",
  "n8n-launcher",
  "meili-launcher",
  "fleet-agent",
  "plugin-control-api",
  "crash-reporter",
  "local-config-store",
  "ipc-bridge",
  "metier-api",
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "build" ||
      ent.name === ".data-metier" ||
      ent.name === "vendor" ||
      ent.name === ".git" ||
      ent.name === "(creezio-os)"
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

for (const f of walk(root)) {
  const base = path.basename(f).toLowerCase();
  for (const bad of forbiddenNameSnippets) {
    assert.ok(!base.includes(bad), \`fichier OS/sidecar interdit: \${f}\`);
  }
}

// ui/app versionné = métier uniquement (pas de pages OS natives).
const forbiddenOsUiDirs = [
  "admin",
  "cockpit",
  "collaborateurs",
  "configuration",
  "developers",
  "login",
  "mails",
  "mcp",
  "onboarding",
  "parametres",
  "server-cockpit",
  "settings",
  "setup",
  "taches",
];
const uiApp = path.join(root, "ui/app");
if (fs.existsSync(uiApp)) {
  for (const seg of forbiddenOsUiDirs) {
    assert.ok(
      !fs.existsSync(path.join(uiApp, seg)),
      \`page OS versionnée interdite dans la marque: ui/app/\${seg} (utiliser @creezio/os-ui)\`,
    );
  }
  assert.ok(
    !fs.existsSync(path.join(uiApp, "lib/creezio-ui-boot.tsx")),
    "boot OS versionné interdit — importer @creezio/os-ui/boot",
  );
}

const required = [
  "src/electron/main.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "src/electron/meili-feed.ts",
  "scripts/brand-kernel-harness.mjs",
  "crm/src/brand/schema.sql",
  "product-model.json",
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), \`manquant: \${rel}\`);
}
assert.ok(!fs.existsSync(path.join(root, "src/electron/brand-runtime.ts")));
assert.ok(!fs.existsSync(path.join(root, "src/lib/host-stack.ts")));

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.doesNotMatch(main, /spawnBrandMetierApi|listenBrandKernelHttp|bootBrandKernel/);

const modApi = fs.readFileSync(
  path.join(root, "src/electron/brand-module-api.ts"),
  "utf8",
);
assert.match(modApi, /registerModuleApi/);
assert.match(modApi, /createSearchMount|modules\\/search|\"search\"/);
assert.doesNotMatch(modApi, /delegate_to_metier_api/);

const feed = fs.readFileSync(path.join(root, "src/electron/meili-feed.ts"), "utf8");
assert.match(feed, /brandMeiliFeed|createChrCatalogMeiliFeed/);
assert.doesNotMatch(feed, /tf2_produits|tf2_marketplaces/);

console.log("OK test:allowlist ${model.brandName} (OS natif, pas sidecar JSON)");
`;
}

export function renderMeiliConfigSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
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
  dataDir: path.join(os.tmpdir(), "${model.brandId}-meili-none"),
  userDataDir: path.join(os.tmpdir(), "${model.brandId}-ud-none"),
});
assert.equal(none, null, "sans binaire → null (fallback SQL documenté)");

const feedMod = await import(
  pathToFileURL(path.join(root, "build/electron/meili-feed.js")).href
);
assert.ok(feedMod.brandMeiliFeed?.indexes?.length >= 1);
for (const idx of feedMod.brandMeiliFeed.indexes) {
  assert.ok(!String(idx.uid).startsWith("tf2_"), \`UID legacy interdit dans feed: \${idx.uid}\`);
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
const host = \`http://127.0.0.1:\${port}\`;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-meili-idx-"));
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
    \`INSERT INTO fournisseurs (id, nom, created_at, updated_at) VALUES (?, ?, ?, ?)\`,
  ).run("f1", "Metro", now, now);
  brand.prepare(
    \`INSERT INTO produits (id, nom, fournisseur_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)\`,
  ).run("p1", "Tomates", "f1", now, now);
} catch {
  try {
    brand.prepare(
      \`INSERT INTO notes (id, titre, contenu, created_at, updated_at) VALUES (?, ?, ?, ?, ?)\`,
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
console.log("OK test:meili-config (${model.brandId} feed générique + fake Meili)");
`;
}

export function renderMiniPrdCoreSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * Mini-PRDs 01–05 sur api-kernel + brand.db.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
${harnessPrelude(model)}

async function main() {
  await waitHealth();

  const f1 = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Metro" });
  const f2 = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Promocash" });
  await json("POST", \`/api/v1/modules/fournisseurs/\${f2.id}/archive\`, {});
  const actifs = await json("GET", "/api/v1/modules/fournisseurs?archived=0");
  assert.equal(actifs.items.length, 1);
  const archives = await json("GET", "/api/v1/modules/fournisseurs?archived=1");
  assert.equal(archives.items.length, 1);
  const search = await json("GET", "/api/v1/modules/fournisseurs?q=metro&archived=0");
  assert.equal(search.items.length, 1);

  const p = await json("POST", "/api/v1/modules/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
    fournisseur_id: f1.id,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    montant: 2.5,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    montant: 2.1,
    promo: true,
    promo_label: "flash",
  });
  const hist = await json(
    "GET",
    \`/api/v1/modules/prix?produit_id=\${p.id}&fournisseur_id=\${f1.id}\`,
  );
  assert.equal(hist.items.length, 2);

  await json("POST", "/api/v1/modules/panier_lignes", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    quantite: 4,
  });
  const panier = await json("GET", "/api/v1/modules/panier_lignes");
  assert.equal(panier.items.length, 1);
  assert.equal(panier.total_ht, 4 * 2.1);

  const cmd = await json("POST", "/api/v1/modules/commandes/from-panier", {
    fournisseur_id: f1.id,
  });
  assert.equal(cmd.statut, "brouillon");
  await json("PATCH", \`/api/v1/modules/commandes/\${cmd.id}\`, { statut: "envoyee" });

  const dash = await json("GET", "/api/v1/modules/dashboard");
  assert.equal(dash.commandes, 1);
  assert.ok(!fs.existsSync(path.join(dataDir, "store.json")));

  console.log("OK test:mini-prd-core (api-kernel / brand.db)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
`;
}
