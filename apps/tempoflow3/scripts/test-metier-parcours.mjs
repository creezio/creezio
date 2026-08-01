#!/usr/bin/env node
/**
 * Smoke parcours CHR + modules étendus TempoFlow3.
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
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("metier-api health timeout");
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

  // Dashboard
  const dash = await json("GET", "/api/v1/brand/dashboard");
  assert.ok(Array.isArray(dash.raccourcis));

  // Fournisseurs
  const f1 = await json("POST", "/api/v1/brand/fournisseurs", {
    nom: "Metro CHR",
    contact: "Jean",
    site_web: "https://metro.test",
  });
  const f2 = await json("POST", "/api/v1/brand/fournisseurs", {
    nom: "Promocash",
    contact: "Marie",
  });
  await json("DELETE", `/api/v1/brand/fournisseurs/${f2.id}`);
  const archived = await json("GET", "/api/v1/brand/fournisseurs?archived=1");
  assert.equal(archived.items.length, 1);

  // Secteur + marketplace
  const secteur = await json("POST", "/api/v1/brand/secteurs", {
    nom: "Légumes",
    description: "Frais",
  });
  await json("POST", "/api/v1/brand/marketplaces", { nom: "Rungis digital" });
  await json("POST", "/api/v1/brand/agregateurs", { nom: "AgriAgg", url: "https://agg.test" });

  // Produits
  const pTomate = await json("POST", "/api/v1/brand/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
    secteur_id: secteur.id,
    fournisseur_id: f1.id,
  });
  const pSalade = await json("POST", "/api/v1/brand/produits", {
    nom: "Salade",
    unite: "pièce",
    fournisseur_id: f1.id,
  });

  // Prix + historique + promo
  await json("POST", "/api/v1/brand/prix", {
    produit_id: pTomate.id,
    fournisseur_id: f1.id,
    montant: 2.8,
    devise: "EUR",
  });
  await json("POST", "/api/v1/brand/prix", {
    produit_id: pTomate.id,
    fournisseur_id: f1.id,
    montant: 2.4,
    devise: "EUR",
    promo: true,
    promo_label: "-14%",
  });
  await json("POST", "/api/v1/brand/prix", {
    produit_id: pTomate.id,
    fournisseur_id: f2.id,
    montant: 3.1,
    devise: "EUR",
  });
  const hist = await json(
    "GET",
    `/api/v1/brand/prix/historique?produit_id=${pTomate.id}&fournisseur_id=${f1.id}`,
  );
  assert.ok(hist.items.length >= 2);

  // Data-mapping
  await json("POST", "/api/v1/brand/data_mappings", {
    libelle_fournisseur: "TOMATE RONDE",
    fournisseur_id: f1.id,
    produit_id: pTomate.id,
  });
  const resolved = await json("POST", "/api/v1/brand/data-mapping/resolve", {
    libelle: "TOMATE RONDE",
    fournisseur_id: f1.id,
  });
  assert.equal(resolved.produit.id, pTomate.id);

  // Stack
  await json("POST", "/api/v1/brand/stack/toggle", { produit_id: pTomate.id });
  await json("POST", "/api/v1/brand/stack/toggle", { produit_id: pSalade.id });
  await json("POST", "/api/v1/brand/stack/toggle", { produit_id: pSalade.id }); // remove
  const stack = await json("GET", "/api/v1/brand/stack/enriched");
  assert.equal(stack.items.length, 1);

  // Panier
  await json("POST", "/api/v1/brand/panier_lignes", {
    produit_id: pTomate.id,
    fournisseur_id: f1.id,
    quantite: 5,
    prix_unitaire: 2.4,
  });
  const totaux = await json("GET", "/api/v1/brand/panier/totaux");
  assert.equal(totaux.total_ht, 12);

  // Optimiser
  const opt = await json("POST", "/api/v1/brand/optimiser/suggest", {
    besoins: [{ produit_id: pTomate.id, quantite: 2 }],
  });
  assert.ok(opt.suggestions.length >= 1);
  assert.ok(opt.economie_ht >= 0);

  // Commande
  const commande = await json("POST", "/api/v1/brand/commandes/from-panier", {
    fournisseur_id: f1.id,
  });
  assert.equal(commande.statut, "brouillon");
  assert.equal(commande.total_ht, 12);
  const sent = await json("POST", `/api/v1/brand/commandes/${commande.id}/statut`, {
    statut: "envoyee",
  });
  assert.equal(sent.statut, "envoyee");

  // Relevés
  const releve = await json("POST", "/api/v1/brand/releves", {
    date_releve: "2026-08-01",
    fournisseur_id: f1.id,
    source: "magasin",
    lignes: [{ produit_id: pTomate.id, montant: 2.2 }],
  });
  const applied = await json("POST", `/api/v1/brand/releves/${releve.id}/apply`, {});
  assert.equal(applied.applied, 1);

  // Scan
  const scan = await json("POST", "/api/v1/brand/scan/start", {
    note: "étiquette",
    propositions: [
      { nom: "Courgettes", montant: 1.9, fournisseur_id: f1.id, unite: "kg" },
    ],
  });
  const validated = await json("POST", `/api/v1/brand/scan/${scan.id}/validate`, {});
  assert.ok(validated.results.produits.length + validated.results.prix.length >= 1);

  // Schema pages
  const schema = await json("GET", "/api/v1/brand/schema");
  assert.ok(schema.pages.some((p) => p.id === "optimiser"));
  assert.ok(schema.entities.includes("data_mappings"));

  console.log("OK test:metier-parcours TempoFlow3 (cœur + modules étendus)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
