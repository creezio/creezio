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
  "src/lib/host-stack.ts",
  "src/lib/paths.ts",
  "src/lib/connection-profile.ts",
  "src/lib/creezio-boot.ts",
  "src/electron/main.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "scripts/brand-kernel-harness.mjs",
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), \`manquant: \${rel}\`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /bootBrandKernel/);
assert.doesNotMatch(main, /spawnBrandMetierApi|metier-api\\.mjs|createFileLocalConfigStore/);

assert.ok(!fs.existsSync(path.join(root, "scripts/metier-api.mjs")), "sidecar JSON interdit");

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, ${JSON.stringify(model.brandId)});

const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);

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
assert.match(main, /bootBrandKernel/);
assert.match(main, /registerDesktopSessionIpc/);
assert.doesNotMatch(main, /spawnBrandMetierApi/);

console.log("OK test:setup-login (OS kit + bootBrandKernel)");
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
      ent.name === ".data-metier"
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

const required = [
  "src/electron/main.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "scripts/brand-kernel-harness.mjs",
  "crm/src/brand/schema.sql",
  "product-model.json",
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), \`manquant: \${rel}\`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /bootBrandKernel/);
assert.match(main, /createDesktopSessionStore/);
assert.doesNotMatch(main, /spawnBrandMetierApi/);

const modApi = fs.readFileSync(
  path.join(root, "src/electron/brand-module-api.ts"),
  "utf8",
);
assert.match(modApi, /registerModuleApi/);
assert.doesNotMatch(modApi, /delegate_to_metier_api/);

console.log("OK test:allowlist ${model.brandName} (OS natif, pas sidecar JSON)");
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
