#!/usr/bin/env node
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
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-metier-"));
const port = 19000 + Math.floor(Math.random() * 1000);

const child = spawn(process.execPath, [path.join(root, "scripts/metier-api.mjs")], {
  env: { ...process.env, METIER_DATA_DIR: dataDir, METIER_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("metier-api health timeout");
}

async function json(method, urlPath, body) {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.ok(res.ok, `${method} ${urlPath} -> ${res.status} ${JSON.stringify(data)}`);
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
