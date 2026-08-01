#!/usr/bin/env node
/**
 * API métier TempoFlow — générée par creezio factory --from-prd.
 * Store JSON fichier (jetable pour tests). Pas de dépendance native.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DATA_DIR = process.env.METIER_DATA_DIR || path.join(ROOT, ".data-metier");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const ENTITY_IDS = ["fournisseurs","produits","prix","panier_lignes","commandes"];

function now() {
  return new Date().toISOString();
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const storePath = path.join(DATA_DIR, "store.json");
  if (!fs.existsSync(storePath)) {
    const empty = Object.fromEntries(ENTITY_IDS.map((id) => [id, []]));
    fs.writeFileSync(storePath, JSON.stringify(empty, null, 2));
  }
  return storePath;
}

function readStore() {
  const p = ensureStore();
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeStore(data) {
  const p = ensureStore();
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") {
    return send(res, 204, {});
  }

  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, brandId: "tempoflow3" });
  }

  if (url.pathname === "/api/v1/brand/schema") {
    return send(res, 200, {
      brandId: "tempoflow3",
      entities: ENTITY_IDS,
      pages: [{"id":"fournisseurs","path":"/fournisseurs","title":"Fournisseurs"},{"id":"produits","path":"/produits","title":"Produits"},{"id":"prix","path":"/prix","title":"Prix"},{"id":"panier","path":"/panier","title":"Panier"},{"id":"commandes","path":"/commandes","title":"Commandes"}],
      flows: [{"id":"commande_fournisseur","label":"Commander chez un fournisseur","steps":["fournisseurs","produits","prix","panier","commandes"]}],
    });
  }

  const listMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/?$/);
  const itemMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/([^/]+)\/?$/);


  // Flow: créer commande depuis le panier
  if (req.method === "POST" && url.pathname === "/api/v1/brand/commandes/from-panier") {
    const body = await readBody(req);
    const store = readStore();
    const lignes = store.panier_lignes || [];
    if (!lignes.length) return send(res, 400, { error: "panier_vide" });
    const fournisseurId = body.fournisseur_id || lignes[0].fournisseur_id;
    const related = lignes.filter((l) => l.fournisseur_id === fournisseurId);
    if (!related.length) return send(res, 400, { error: "aucune_ligne_fournisseur" });
    const total = related.reduce(
      (s, l) => s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
      0,
    );
    const commande = {
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
      fournisseur_id: fournisseurId,
      statut: "brouillon",
      total_ht: total,
      notes: body.notes || "",
      lignes: related,
    };
    store.commandes = store.commandes || [];
    store.commandes.push(commande);
    store.panier_lignes = lignes.filter((l) => l.fournisseur_id !== fournisseurId);
    writeStore(store);
    return send(res, 201, commande);
  }


  if (listMatch) {
    const entity = listMatch[1];
    if (!ENTITY_IDS.includes(entity)) return send(res, 404, { error: "unknown_entity" });
    const store = readStore();
    if (req.method === "GET") {
      return send(res, 200, { items: store[entity] || [] });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const row = {
        id: body.id || randomUUID(),
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      delete row.id; // reset then set
      row.id = body.id || randomUUID();
      store[entity] = store[entity] || [];
      store[entity].push(row);
      writeStore(store);
      return send(res, 201, row);
    }
  }

  if (itemMatch) {
    const entity = itemMatch[1];
    const id = itemMatch[2];
    if (!ENTITY_IDS.includes(entity)) return send(res, 404, { error: "unknown_entity" });
    const store = readStore();
    const items = store[entity] || [];
    const idx = items.findIndex((r) => r.id === id);
    if (req.method === "GET") {
      if (idx < 0) return send(res, 404, { error: "not_found" });
      return send(res, 200, items[idx]);
    }
    if (req.method === "PATCH") {
      if (idx < 0) return send(res, 404, { error: "not_found" });
      const body = await readBody(req);
      items[idx] = { ...items[idx], ...body, id, updated_at: now() };
      store[entity] = items;
      writeStore(store);
      return send(res, 200, items[idx]);
    }
    if (req.method === "DELETE") {
      if (idx < 0) return send(res, 404, { error: "not_found" });
      const [removed] = items.splice(idx, 1);
      store[entity] = items;
      writeStore(store);
      return send(res, 200, removed);
    }
  }

  send(res, 404, { error: "not_found", path: url.pathname });
}

export function startMetierServer(port = PORT) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      send(res, 500, { error: String(err?.message || err) });
    });
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      console.log(`metier-api tempoflow3 on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  ensureStore();
  startMetierServer();
}
