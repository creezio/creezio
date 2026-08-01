#!/usr/bin/env node
/**
 * API métier TempoFlow3 — écrite dans la marque (prompts 2–6 / mini-PRDs).
 *
 * Bootstrap factory = CRUD générique. Ce fichier a été enrichi from scratch :
 * - 01 fournisseurs : archive + recherche
 * - 02 produits : archive + recherche + filtre fournisseur
 * - 03 prix : historique (inserts), filtres, promo
 * - 04 panier : totaux + sous-totaux fournisseur
 * - 05 commandes : from-panier + statuts MVP
 *
 * Store JSON fichier (smoke sans Electron). Pas de copie tempoflow2.
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
const ENTITY_IDS = [
  "fournisseurs",
  "produits",
  "prix",
  "panier_lignes",
  "commandes",
];
const ARCHIVABLE = new Set(["fournisseurs", "produits"]);
const COMMANDE_STATUTS = new Set(["brouillon", "envoyee", "recue"]);

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
  return JSON.parse(fs.readFileSync(ensureStore(), "utf8"));
}

function writeStore(data) {
  fs.writeFileSync(ensureStore(), JSON.stringify(data, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
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

function isArchived(row) {
  return Boolean(row.archived_at);
}

function filterList(entity, items, url) {
  let out = items.slice();
  if (ARCHIVABLE.has(entity)) {
    const archived = url.searchParams.get("archived") || "0";
    if (archived === "0") out = out.filter((r) => !isArchived(r));
    else if (archived === "1") out = out.filter((r) => isArchived(r));
  }
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  if (q) {
    out = out.filter((r) => {
      const hay = [r.nom, r.contact, r.email, r.categorie, r.promo_label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  if (entity === "produits" || entity === "prix" || entity === "panier_lignes" || entity === "commandes") {
    const fid = url.searchParams.get("fournisseur_id");
    if (fid) out = out.filter((r) => r.fournisseur_id === fid);
  }
  if (entity === "prix") {
    const pid = url.searchParams.get("produit_id");
    if (pid) out = out.filter((r) => r.produit_id === pid);
    if (url.searchParams.get("promo") === "1") {
      out = out.filter((r) => Boolean(r.promo));
    }
  }
  return out;
}

function panierSummary(lignes) {
  const by = new Map();
  let total = 0;
  for (const l of lignes) {
    const line = Number(l.quantite || 0) * Number(l.prix_unitaire || 0);
    total += line;
    const fid = l.fournisseur_id || "unknown";
    const cur = by.get(fid) || { fournisseur_id: fid, lignes: 0, total_ht: 0 };
    cur.lignes += 1;
    cur.total_ht += line;
    by.set(fid, cur);
  }
  return {
    items: lignes,
    total_ht: total,
    by_fournisseur: [...by.values()],
  };
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") return send(res, 204, {});

  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, brandId: "tempoflow3" });
  }

  if (url.pathname === "/api/v1/brand/schema") {
    return send(res, 200, {
      brandId: "tempoflow3",
      entities: ENTITY_IDS,
      pages: [
        { id: "dashboard", path: "/dashboard", title: "Dashboard" },
        { id: "fournisseurs", path: "/fournisseurs", title: "Fournisseurs" },
        { id: "produits", path: "/produits", title: "Produits" },
        { id: "prix", path: "/prix", title: "Prix" },
        { id: "panier", path: "/panier", title: "Panier" },
        { id: "commandes", path: "/commandes", title: "Commandes" },
      ],
      flows: [
        {
          id: "commande_fournisseur",
          label: "Commander chez un fournisseur",
          steps: ["fournisseurs", "produits", "prix", "panier", "commandes"],
        },
      ],
    });
  }

  if (url.pathname === "/api/v1/brand/dashboard" && req.method === "GET") {
    const store = readStore();
    return send(res, 200, {
      fournisseurs: (store.fournisseurs || []).filter((r) => !isArchived(r)).length,
      produits: (store.produits || []).filter((r) => !isArchived(r)).length,
      prix: (store.prix || []).length,
      panier_lignes: (store.panier_lignes || []).length,
      commandes: (store.commandes || []).length,
      promos: (store.prix || []).filter((p) => p.promo).length,
    });
  }

  // Mini-PRD 05 — commande depuis panier
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
      lignes: related.map((l) => ({ ...l })),
    };
    store.commandes = store.commandes || [];
    store.commandes.push(commande);
    store.panier_lignes = lignes.filter((l) => l.fournisseur_id !== fournisseurId);
    writeStore(store);
    return send(res, 201, commande);
  }

  const listMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/?$/);
  const itemMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/([^/]+)\/?$/);
  const archiveMatch = url.pathname.match(
    /^\/api\/v1\/brand\/([^/]+)\/([^/]+)\/archive\/?$/,
  );

  // Mini-PRD 01/02 — archiver sans supprimer
  if (archiveMatch && req.method === "POST") {
    const entity = archiveMatch[1];
    const id = archiveMatch[2];
    if (!ARCHIVABLE.has(entity)) return send(res, 400, { error: "not_archivable" });
    const store = readStore();
    const items = store[entity] || [];
    const idx = items.findIndex((r) => r.id === id);
    if (idx < 0) return send(res, 404, { error: "not_found" });
    items[idx] = { ...items[idx], archived_at: now(), updated_at: now() };
    store[entity] = items;
    writeStore(store);
    return send(res, 200, items[idx]);
  }

  if (listMatch) {
    const entity = listMatch[1];
    if (!ENTITY_IDS.includes(entity)) return send(res, 404, { error: "unknown_entity" });
    const store = readStore();
    if (req.method === "GET") {
      const items = filterList(entity, store[entity] || [], url);
      if (entity === "panier_lignes") {
        return send(res, 200, panierSummary(items));
      }
      return send(res, 200, { items });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (entity === "fournisseurs" && !String(body.nom || "").trim()) {
        return send(res, 400, { error: "nom_required" });
      }
      if (entity === "produits" && !String(body.nom || "").trim()) {
        return send(res, 400, { error: "nom_required" });
      }
      if (entity === "prix") {
        if (!body.produit_id || !body.fournisseur_id || body.montant == null) {
          return send(res, 400, { error: "prix_fields_required" });
        }
      }
      const row = {
        ...body,
        id: body.id || randomUUID(),
        created_at: now(),
        updated_at: now(),
      };
      if (ARCHIVABLE.has(entity) && row.archived_at === undefined) {
        row.archived_at = null;
      }
      if (entity === "prix") {
        row.montant = Number(row.montant);
        row.promo = Boolean(row.promo);
        row.devise = row.devise || "EUR";
      }
      if (entity === "panier_lignes") {
        row.quantite = Number(row.quantite);
        if (row.prix_unitaire == null) {
          const prices = (store.prix || [])
            .filter(
              (p) =>
                p.produit_id === row.produit_id &&
                p.fournisseur_id === row.fournisseur_id,
            )
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
          if (prices[0]) row.prix_unitaire = Number(prices[0].montant);
        } else {
          row.prix_unitaire = Number(row.prix_unitaire);
        }
      }
      store[entity] = store[entity] || [];
      // Prix : toujours une nouvelle entrée (historique mini-PRD 03)
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
      if (entity === "commandes" && body.statut != null) {
        if (!COMMANDE_STATUTS.has(String(body.statut))) {
          return send(res, 400, { error: "statut_invalide" });
        }
      }
      items[idx] = { ...items[idx], ...body, id, updated_at: now() };
      store[entity] = items;
      writeStore(store);
      return send(res, 200, items[idx]);
    }
    if (req.method === "DELETE") {
      if (idx < 0) return send(res, 404, { error: "not_found" });
      // Fournisseurs / produits : préférer archive (mini-PRD) — DELETE hard OK pour panier
      if (ARCHIVABLE.has(entity)) {
        return send(res, 400, { error: "use_archive" });
      }
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
