/**
 * Générateurs de smokes métier / first-run (F3 / F2).
 */
import type { ProductModel } from "../product-model.js";

export function renderMetierParcoursSmoke(model: ProductModel): string {
  const hasChr =
    model.entities.some((e) => e.id === "fournisseurs") &&
    model.entities.some((e) => e.id === "panier_lignes") &&
    model.entities.some((e) => e.id === "commandes");

  if (!hasChr) {
    return `#!/usr/bin/env node
/**
 * Smoke métier générique — notes CRUD.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-metier-"));
const port = 19000 + Math.floor(Math.random() * 1000);

const child = spawn(process.execPath, [path.join(root, "scripts/metier-api.mjs")], {
  env: { ...process.env, METIER_DATA_DIR: dataDir, METIER_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(\`http://127.0.0.1:\${port}/health\`);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("metier-api health timeout");
}

async function main() {
  await waitHealth();
  const base = \`http://127.0.0.1:\${port}\`;
  const create = await fetch(\`\${base}/api/v1/brand/notes\`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ titre: "Hello", contenu: "world" }),
  });
  assert.equal(create.status, 201);
  const list = await fetch(\`\${base}/api/v1/brand/notes\`);
  const body = await list.json();
  assert.ok(body.items.length >= 1);
  console.log("OK test:metier-parcours (notes)");
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
 * Smoke parcours CHR — fournisseurs → produit/prix → panier → commande.
 * Généré par creezio factory --from-prd.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-metier-"));
const port = 19000 + Math.floor(Math.random() * 1000);

const child = spawn(process.execPath, [path.join(root, "scripts/metier-api.mjs")], {
  env: { ...process.env, METIER_DATA_DIR: dataDir, METIER_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(\`http://127.0.0.1:\${port}/health\`);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("metier-api health timeout");
}

async function json(method, urlPath, body) {
  const res = await fetch(\`http://127.0.0.1:\${port}\${urlPath}\`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.ok(res.ok, \`\${method} \${urlPath} -> \${res.status} \${JSON.stringify(data)}\`);
  return data;
}

async function main() {
  await waitHealth();

  const fournisseur = await json("POST", "/api/v1/brand/fournisseurs", {
    nom: "Metro CHR",
    contact: "Jean",
    email: "jean@metro.test",
  });
  assert.ok(fournisseur.id);

  const produit = await json("POST", "/api/v1/brand/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
    fournisseur_id: fournisseur.id,
  });

  const prix = await json("POST", "/api/v1/brand/prix", {
    produit_id: produit.id,
    fournisseur_id: fournisseur.id,
    montant: 2.4,
    devise: "EUR",
  });
  assert.equal(prix.montant, 2.4);

  await json("POST", "/api/v1/brand/panier_lignes", {
    produit_id: produit.id,
    fournisseur_id: fournisseur.id,
    quantite: 5,
    prix_unitaire: 2.4,
  });

  const commande = await json("POST", "/api/v1/brand/commandes/from-panier", {
    fournisseur_id: fournisseur.id,
  });
  assert.equal(commande.statut, "brouillon");
  assert.equal(commande.total_ht, 12);
  assert.ok(Array.isArray(commande.lignes) && commande.lignes.length === 1);

  const panier = await json("GET", "/api/v1/brand/panier_lignes");
  assert.equal(panier.items.length, 0);

  const commandes = await json("GET", "/api/v1/brand/commandes");
  assert.equal(commandes.items.length, 1);

  console.log("OK test:metier-parcours fournisseurs→prix→panier→commande");
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
 * Smoke first-run auth portable — vérifie wiring onboarding / store local.
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
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), \`manquant: \${rel}\`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /installBrandDesktopRuntime/);
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
assert.doesNotMatch(main, /createFileLocalConfigStore|local-config-store/);

const forbidden = [
  "src/electron/local-config-store.ts",
  "src/electron/ipc-bridge.ts",
];
for (const rel of forbidden) {
  assert.ok(
    !fs.existsSync(path.join(root, rel)),
    \`OS custom interdit dans marque: \${rel}\`,
  );
}

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, ${JSON.stringify(model.brandId)});
assert.ok(model.platformNeeds?.auth !== false);

const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
assert.match(hostStack, /createMemoryLocalConfigStore/);
assert.match(hostStack, /isSetupComplete/);

console.log("OK test:first-run-auth (wiring portable ${model.brandId})");
`;
}

export function renderSetupLoginSmoke(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * First-run setup + login — API OS kit (@creezio/electron-shell), sans GUI.
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
    /* hors node_modules — fallback monorepo / CREEZIO_ROOT */
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
  throw new Error(
    "createDesktopSessionStore introuvable — installer @creezio/electron-shell ou définir CREEZIO_ROOT",
  );
}

const createDesktopSessionStore = await loadCreateDesktopSessionStore();
assert.equal(typeof createDesktopSessionStore, "function");

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/electron/app-manifest.json"), "utf8"),
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-setup-"));
const session = createDesktopSessionStore({ userDataDir: tmp, manifest });

assert.equal(session.isSetupComplete(), false);
assert.equal(session.getSetupStatus().setupComplete, false);

const done = session.completeSetup("chef", "secret-chr");
assert.equal(done.ok, true);
assert.ok(done.sessionToken);
assert.equal(session.isSetupComplete(), true);

assert.equal(session.login("chef", "wrong").ok, false);
const ok = session.login("chef", "secret-chr");
assert.equal(ok.ok, true);
assert.ok(ok.sessionToken);

const sess = session.getSession();
assert.equal(sess.authenticated, true);
assert.equal(sess.user, "chef");

session.chooseConnection({
  mode: "local",
  localBind: "127.0.0.1",
  chosen: true,
});
assert.equal(session.getConnectionProfile().chosen, true);

session.logout();
assert.equal(session.getSession().authenticated, false);

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
assert.match(main, /spawnBrandMetierApi/);
assert.doesNotMatch(main, /createFileLocalConfigStore/);

const preload = fs.readFileSync(path.join(root, "src/electron/preload.ts"), "utf8");
assert.match(preload, /auth:login/);
assert.match(preload, /setup:complete/);

for (const rel of [
  "src/electron/local-config-store.ts",
  "src/electron/ipc-bridge.ts",
]) {
  assert.ok(!fs.existsSync(path.join(root, rel)), \`interdit: \${rel}\`);
}

console.log("OK test:setup-login (OS kit createDesktopSessionStore)");
`;
}
