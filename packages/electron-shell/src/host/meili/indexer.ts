// @ts-nocheck — better-sqlite3 runtime (cwd marque)
/**
 * Indexeur Meilisearch catalogue (TF gold N2) — portage TypeScript de
 * scripts/index_meilisearch.py (v2 « agrégateurs », ~464k produits).
 *
 * Exécuté comme script Node autonome (PAS dans Electron) :
 *   DB_PATH=… MEILI_HOST=… node build/electron/meili-indexer.js
 *
 * Principes (identiques au Python) :
 *   - Streaming depuis SQLite : curseur par lots (id croissant), jamais de
 *     chargement complet en RAM. Provenance résolue par lot via
 *     `produit_sources` (pas de sous-requête corrélée).
 *   - Swap atomique : chaque index est reconstruit dans `<uid>_new` puis
 *     échangé via `/swap-indexes` — la recherche reste servie par l'ancien
 *     index pendant toute la réindexation.
 *   - Description tronquée (~500 caractères), champs affichés limités.
 *
 * Index produits :
 *   - tf2_produits      : tous les produits (legacy + importés)
 *   - tf2_marketplaces  : tous les fournisseurs (direct + agrégateur)
 *   - tf2_all           : index unifié keyword = marketplaces uniquement
 *
 * Env : DB_PATH (requis), MEILI_HOST (requis), MEILI_MASTER_KEY (optionnel).
 */

import path from "node:path";
import fs from "node:fs";
import { createAppRequire } from "@creezio/platform-core";
import {
  INDEX_SCHEMA_VERSION,
  MEILI_FINGERPRINT_META_KEY,
  MEILI_INDEX_IN_PROGRESS_KEY,
  serializeFingerprint,
  type MeiliFingerprint,
} from "./index-schema.js";
import { emitOpsEvent } from "@creezio/observability";

type SqliteDb = {
  prepare(sql: string): {
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
    run(...args: unknown[]): unknown;
  };
  close(): void;
  readonly?: boolean;
};

function openSqlite(
  dbPath: string,
  opts?: { readonly?: boolean; fileMustExist?: boolean },
): SqliteDb {
  const req = createAppRequire();
  const Database = req("better-sqlite3") as new (
    f: string,
    o?: { readonly?: boolean; fileMustExist?: boolean },
  ) => SqliteDb;
  return new Database(dbPath, opts);
}


const BATCH_SQL = 5000; // lignes lues par lot SQLite
const BATCH_MEILI = 5000; // documents envoyés par lot à Meili
const DESC_MAX = 500; // troncature description (caractères)
const MAX_TOTAL_HITS = 200000; // pagination exhaustive Meili

type Json = Record<string, unknown>;
type MeiliDoc = Json & { id: string | number };
type LogFn = (line: string) => void;

interface MeiliClient {
  request(method: string, path: string, body?: unknown, timeoutMs?: number): Promise<unknown>;
}

function createMeiliClient(host: string, masterKey: string): MeiliClient {
  const base = host.replace(/\/+$/, "");
  return {
    async request(method, path, body, timeoutMs = 120_000) {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${masterKey}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`Meili HTTP ${res.status} ${path}: ${raw.slice(0, 300)}`);
      }
      return raw ? JSON.parse(raw) : null;
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDict(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

async function meiliAvailable(meili: MeiliClient, log: LogFn): Promise<boolean> {
  try {
    const res = await meili.request("GET", "/health", undefined, 5000);
    return isDict(res) && res.status === "available";
  } catch (e) {
    log(`[meili] indisponible (${e instanceof Error ? e.message : e}) — indexation annulée`);
    return false;
  }
}

/** Attend la fin d'une tâche asynchrone Meili (bloquant). */
async function waitTask(meili: MeiliClient, task: unknown, timeoutS = 1800): Promise<void> {
  if (!isDict(task)) return;
  const taskUid = task.taskUid ?? task.uid;
  if (taskUid === undefined || taskUid === null) return;
  const deadline = Date.now() + timeoutS * 1000;
  let delay = 200;
  while (Date.now() < deadline) {
    const status = await meili.request("GET", `/tasks/${taskUid}`);
    if (!isDict(status)) return;
    const state = status.status;
    if (state === "succeeded" || state === "failed" || state === "canceled") {
      if (state !== "succeeded") {
        throw new Error(`tâche Meili ${taskUid} ${state}: ${JSON.stringify(status.error)}`);
      }
      return;
    }
    await sleep(delay);
    delay = Math.min(delay * 1.5, 3000);
  }
  throw new Error(`tâche Meili ${taskUid} : timeout après ${timeoutS}s`);
}

async function indexExists(meili: MeiliClient, uid: string): Promise<boolean> {
  try {
    await meili.request("GET", `/indexes/${uid}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crée un index avec primaryKey forcée (`id`).
 *
 * Indispensable dès qu'un document porte plusieurs champs `*_id`
 * (ex. `famille_id`, `categorie_id`) : sans ça Meili tente une inférence
 * et échoue avec `index_primary_key_multiple_candidates_found`.
 */
async function createIndex(meili: MeiliClient, uid: string): Promise<void> {
  await waitTask(meili, await meili.request("POST", "/indexes", { uid, primaryKey: "id" }));
  const meta = await meili.request("GET", `/indexes/${uid}`);
  if (!isDict(meta) || meta.primaryKey !== "id") {
    throw new Error(`index ${uid}: primaryKey attendue 'id', obtenu ${JSON.stringify(meta)}`);
  }
}

/** Attend qu'aucune tâche enqueued/processing ne concerne cet index. */
async function waitIndexIdle(meili: MeiliClient, uid: string, timeoutS = 120): Promise<void> {
  const deadline = Date.now() + timeoutS * 1000;
  while (Date.now() < deadline) {
    const tasks = await meili.request(
      "GET",
      `/tasks?indexUids=${uid}&statuses=enqueued,processing&limit=1`,
    );
    if (isDict(tasks) && Array.isArray(tasks.results) && tasks.results.length === 0) return;
    await sleep(300);
  }
  throw new Error(`index ${uid}: tâches encore en file après ${timeoutS}s`);
}

/** (Re)crée un index vide avec ses settings (utilisé pour les *_new). */
async function recreateIndex(meili: MeiliClient, uid: string, settings: Json): Promise<void> {
  // Évite une course si un DELETE précédent est encore en file (sinon Meili
  // peut détruire l'index tout juste recréé ; les POST documents le
  // recréent alors sans settings → primaryKey/inférence/maxTotalHits KO).
  await waitIndexIdle(meili, uid);
  if (await indexExists(meili, uid)) {
    await waitTask(meili, await meili.request("DELETE", `/indexes/${uid}`));
    await waitIndexIdle(meili, uid);
  }
  await createIndex(meili, uid);
  await waitTask(meili, await meili.request("PATCH", `/indexes/${uid}/settings`, settings));
  const metaSettings = await meili.request("GET", `/indexes/${uid}/settings`);
  if (!isDict(metaSettings)) {
    throw new Error(`index ${uid}: settings illisibles après PATCH`);
  }
  const expectedFilters = new Set((settings.filterableAttributes as string[] | undefined) ?? []);
  const gotFilters = new Set((metaSettings.filterableAttributes as string[] | undefined) ?? []);
  const missing = [...expectedFilters].filter((f) => !gotFilters.has(f)).sort();
  if (expectedFilters.size > 0 && missing.length > 0) {
    throw new Error(`index ${uid}: settings non appliqués (filterable manquants: ${missing.join(", ")})`);
  }
}

/** Swap <uid>_new → <uid> (atomique) puis supprime l'ancien contenu. */
async function swapAndCleanup(meili: MeiliClient, uid: string): Promise<void> {
  const newUid = `${uid}_new`;
  if (!(await indexExists(meili, uid))) {
    // Premier run : pas de swap possible, créer l'index cible vide d'abord
    await createIndex(meili, uid);
  }
  await waitTask(meili, await meili.request("POST", "/swap-indexes", [{ indexes: [uid, newUid] }]));
  // newUid contient désormais l'ancien index — on le supprime
  await waitTask(meili, await meili.request("DELETE", `/indexes/${newUid}`));
}

/* Progression machine-readable (consommée par electron/main.ts pour l'UI
 * de premier lancement) : une ligne `TF2PROGRESS {"done":n,"total":t}` sur
 * stdout à chaque lot envoyé. */
let progressDone = 0;
let progressTotal = 0;

function setProgressTotal(total: number): void {
  progressTotal = total;
  progressDone = 0;
}

function bumpProgress(n: number): void {
  progressDone += n;
  if (progressTotal > 0) {
    console.log(`TF2PROGRESS ${JSON.stringify({ done: progressDone, total: progressTotal })}`);
  }
}

/** Accumule des documents et les envoie par lots dans <uid>_new. */
class StreamIndexer {
  private buffer: MeiliDoc[] = [];
  private count = 0;
  private tasks: Json[] = [];
  private readonly newUid: string;

  constructor(
    private readonly meili: MeiliClient,
    private readonly uid: string,
    private readonly log: LogFn,
  ) {
    this.newUid = `${uid}_new`;
  }

  async init(settings: Json): Promise<void> {
    await recreateIndex(this.meili, this.newUid, settings);
  }

  async add(doc: MeiliDoc): Promise<void> {
    if (doc.id === undefined || doc.id === null || doc.id === "") {
      throw new Error(`document sans id stable pour ${this.uid}: ${JSON.stringify(doc)}`);
    }
    // Ceinture + bretelles : aucun champ texte ne doit contenir de lone
    // surrogate (données brutes OU coupe d'emoji) sinon Meili rejette le lot.
    for (const [k, v] of Object.entries(doc)) {
      if (typeof v === "string") doc[k] = wellFormed(v);
    }
    this.buffer.push(doc);
    if (this.buffer.length >= BATCH_MEILI) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    // Ceinture + bretelles : primaryKey aussi en query param (recommandation
    // Meili quand plusieurs champs se terminent par `_id`).
    const task = await this.meili.request(
      "POST",
      `/indexes/${this.newUid}/documents?primaryKey=id`,
      this.buffer,
    );
    if (isDict(task)) this.tasks.push(task);
    this.count += this.buffer.length;
    bumpProgress(this.buffer.length);
    this.log(`[meili] ${this.uid}: ${this.count} docs envoyés…`);
    this.buffer = [];
  }

  async finalize(): Promise<number> {
    await this.flush();
    if (this.tasks.length > 0) {
      // La file de tâches Meili est séquentielle : attendre la dernière
      // garantit que toutes sont traitées ; on vérifie ensuite qu'aucune
      // n'a échoué silencieusement.
      await waitTask(this.meili, this.tasks[this.tasks.length - 1]);
      for (const task of this.tasks.slice(0, -1)) {
        const uid = task.taskUid ?? task.uid;
        const status = await this.meili.request("GET", `/tasks/${uid}`);
        if (isDict(status) && status.status !== "succeeded") {
          throw new Error(`tâche Meili ${uid} ${status.status}: ${JSON.stringify(status.error)}`);
        }
      }
    }
    await swapAndCleanup(this.meili, this.uid);
    this.log(`[meili] ${this.uid}: ${this.count} docs (swap OK)`);
    return this.count;
  }
}

/**
 * Neutralise les demi-paires de substitution UTF-16 (lone surrogates).
 * `String.slice()` peut couper un emoji en deux : JSON.stringify produit
 * alors un \ud8xx isolé que le parseur JSON de Meili rejette
 * ("unexpected end of hex escape") et TOUTE l'indexation échoue.
 */
function wellFormed(s: string): string {
  const w = s as string & { toWellFormed?: () => string };
  if (typeof w.toWellFormed === "function") return w.toWellFormed();
  return s.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    "\uFFFD",
  );
}

function truncate(text: string | null | undefined, limit = DESC_MAX): string {
  if (!text) return "";
  return wellFormed(text.split(/\s+/).filter(Boolean).join(" ").slice(0, limit));
}

const PRODUITS_SETTINGS: Json = {
  searchableAttributes: [
    "title",
    "ref",
    "fournisseur",
    "marketplace",
    "categorie",
    "famille",
    "mots_cles",
    "body",
  ],
  filterableAttributes: [
    "type",
    "actif",
    "statut",
    "fournisseur",
    "fournisseur_id",
    "marketplace",
    "agregateur",
    "pays",
    "categorie",
    "categorie_id",
    "famille",
    "famille_id",
    "langue",
  ],
  sortableAttributes: ["prix_min"],
  displayedAttributes: [
    "id",
    "type",
    "title",
    "subtitle",
    "ref",
    "fournisseur",
    "fournisseur_id",
    "marketplace",
    "agregateur",
    "agregateur_nom",
    "pays",
    "categorie",
    "categorie_id",
    "famille",
    "famille_id",
    "prix_min",
    "prix_max",
    "devise",
    "image_url",
    "statut",
    "actif",
  ],
  pagination: { maxTotalHits: MAX_TOTAL_HITS },
};

const MARKETPLACES_SETTINGS: Json = {
  searchableAttributes: ["title", "subtitle", "slug", "ville", "pays", "vat_id", "body"],
  filterableAttributes: ["type", "actif", "statut", "origine", "pays", "agregateurs"],
  displayedAttributes: [
    "id", "type", "title", "subtitle", "slug", "origine", "pays", "ville",
    "vat_id", "site_web", "logo_url", "statut", "actif",
  ],
  pagination: { maxTotalHits: MAX_TOTAL_HITS },
};

const ALL_SETTINGS: Json = {
  searchableAttributes: [
    "title", "subtitle", "body", "slug", "ref", "fournisseur", "marketplace",
  ],
  filterableAttributes: ["type", "actif", "fournisseur", "marketplace", "statut"],
  pagination: { maxTotalHits: MAX_TOTAL_HITS },
};

interface ProduitRow {
  id: number;
  nom: string | null;
  ref_fournisseur: string | null;
  description: string | null;
  conditionnement: string | null;
  image_url: string | null;
  langue: string | null;
  devise: string | null;
  actif: number | null;
  statut: string;
  direct_fid: number | null;
  direct_fnom: string | null;
  direct_pays: string | null;
}

interface ProvenanceRow {
  produit_id: number;
  agregateur_code: string | null;
  agregateur_nom: string | null;
  fournisseur_id: number | null;
  fournisseur_nom: string | null;
  fournisseur_pays: string | null;
  prix_min: number | null;
  prix_max: number | null;
  prix_devise: string | null;
  categorie_nom: string | null;
  famille_nom: string | null;
  mots_cles: string | null;
}

interface TaxRow {
  produit_id: number;
  role: string | null;
  cid: number;
  nom: string | null;
}

interface Taxonomie {
  famille_id?: number;
  famille?: string | null;
  categorie_id?: number;
  categorie?: string | null;
}

async function indexProduits(db: SqliteDb, meili: MeiliClient, log: LogFn): Promise<number> {
  const idx = new StreamIndexer(meili, "tf2_produits", log);
  await idx.init(PRODUITS_SETTINGS);

  const selectBatch = db.prepare(
    `SELECT p.id, p.nom, p.ref_fournisseur, p.description, p.conditionnement,
            p.image_url, p.langue, p.devise, p.actif,
            COALESCE(p.statut, 'normal') AS statut,
            p.fournisseur_id AS direct_fid,
            fd.nom AS direct_fnom, fd.pays AS direct_pays
     FROM produits p
     LEFT JOIN fournisseurs fd ON fd.id = p.fournisseur_id
     WHERE p.id > ?
     ORDER BY p.id
     LIMIT ?`,
  );

  let lastId = 0;
  for (;;) {
    const rows = selectBatch.all(lastId, BATCH_SQL) as ProduitRow[];
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1].id;

    // Provenance du lot en une requête (1re source par produit)
    const ids = rows.map((r) => r.id);
    const ph = ids.map(() => "?").join(",");
    const prov = new Map<number, ProvenanceRow>();
    const provRows = db
      .prepare(
        `SELECT ps.produit_id, a.code AS agregateur_code, a.nom AS agregateur_nom,
                af.fournisseur_id, f.nom AS fournisseur_nom, f.pays AS fournisseur_pays,
                ps.prix_min, ps.prix_max, ps.devise AS prix_devise,
                ps.categorie_nom, ps.famille_nom, ps.mots_cles
         FROM produit_sources ps
         JOIN agregateurs a              ON a.id = ps.agregateur_id
         JOIN agregateur_fournisseurs af ON af.id = ps.agregateur_fournisseur_id
         JOIN fournisseurs f             ON f.id = af.fournisseur_id
         WHERE ps.produit_id IN (${ph})
         ORDER BY ps.produit_id, ps.id`,
      )
      .all(...ids) as ProvenanceRow[];
    for (const pr of provRows) {
      if (!prov.has(pr.produit_id)) prov.set(pr.produit_id, pr);
    }

    // Taxonomie structurée (ids) pour filtres Meili stables
    const tax = new Map<number, Taxonomie>();
    try {
      const taxRows = db
        .prepare(
          `SELECT pc.produit_id, pc.role, c.id AS cid, c.nom
           FROM produit_categories pc
           JOIN categories c ON c.id = pc.categorie_id
           WHERE pc.produit_id IN (${ph})`,
        )
        .all(...ids) as TaxRow[];
      for (const tr of taxRows) {
        let slot = tax.get(tr.produit_id);
        if (!slot) {
          slot = {};
          tax.set(tr.produit_id, slot);
        }
        if (tr.role === "famille") {
          slot.famille_id = tr.cid;
          slot.famille = tr.nom;
        } else if (tr.role === "principale") {
          slot.categorie_id = tr.cid;
          slot.categorie = tr.nom;
        }
      }
    } catch {
      // Table produit_categories absente (schéma ancien) — comme le Python
      // (sqlite3.OperationalError ignorée).
    }

    for (const r of rows) {
      const p = prov.get(r.id);
      const t = tax.get(r.id) ?? {};
      const fournisseur = r.direct_fnom || (p ? p.fournisseur_nom : "") || "";
      const fournisseurId = r.direct_fid ?? (p ? p.fournisseur_id : null);
      const pays = (r.direct_fid ? r.direct_pays : null) ?? (p ? p.fournisseur_pays : null);
      let motsCles = "";
      if (p && p.mots_cles) {
        try {
          const parsed = JSON.parse(p.mots_cles);
          if (Array.isArray(parsed)) {
            motsCles = parsed.slice(0, 20).map((m) => String(m)).join(" ");
          }
        } catch {
          motsCles = "";
        }
      }
      await idx.add({
        id: r.id,
        type: "produit",
        title: r.nom || "",
        subtitle: t.categorie || (p ? p.categorie_nom : null) || r.ref_fournisseur || "",
        ref: r.ref_fournisseur || "",
        fournisseur,
        fournisseur_id: fournisseurId,
        marketplace: fournisseur, // compat recherche globale existante
        agregateur: (p ? p.agregateur_code : null) || "direct",
        agregateur_nom: p ? p.agregateur_nom : null,
        pays: pays ?? null,
        categorie: t.categorie || (p ? p.categorie_nom : null) || null,
        categorie_id: t.categorie_id ?? null,
        famille: t.famille || (p ? p.famille_nom : null) || null,
        famille_id: t.famille_id ?? null,
        prix_min: p ? p.prix_min : null,
        prix_max: p ? p.prix_max : null,
        devise: (p ? p.prix_devise : null) || r.devise,
        image_url: r.image_url,
        langue: r.langue,
        statut: r.statut,
        actif: r.actif,
        mots_cles: motsCles,
        body: truncate([r.description, r.conditionnement].filter(Boolean).join(" ")),
      });
    }
  }
  return idx.finalize();
}

interface FournisseurRow {
  id: number;
  nom: string | null;
  slug: string | null;
  plateforme: string | null;
  etat: string | null;
  url_base: string | null;
  categories: string | null;
  notes: string | null;
  actif: number | null;
  statut: string;
  origine: string;
  pays: string | null;
  ville: string | null;
  vat_id: string | null;
  site_web: string | null;
  logo_url: string | null;
}

/** Génère les documents fournisseurs (streaming par lots). */
function* marketplaceDocs(db: SqliteDb): Generator<MeiliDoc> {
  const selectBatch = db.prepare(
    `SELECT f.id, f.nom, f.slug, f.plateforme, f.etat, f.url_base, f.categories,
            f.notes, f.actif, COALESCE(f.statut, 'normal') AS statut,
            COALESCE(f.origine, 'direct') AS origine,
            f.pays, f.ville, f.vat_id, f.site_web, f.logo_url
     FROM fournisseurs f
     WHERE f.id > ?
     ORDER BY f.id
     LIMIT ?`,
  );

  let lastId = 0;
  for (;;) {
    const rows = selectBatch.all(lastId, BATCH_SQL) as FournisseurRow[];
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1].id;

    const ids = rows.map((r) => r.id);
    const ph = ids.map(() => "?").join(",");
    const agg = new Map<number, string[]>();
    const aggRows = db
      .prepare(
        `SELECT af.fournisseur_id, a.code
         FROM agregateur_fournisseurs af
         JOIN agregateurs a ON a.id = af.agregateur_id
         WHERE af.fournisseur_id IN (${ph})`,
      )
      .all(...ids) as Array<{ fournisseur_id: number; code: string }>;
    for (const row of aggRows) {
      const list = agg.get(row.fournisseur_id);
      if (list) list.push(row.code);
      else agg.set(row.fournisseur_id, [row.code]);
    }

    for (const r of rows) {
      yield {
        id: r.id,
        type: "marketplace",
        title: r.nom || "",
        subtitle: [r.plateforme, r.pays, r.ville].filter(Boolean).join(" · "),
        slug: r.slug || "",
        origine: r.origine,
        pays: r.pays,
        ville: r.ville,
        vat_id: r.vat_id,
        site_web: r.site_web,
        logo_url: r.logo_url,
        agregateurs: agg.get(r.id) ?? [],
        actif: r.actif,
        statut: r.statut,
        body: truncate(
          [r.url_base, r.site_web, r.categories, r.notes, r.etat].filter(Boolean).join(" "),
          300,
        ),
      };
    }
  }
}

/** Supprime un index obsolète (ex. tf2_releves après retrait volontaire). */
async function deleteIndexIfExists(meili: MeiliClient, uid: string, log: LogFn): Promise<void> {
  if (!(await indexExists(meili, uid))) return;
  await waitTask(meili, await meili.request("DELETE", `/indexes/${uid}`));
  log(`[meili] index obsolète supprimé: ${uid}`);
}

/**
 * Lance l'indexation.
 * - Avec `feed` (ou feed configuré via configureMeiliBrandFeed) → chemin générique.
 * - Sans feed → legacy TempoFlow `tf2_*` (compat TF2 / dual-read).
 */
export async function runIndexation(opts?: {
  dbPath?: string;
  meiliHost?: string;
  masterKey?: string;
  log?: (line: string) => void;
  feed?: import("./feed.js").BrandMeiliFeed;
  appVersion?: string;
}): Promise<void> {
  const log: LogFn = opts?.log ?? ((line) => console.log(line));
  const { getMeiliBrandFeed } = await import("./feed.js");
  const feed = opts?.feed ?? getMeiliBrandFeed();
  if (feed) {
    const { runFeedIndexation } = await import("./generic-indexer.js");
    await runFeedIndexation({
      feed,
      dbPath: opts?.dbPath,
      meiliHost: opts?.meiliHost,
      masterKey: opts?.masterKey,
      log,
      appVersion: opts?.appVersion,
    });
    return;
  }

  const dbPath = opts?.dbPath ?? process.env.DB_PATH;
  const meiliHost = opts?.meiliHost ?? process.env.MEILI_HOST;
  const masterKey = opts?.masterKey ?? process.env.MEILI_MASTER_KEY ?? "";

  if (!dbPath) throw new Error("DB_PATH manquant (chemin de la base SQLite)");
  if (!meiliHost) throw new Error("MEILI_HOST manquant (ex. http://127.0.0.1:7700)");
  if (!fs.existsSync(dbPath)) throw new Error(`[meili] DB manquante: ${dbPath}`);

  const meili = createMeiliClient(meiliHost, masterKey);
  if (!(await meiliAvailable(meili, log))) return;

  const started = Date.now();
  // Marqueur « en cours » : si le process est tué avant la fin, le boot
  // suivant saura que l'indexation précédente a été INTERROMPUE (et non que
  // les données Meili ont disparu) — voir decideMeiliReady.
  writeIndexInProgress(dbPath);
  emitOpsEvent({ level: "event", kind: "index.start" });
  const db = openSqlite(dbPath, { readonly: true, fileMustExist: true });
  try {
    // Total attendu (produits + 2× fournisseurs : tf2_marketplaces et tf2_all)
    // pour la progression TF2PROGRESS consommée par l'UI de 1er lancement.
    const nP = (db.prepare(`SELECT COUNT(*) c FROM produits`).get() as { c: number }).c;
    const nF = (db.prepare(`SELECT COUNT(*) c FROM fournisseurs`).get() as { c: number }).c;
    setProgressTotal(nP + 2 * nF);

    // --- tf2_produits (streaming + swap) --------------------------------
    const nProduits = await indexProduits(db, meili, log);

    // --- tf2_marketplaces ------------------------------------------------
    const idxM = new StreamIndexer(meili, "tf2_marketplaces", log);
    await idxM.init(MARKETPLACES_SETTINGS);
    for (const doc of marketplaceDocs(db)) {
      await idxM.add(doc);
    }
    const nMarketplaces = await idxM.finalize();

    // --- tf2_all (unifié keyword = marketplaces ; pas de produits ni relevés)
    const idxAll = new StreamIndexer(meili, "tf2_all", log);
    await idxAll.init(ALL_SETTINGS);
    for (const doc of marketplaceDocs(db)) {
      await idxAll.add({ ...doc, id: `marketplace__${doc.id}` });
    }
    const nAll = await idxAll.finalize();

    // Ancien index relevés : ne plus alimenter, supprimer s'il existe encore
    await deleteIndexIfExists(meili, "tf2_releves", log);
    await deleteIndexIfExists(meili, "tf2_releves_new", log);

    const sqlCounts = { produits: nP, fournisseurs: nF };
    const sqliteSchema = readSqliteSchemaVersion(db);
    const fp: MeiliFingerprint = {
      indexSchema: INDEX_SCHEMA_VERSION,
      sqliteSchema,
      counts: sqlCounts,
      builtAt: new Date().toISOString(),
      appVersion: process.env.TF2_APP_VERSION || undefined,
    };
    writeFingerprint(dbPath, fp);
    // Miroir Meili (debug / health) — best-effort.
    try {
      if (!(await indexExists(meili, "tf2_meta"))) {
        await createIndex(meili, "tf2_meta");
      }
      await waitTask(
        meili,
        await meili.request("POST", "/indexes/tf2_meta/documents?primaryKey=id", [
          { id: "fingerprint", ...fp },
        ]),
      );
    } catch (e) {
      log(
        `[meili] fingerprint Meili non écrit (${e instanceof Error ? e.message : e})`,
      );
    }

    clearIndexInProgress(dbPath);
    emitOpsEvent({
      level: "event",
      kind: "index.done",
      outcome: "ok",
      durationMs: Date.now() - started,
      ctx: { produits: nProduits, marketplaces: nMarketplaces, all: nAll },
    });
    log(
      `[meili] terminé en ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
        `produits=${nProduits} marketplaces=${nMarketplaces} all=${nAll} ` +
        `indexSchema=${INDEX_SCHEMA_VERSION} sqliteSchema=${sqliteSchema}`,
    );
  } finally {
    db.close();
  }
}

function tableExists(db: SqliteDb, name: string): boolean {
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name) as { c: number };
  return row.c > 0;
}

function readSqliteSchemaVersion(db: SqliteDb): number {
  if (!tableExists(db, "meta")) return 0;
  const row = db
    .prepare(`SELECT value FROM meta WHERE key='schema_version'`)
    .get() as { value: string } | undefined;
  return Number(row?.value || 0);
}

function writeFingerprint(dbFile: string, fp: MeiliFingerprint): void {
  // runIndexation ouvre la DB en readonly — écriture via une 2e connexion.
  const w = openSqlite(dbFile, { fileMustExist: true });
  try {
    w.prepare(
      `INSERT INTO meta(key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(MEILI_FINGERPRINT_META_KEY, serializeFingerprint(fp));
  } finally {
    w.close();
  }
}

function writeIndexInProgress(dbFile: string): void {
  try {
    const w = openSqlite(dbFile, { fileMustExist: true });
    try {
      w.prepare(
        `INSERT INTO meta(key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ).run(
        MEILI_INDEX_IN_PROGRESS_KEY,
        JSON.stringify({
          startedAt: new Date().toISOString(),
          appVersion: process.env.TF2_APP_VERSION || undefined,
        }),
      );
    } finally {
      w.close();
    }
  } catch (e) {
    console.error(`[meili] marqueur in-progress non écrit (${e instanceof Error ? e.message : e})`);
  }
}

function clearIndexInProgress(dbFile: string): void {
  try {
    const w = openSqlite(dbFile, { fileMustExist: true });
    try {
      w.prepare(`DELETE FROM meta WHERE key = ?`).run(MEILI_INDEX_IN_PROGRESS_KEY);
    } finally {
      w.close();
    }
  } catch (e) {
    console.error(`[meili] marqueur in-progress non effacé (${e instanceof Error ? e.message : e})`);
  }
}

/** CLI dual-build safe (pas d'`import.meta` — CJS Electron). */
const cliEntry = process.argv[1] || "";
if (/(^|[\\/])meili-indexer\.(c?js|mjs)$/.test(cliEntry)) {
  void runIndexation().catch((e) => {
    console.error(`[meili] échec indexation: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  });
}
