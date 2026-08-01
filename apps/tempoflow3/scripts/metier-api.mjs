#!/usr/bin/env node
/**
 * API métier TempoFlow3 — store JSON local (sans deps natives).
 * Couvre le cœur CHR + optimiser / stack / relevés / scan / référentiels.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.METIER_DATA_DIR || path.join(ROOT, ".data-metier");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);

const ENTITY_IDS = [
  "fournisseurs",
  "produits",
  "prix",
  "panier_lignes",
  "commandes",
  "stack_items",
  "releves",
  "scan_sessions",
  "marketplaces",
  "secteurs",
  "agregateurs",
  "data_mappings",
];

const PAGES = [
  { id: "dashboard", path: "/dashboard", title: "Dashboard" },
  { id: "fournisseurs", path: "/fournisseurs", title: "Fournisseurs" },
  { id: "produits", path: "/produits", title: "Produits" },
  { id: "prix", path: "/prix", title: "Prix" },
  { id: "panier", path: "/panier", title: "Panier" },
  { id: "commandes", path: "/commandes", title: "Commandes" },
  { id: "optimiser", path: "/optimiser", title: "Optimiser" },
  { id: "stack", path: "/stack", title: "Mes produits" },
  { id: "releves", path: "/releves", title: "Relevés" },
  { id: "scan", path: "/scan", title: "Scan" },
  { id: "marketplaces", path: "/marketplaces", title: "Marketplaces" },
  { id: "secteurs", path: "/secteurs", title: "Secteurs" },
  { id: "agregateurs", path: "/agregateurs", title: "Agrégateurs" },
  { id: "data-mapping", path: "/data-mapping", title: "Data-mapping" },
];

function now() {
  return new Date().toISOString();
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const storePath = path.join(DATA_DIR, "store.json");
  if (!fs.existsSync(storePath)) {
    const empty = Object.fromEntries(ENTITY_IDS.map((id) => [id, []]));
    fs.writeFileSync(storePath, JSON.stringify(empty, null, 2));
  } else {
    const data = JSON.parse(fs.readFileSync(storePath, "utf8"));
    let dirty = false;
    for (const id of ENTITY_IDS) {
      if (!Array.isArray(data[id])) {
        data[id] = [];
        dirty = true;
      }
    }
    if (dirty) fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
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

function latestPrix(store, produitId, fournisseurId) {
  const rows = (store.prix || [])
    .filter(
      (p) =>
        p.produit_id === produitId &&
        (!fournisseurId || p.fournisseur_id === fournisseurId),
    )
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return rows[0] || null;
}

function resolveProduitByLabel(store, libelle, fournisseurId) {
  const map = (store.data_mappings || []).find(
    (m) =>
      m.libelle_fournisseur?.toLowerCase() === String(libelle).toLowerCase() &&
      (!fournisseurId || !m.fournisseur_id || m.fournisseur_id === fournisseurId),
  );
  if (map) return (store.produits || []).find((p) => p.id === map.produit_id);
  return (store.produits || []).find(
    (p) => p.nom?.toLowerCase() === String(libelle).toLowerCase(),
  );
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
      pages: PAGES,
      flows: [{ id: "commande_fournisseur", steps: ["fournisseurs", "produits", "prix", "panier", "commandes"] }],
    });
  }

  // ---- Dashboard ----
  if (req.method === "GET" && url.pathname === "/api/v1/brand/dashboard") {
    const store = readStore();
    const fournisseursActifs = (store.fournisseurs || []).filter((f) => !f.archived_at);
    const promos = (store.prix || []).filter((p) => p.promo);
    const commandes = [...(store.commandes || [])].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
    return send(res, 200, {
      fournisseurs_actifs: fournisseursActifs.length,
      lignes_panier: (store.panier_lignes || []).length,
      commandes_recentes: commandes.slice(0, 5),
      promos_recentes: promos.slice(0, 5),
      raccourcis: [
        { title: "Continuer mon panier", path: "/panier" },
        { title: "Voir les promos", path: "/prix" },
        { title: "Fournisseurs", path: "/fournisseurs" },
        { title: "Commandes", path: "/commandes" },
      ],
    });
  }

  // ---- Panier totaux ----
  if (req.method === "GET" && url.pathname === "/api/v1/brand/panier/totaux") {
    const store = readStore();
    const lignes = store.panier_lignes || [];
    const byF = {};
    let total = 0;
    for (const l of lignes) {
      const line = Number(l.quantite || 0) * Number(l.prix_unitaire || 0);
      total += line;
      byF[l.fournisseur_id] = (byF[l.fournisseur_id] || 0) + line;
    }
    return send(res, 200, { total_ht: total, par_fournisseur: byF, lignes: lignes.length });
  }

  // ---- Commande depuis panier ----
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
      statut: body.statut || "brouillon",
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

  // ---- Statut commande ----
  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/brand\/commandes\/[^/]+\/statut$/)) {
    const id = url.pathname.split("/")[5];
    const body = await readBody(req);
    const store = readStore();
    const cmd = (store.commandes || []).find((c) => c.id === id);
    if (!cmd) return send(res, 404, { error: "not_found" });
    const allowed = ["brouillon", "envoyee", "recue", "annulee"];
    if (!allowed.includes(body.statut)) return send(res, 400, { error: "statut_invalide", allowed });
    cmd.statut = body.statut;
    cmd.updated_at = now();
    writeStore(store);
    return send(res, 200, cmd);
  }

  // ---- Optimiser ----
  if (req.method === "POST" && url.pathname === "/api/v1/brand/optimiser/suggest") {
    const body = await readBody(req);
    const store = readStore();
    const besoins = body.besoins || [];
    // besoins: [{ produit_id, quantite }] — sinon dérive du panier
    const lines =
      besoins.length > 0
        ? besoins
        : (store.panier_lignes || []).map((l) => ({
            produit_id: l.produit_id,
            quantite: l.quantite,
          }));
    if (!lines.length) return send(res, 400, { error: "aucun_besoin" });

    const suggestions = [];
    let totalOptimise = 0;
    let totalReference = 0;
    for (const need of lines) {
      const prixList = (store.prix || [])
        .filter((p) => p.produit_id === need.produit_id)
        .sort((a, b) => Number(a.montant) - Number(b.montant));
      if (!prixList.length) {
        suggestions.push({
          produit_id: need.produit_id,
          quantite: need.quantite,
          error: "pas_de_prix",
        });
        continue;
      }
      const best = prixList[0];
      const worst = prixList[prixList.length - 1];
      const q = Number(need.quantite || 1);
      const lineBest = q * Number(best.montant);
      const lineWorst = q * Number(worst.montant);
      totalOptimise += lineBest;
      totalReference += lineWorst;
      suggestions.push({
        produit_id: need.produit_id,
        quantite: q,
        fournisseur_id: best.fournisseur_id,
        prix_unitaire: best.montant,
        line_ht: lineBest,
        ecart_vs_max: lineWorst - lineBest,
        score: Math.round((1 - Number(best.montant) / Math.max(Number(worst.montant), 0.01)) * 100),
      });
    }
    return send(res, 200, {
      suggestions,
      total_optimise_ht: totalOptimise,
      total_reference_ht: totalReference,
      economie_ht: totalReference - totalOptimise,
    });
  }

  if (req.method === "POST" && url.pathname === "/api/v1/brand/optimiser/apply") {
    const body = await readBody(req);
    const store = readStore();
    const suggestions = body.suggestions || [];
    if (!suggestions.length) return send(res, 400, { error: "aucune_suggestion" });
    store.panier_lignes = store.panier_lignes || [];
    for (const s of suggestions) {
      if (!s.fournisseur_id || s.error) continue;
      store.panier_lignes.push({
        id: randomUUID(),
        created_at: now(),
        updated_at: now(),
        produit_id: s.produit_id,
        fournisseur_id: s.fournisseur_id,
        quantite: s.quantite,
        prix_unitaire: s.prix_unitaire,
      });
    }
    writeStore(store);
    return send(res, 200, { ok: true, lignes_panier: store.panier_lignes.length });
  }

  // ---- Stack ----
  if (req.method === "POST" && url.pathname === "/api/v1/brand/stack/toggle") {
    const body = await readBody(req);
    if (!body.produit_id) return send(res, 400, { error: "produit_id_requis" });
    const store = readStore();
    store.stack_items = store.stack_items || [];
    const idx = store.stack_items.findIndex((s) => s.produit_id === body.produit_id);
    if (idx >= 0) {
      const [removed] = store.stack_items.splice(idx, 1);
      writeStore(store);
      return send(res, 200, { action: "removed", item: removed });
    }
    const item = {
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
      produit_id: body.produit_id,
    };
    store.stack_items.push(item);
    writeStore(store);
    return send(res, 201, { action: "added", item });
  }

  if (req.method === "GET" && url.pathname === "/api/v1/brand/stack/enriched") {
    const store = readStore();
    const items = (store.stack_items || []).map((s) => {
      const produit = (store.produits || []).find((p) => p.id === s.produit_id);
      const prix = latestPrix(store, s.produit_id, produit?.fournisseur_id);
      return { ...s, produit, prix_actuel: prix };
    });
    return send(res, 200, { items });
  }

  // ---- Relevés apply ----
  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/brand\/releves\/[^/]+\/apply$/)) {
    const id = url.pathname.split("/")[5];
    const store = readStore();
    const releve = (store.releves || []).find((r) => r.id === id);
    if (!releve) return send(res, 404, { error: "not_found" });
    const lignes = releve.lignes || [];
    const created = [];
    for (const line of lignes) {
      let produitId = line.produit_id;
      if (!produitId && line.libelle) {
        const resolved = resolveProduitByLabel(store, line.libelle, releve.fournisseur_id);
        produitId = resolved?.id;
      }
      if (!produitId || line.montant == null) continue;
      const row = {
        id: randomUUID(),
        created_at: now(),
        updated_at: now(),
        produit_id: produitId,
        fournisseur_id: releve.fournisseur_id,
        montant: Number(line.montant),
        devise: line.devise || "EUR",
        promo: Boolean(line.promo),
        promo_label: line.promo_label || null,
        source_releve_id: releve.id,
      };
      store.prix = store.prix || [];
      store.prix.push(row);
      created.push(row);
    }
    writeStore(store);
    return send(res, 200, { applied: created.length, prix: created });
  }

  // ---- Scan ----
  if (req.method === "POST" && url.pathname === "/api/v1/brand/scan/start") {
    const body = await readBody(req);
    const store = readStore();
    const session = {
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
      statut: "propose",
      note: body.note || "",
      // propositions métier (mapping) — capture/IA = OS creezio côté produit
      propositions: body.propositions || [],
    };
    store.scan_sessions = store.scan_sessions || [];
    store.scan_sessions.push(session);
    writeStore(store);
    return send(res, 201, session);
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/brand\/scan\/[^/]+\/validate$/)) {
    const id = url.pathname.split("/")[5];
    const body = await readBody(req);
    const store = readStore();
    const session = (store.scan_sessions || []).find((s) => s.id === id);
    if (!session) return send(res, 404, { error: "not_found" });
    const accepted = body.propositions || session.propositions || [];
    const results = { produits: [], prix: [] };
    for (const prop of accepted) {
      if (prop.skip) continue;
      let produitId = prop.produit_id;
      if (!produitId && prop.nom) {
        const existing = resolveProduitByLabel(store, prop.nom, prop.fournisseur_id);
        if (existing) produitId = existing.id;
        else {
          const p = {
            id: randomUUID(),
            created_at: now(),
            updated_at: now(),
            nom: prop.nom,
            unite: prop.unite || "kg",
            categorie: prop.categorie || "",
            fournisseur_id: prop.fournisseur_id || null,
          };
          store.produits = store.produits || [];
          store.produits.push(p);
          results.produits.push(p);
          produitId = p.id;
        }
      }
      if (produitId && prop.montant != null && prop.fournisseur_id) {
        const prix = {
          id: randomUUID(),
          created_at: now(),
          updated_at: now(),
          produit_id: produitId,
          fournisseur_id: prop.fournisseur_id,
          montant: Number(prop.montant),
          devise: prop.devise || "EUR",
          promo: Boolean(prop.promo),
          source_scan_id: session.id,
        };
        store.prix = store.prix || [];
        store.prix.push(prix);
        results.prix.push(prix);
      }
    }
    session.statut = "valide";
    session.updated_at = now();
    writeStore(store);
    return send(res, 200, { session, results });
  }

  // ---- Data-mapping resolve ----
  if (req.method === "POST" && url.pathname === "/api/v1/brand/data-mapping/resolve") {
    const body = await readBody(req);
    const store = readStore();
    const produit = resolveProduitByLabel(store, body.libelle, body.fournisseur_id);
    if (!produit) return send(res, 404, { error: "unmapped" });
    return send(res, 200, { produit });
  }

  // ---- Prix history helper ----
  if (req.method === "GET" && url.pathname === "/api/v1/brand/prix/historique") {
    const produitId = url.searchParams.get("produit_id");
    const fournisseurId = url.searchParams.get("fournisseur_id");
    const store = readStore();
    let rows = store.prix || [];
    if (produitId) rows = rows.filter((p) => p.produit_id === produitId);
    if (fournisseurId) rows = rows.filter((p) => p.fournisseur_id === fournisseurId);
    rows = [...rows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    return send(res, 200, { items: rows });
  }

  // ---- CRUD générique ----
  const listMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/?$/);
  const itemMatch = url.pathname.match(/^\/api\/v1\/brand\/([^/]+)\/([^/]+)\/?$/);

  if (listMatch) {
    const entity = listMatch[1];
    if (!ENTITY_IDS.includes(entity)) return send(res, 404, { error: "unknown_entity" });
    const store = readStore();
    if (req.method === "GET") {
      let items = store[entity] || [];
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const archived = url.searchParams.get("archived");
      if (entity === "fournisseurs" || entity === "produits") {
        if (archived === "1") items = items.filter((i) => i.archived_at);
        else if (archived !== "all") items = items.filter((i) => !i.archived_at);
      }
      if (q) {
        items = items.filter((i) =>
          JSON.stringify(i).toLowerCase().includes(q),
        );
      }
      const fournisseurId = url.searchParams.get("fournisseur_id");
      if (fournisseurId) items = items.filter((i) => i.fournisseur_id === fournisseurId);
      const produitId = url.searchParams.get("produit_id");
      if (produitId) items = items.filter((i) => i.produit_id === produitId);
      const promo = url.searchParams.get("promo");
      if (promo === "1") items = items.filter((i) => i.promo);
      return send(res, 200, { items });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const row = {
        id: body.id || randomUUID(),
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      row.id = body.id || row.id;
      // stack unique produit
      if (entity === "stack_items") {
        const exists = (store.stack_items || []).find((s) => s.produit_id === row.produit_id);
        if (exists) return send(res, 409, { error: "already_in_stack", item: exists });
      }
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
      const row = items[idx];
      // enrichissement fiche fournisseur / produit
      if (entity === "fournisseurs") {
        const produits = (store.produits || []).filter((p) => p.fournisseur_id === id && !p.archived_at);
        const prix = (store.prix || []).filter((p) => p.fournisseur_id === id);
        return send(res, 200, { ...row, produits, prix_count: prix.length });
      }
      if (entity === "produits") {
        const prix = (store.prix || [])
          .filter((p) => p.produit_id === id)
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        return send(res, 200, { ...row, prix, prix_actuel: prix[0] || null });
      }
      return send(res, 200, row);
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
      // soft archive for fournisseurs/produits
      if (entity === "fournisseurs" || entity === "produits") {
        items[idx].archived_at = now();
        items[idx].updated_at = now();
        store[entity] = items;
        writeStore(store);
        return send(res, 200, items[idx]);
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
