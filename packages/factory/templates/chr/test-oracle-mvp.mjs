#!/usr/bin/env node
/**
 * Parity oracle MVP — search, dispatch, promotions, skus, site, api publique.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-oracle-"));
const port = 19100 + Math.floor(Math.random() * 500);

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
  assert.ok(res.ok, `${method} ${urlPath} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  await waitHealth();
  const f = await json("POST", "/api/v1/brand/fournisseurs", { nom: "Metro" });
  const p = await json("POST", "/api/v1/brand/produits", {
    nom: "Tomates",
    unite: "kg",
    fournisseur_id: f.id,
  });
  await json("POST", "/api/v1/brand/prix", {
    produit_id: p.id,
    fournisseur_id: f.id,
    montant: 2.1,
    promo: true,
    promo_label: "flash",
  });
  await json("POST", "/api/v1/brand/panier_lignes", {
    produit_id: p.id,
    fournisseur_id: f.id,
    quantite: 3,
    prix_unitaire: 2.1,
  });

  const search = await json("GET", "/api/v1/brand/search?q=tomat");
  assert.ok(search.produits.length >= 1);

  const promos = await json("GET", "/api/v1/brand/promotions");
  assert.ok(promos.items.length >= 1);

  const skus = await json("GET", "/api/v1/brand/skus");
  assert.ok(skus.items.some((s) => s.produit_id === p.id));

  const site = await json("GET", `/api/v1/brand/site/${f.id}`);
  assert.equal(site.fournisseur.id, f.id);
  assert.ok(site.produits.length >= 1);

  const dispatch = await json("POST", "/api/v1/brand/dispatch/candidates", {});
  assert.ok(dispatch.candidates.length >= 1);
  assert.ok(dispatch.candidates[0].recommended);

  const pub = await json("GET", "/api/public/v1/health");
  assert.equal(pub.public, true);
  const catalog = await json("GET", "/api/public/v1/catalog");
  assert.ok(catalog.count >= 1);

  console.log("OK test:oracle-mvp (search/dispatch/promos/skus/site/public)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
