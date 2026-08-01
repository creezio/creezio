#!/usr/bin/env node
/**
 * Mini-PRDs 06–11 — optimiser, stack, relevés, scan, dashboard, marketplaces.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-bonus-"));
const port = 19000 + Math.floor(Math.random() * 1000);

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

const child = spawn(
  process.execPath,
  [path.join(root, "scripts/brand-kernel-harness.mjs")],
  {
    env: {
      ...toolEnv,
      METIER_DATA_DIR: dataDir,
      METIER_PORT: String(port),
      MEILI_SKIP_INDEX: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

async function waitHealth() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/core/health`);
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

  const f1 = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Metro" });
  const f2 = await json("POST", "/api/v1/modules/fournisseurs", {
    nom: "Promocash",
  });
  const p1 = await json("POST", "/api/v1/modules/produits", {
    nom: "Tomates",
    unite: "kg",
    categorie: "légumes",
  });
  const p2 = await json("POST", "/api/v1/modules/produits", {
    nom: "Oignons",
    unite: "kg",
  });
  const p3 = await json("POST", "/api/v1/modules/produits", {
    nom: "Carottes",
    unite: "kg",
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p1.id,
    fournisseur_id: f1.id,
    montant: 3.0,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p1.id,
    fournisseur_id: f2.id,
    montant: 2.2,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p2.id,
    fournisseur_id: f1.id,
    montant: 1.5,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p2.id,
    fournisseur_id: f2.id,
    montant: 1.1,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p3.id,
    fournisseur_id: f1.id,
    montant: 2.0,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p3.id,
    fournisseur_id: f2.id,
    montant: 1.8,
  });

  // stack 07
  for (const p of [p1, p2, p3, p1, p2]) {
    await json("POST", "/api/v1/modules/stack", { produit_id: p.id });
  }
  let stack = await json("GET", "/api/v1/modules/stack");
  assert.equal(stack.items.length, 3);
  await json("DELETE", `/api/v1/modules/stack/${p3.id}`);
  stack = await json("GET", "/api/v1/modules/stack");
  assert.equal(stack.items.length, 2);
  await json("POST", `/api/v1/modules/stack/${p1.id}/panier`, { quantite: 2 });
  await json("POST", `/api/v1/modules/stack/${p2.id}/panier`, { quantite: 1 });

  // optimiser 06
  const suggest = await json("POST", "/api/v1/modules/optimiser/suggest", {
    from: "panier",
  });
  assert.ok(suggest.propositions.length >= 2);
  assert.ok(typeof suggest.economie_eur === "number");
  await json("POST", "/api/v1/modules/optimiser/apply", {
    propositions: suggest.propositions,
  });
  const panier = await json("GET", "/api/v1/modules/panier_lignes");
  assert.ok(panier.items.length >= 2);

  // relevés 08
  const releve = await json("POST", "/api/v1/modules/releves", {
    fournisseur_id: f2.id,
    source: "magasin",
    lignes: [
      { produit_id: p1.id, libelle: "Tomates", montant: 2.0 },
      { produit_id: p2.id, libelle: "Oignons", montant: 1.0 },
      { produit_id: p3.id, libelle: "Carottes", montant: 1.7 },
    ],
  });
  assert.equal(releve.lignes.length, 3);
  const applied = await json(
    "POST",
    `/api/v1/modules/releves/${releve.id}/apply-prix`,
    {},
  );
  assert.equal(applied.prix_crees, 3);

  // scan 09
  const scan = await json("POST", "/api/v1/modules/scan/start", {
    lignes_texte: [`Poivrons|2.5|${f1.id}`],
  });
  assert.ok(scan.propositions.length >= 1);
  const validated = await json(
    "POST",
    `/api/v1/modules/scan/${scan.id}/validate`,
    {},
  );
  assert.equal(validated.statut, "valide");
  assert.ok(validated.written.prix >= 1);

  // dashboard 10
  const dash = await json("GET", "/api/v1/modules/dashboard");
  assert.ok(dash.orientation);
  assert.ok(Array.isArray(dash.raccourcis) && dash.raccourcis.length >= 4);
  assert.ok(dash.stack >= 2);

  // marketplaces + secteurs + data-mapping 11
  const mp = await json("POST", "/api/v1/modules/marketplaces", {
    nom: "Metro Market",
  });
  await json("POST", `/api/v1/modules/marketplaces/${mp.id}/link`, {
    fournisseur_id: f1.id,
  });
  const sec = await json("POST", "/api/v1/modules/secteurs", {
    nom: "Légumes",
  });
  await json("POST", `/api/v1/modules/secteurs/${sec.id}/link-produit`, {
    produit_id: p1.id,
  });
  const map = await json("POST", "/api/v1/modules/data_mappings", {
    libelle_externe: "TOMATE RONDE KG",
    fournisseur_id: f1.id,
    produit_id: p1.id,
  });
  const resolved = await json(
    "GET",
    `/api/v1/modules/data_mappings/x/resolve?libelle=TOMATE%20RONDE%20KG&fournisseur_id=${f1.id}`,
  );
  assert.equal(resolved.produit_id, p1.id);
  assert.equal(map.produit_id, p1.id);

  const agreg = await json("POST", "/api/v1/modules/agregateurs", {
    nom: "AgriPool",
  });
  await json("POST", `/api/v1/modules/agregateurs/${agreg.id}/link`, {
    fournisseur_id: f2.id,
  });

  console.log("OK test:mini-prd-bonus (06–11)");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
});
