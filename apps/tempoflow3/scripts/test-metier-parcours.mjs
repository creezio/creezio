#!/usr/bin/env node
/**
 * Smoke parcours cœur — api-kernel + brand.db (pas de store.json).
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-metier-"));
const port = 19000 + Math.floor(Math.random() * 1000);

const creezioRoot = process.env.CREEZIO_ROOT || "";
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
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/core/health`);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("brand-kernel-harness health timeout");
}

async function json(method, urlPath, body) {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.ok(res.ok, `${method} ${urlPath} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}


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
