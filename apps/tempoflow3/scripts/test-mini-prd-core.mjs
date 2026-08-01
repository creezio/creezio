#!/usr/bin/env node
/**
 * Smokes mini-PRDs 01–05 — logique écrite dans la marque (pas template kit).
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-miniprd-"));
const port = 19200 + Math.floor(Math.random() * 400);

const child = spawn(process.execPath, [path.join(root, "scripts/metier-api.mjs")], {
  env: { ...process.env, METIER_DATA_DIR: dataDir, METIER_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("health timeout");
}

async function json(method, urlPath, body) {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.ok(
    res.ok,
    `${method} ${urlPath} -> ${res.status} ${JSON.stringify(data)}`,
  );
  return data;
}

async function main() {
  await waitHealth();

  // 01 — fournisseurs : créer 2, archiver 1, filtre archivés + recherche
  const f1 = await json("POST", "/api/v1/brand/fournisseurs", {
    nom: "Metro",
    contact: "Jean",
  });
  const f2 = await json("POST", "/api/v1/brand/fournisseurs", {
    nom: "Promocash",
    email: "a@promo.test",
  });
  await json("POST", `/api/v1/brand/fournisseurs/${f2.id}/archive`, {});
  const actifs = await json("GET", "/api/v1/brand/fournisseurs?archived=0");
  assert.equal(actifs.items.length, 1);
  assert.equal(actifs.items[0].id, f1.id);
  const archives = await json("GET", "/api/v1/brand/fournisseurs?archived=1");
  assert.equal(archives.items.length, 1);
  const search = await json("GET", "/api/v1/brand/fournisseurs?q=metro&archived=0");
  assert.equal(search.items.length, 1);

  // 02 — produits rattachés
  const p = await json("POST", "/api/v1/brand/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
    fournisseur_id: f1.id,
  });
  const byF = await json("GET", `/api/v1/brand/produits?fournisseur_id=${f1.id}`);
  assert.ok(byF.items.some((x) => x.id === p.id));

  // 03 — prix historique + promo
  await json("POST", "/api/v1/brand/prix", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    montant: 2.5,
    devise: "EUR",
  });
  await json("POST", "/api/v1/brand/prix", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    montant: 2.1,
    devise: "EUR",
    promo: true,
    promo_label: "flash",
  });
  const hist = await json(
    "GET",
    `/api/v1/brand/prix?produit_id=${p.id}&fournisseur_id=${f1.id}`,
  );
  assert.equal(hist.items.length, 2);
  const promos = await json("GET", "/api/v1/brand/prix?promo=1");
  assert.ok(promos.items.some((x) => x.promo_label === "flash"));

  // 04 — panier totaux + préremplissage prix
  await json("POST", "/api/v1/brand/panier_lignes", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    quantite: 4,
  });
  await json("POST", "/api/v1/brand/panier_lignes", {
    produit_id: p.id,
    fournisseur_id: f1.id,
    quantite: 1,
    prix_unitaire: 2.1,
  });
  const panier = await json("GET", "/api/v1/brand/panier_lignes");
  assert.equal(panier.items.length, 2);
  assert.equal(panier.total_ht, 4 * 2.1 + 1 * 2.1);
  assert.equal(panier.by_fournisseur.length, 1);

  // 05 — commande + statut
  const cmd = await json("POST", "/api/v1/brand/commandes/from-panier", {
    fournisseur_id: f1.id,
  });
  assert.equal(cmd.statut, "brouillon");
  assert.equal(cmd.total_ht, 4 * 2.1 + 1 * 2.1);
  const empty = await json("GET", "/api/v1/brand/panier_lignes");
  assert.equal(empty.items.length, 0);
  const sent = await json("PATCH", `/api/v1/brand/commandes/${cmd.id}`, {
    statut: "envoyee",
  });
  assert.equal(sent.statut, "envoyee");

  const dash = await json("GET", "/api/v1/brand/dashboard");
  assert.equal(dash.commandes, 1);
  assert.ok(dash.promos >= 1);

  console.log("OK test:mini-prd-core (01–05 archive/search/prix/panier/commandes)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
