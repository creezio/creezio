/**
 * Browse paginé Meili — `q` vide OK.
 *
 * Contrat (SoT `electron-shell/AGENTS.md` + `creezio/AGENTS.md`) :
 * - Toujours Meili pour lister/filtrer dès que les attributs sont
 *   filterable/sortable — **y compris sans texte**.
 * - Retourne `null` si Meili KO, index vide, ou filtre/sort rejeté
 *   → l'appelant bascule SQL (fallback **visible**).
 * - 0 hit sur un index peuplé = succès Meili (pas un fallback SQL).
 * - Interdit : `if (q) meili else sql`.
 * - Ne pas utiliser `searchMeiliIndexes` pour le browse (retourne [] si q vide).
 *
 * Injection : `configureEntityMeili` / `configureEntityMeiliFromFeed`
 * (pas d'UID marque hardcodé dans le moteur).
 */

export type MeiliBrowseRequest = {
  host: string;
  apiKey?: string;
  indexUid: string;
  /** Texte libre — chaîne vide = browse filtré / page catalogue. */
  query?: string;
  filters?: string[];
  sort?: string[];
  page?: number;
  hitsPerPage?: number;
  attributesToRetrieve?: string[];
  facets?: string[];
  timeoutMs?: number;
};

export type MeiliBrowseResult = {
  hits: Array<Record<string, unknown>>;
  total: number;
  facetDistribution?: Record<string, Record<string, number>>;
};

export type EntityMeiliBinding = {
  /** UID Meili (`catalog_*`) — jamais un préfixe marque. */
  indexUid: string;
  /** Query params exprimables en filtre Meili. */
  filterable: string[];
  /** Query param → attribut Meili (défaut = même nom). */
  filterMap?: Record<string, string>;
  sortable?: string[];
  facets?: string[];
};

export type EntityMeiliConfig = {
  /** table SQL → binding. */
  indexes: Record<string, EntityMeiliBinding>;
  /** Override tests / injection. */
  browse?: (req: MeiliBrowseRequest) => Promise<MeiliBrowseResult | null>;
  host?: string;
  apiKey?: string;
};

let configured: EntityMeiliConfig | null = null;

export function configureEntityMeili(cfg: EntityMeiliConfig): void {
  configured = cfg;
}

export function getEntityMeiliConfig(): EntityMeiliConfig | null {
  return configured;
}

export function resetEntityMeiliForTests(): void {
  configured = null;
}

/** Table SQL d'un index feed (déclaratif `table` ou `countKey` catalogue). */
export function tableForMeiliIndex(idx: {
  table?: string;
  countKey?: string;
}): string | null {
  if (idx.table) return idx.table;
  if (idx.countKey === "produits") return "produits";
  if (idx.countKey === "sites" || idx.countKey === "fournisseurs") {
    return "fournisseurs";
  }
  return null;
}

/**
 * Branche le moteur entity-list sur le feed marque (UIDs + filterable
 * viennent du feed — zéro UID hardcodé kit).
 */
export function configureEntityMeiliFromFeed(feed: {
  indexes: ReadonlyArray<{
    uid: string;
    table?: string;
    countKey?: string;
    settings?: {
      filterableAttributes?: unknown;
      sortableAttributes?: unknown;
    };
  }>;
}): void {
  const indexes: Record<string, EntityMeiliBinding> = {};
  for (const idx of feed.indexes) {
    if (idx.uid.endsWith("_all") || idx.uid.endsWith("_meta")) continue;
    const table = tableForMeiliIndex(idx);
    if (!table || indexes[table]) continue;
    const filterable = asStringArray(idx.settings?.filterableAttributes);
    const sortable = asStringArray(idx.settings?.sortableAttributes);
    indexes[table] = {
      indexUid: idx.uid,
      filterable,
      sortable: sortable.length ? sortable : undefined,
    };
  }
  configureEntityMeili({ indexes });
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function meiliHeaders(apiKey?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

/**
 * POST `/indexes/:uid/search` avec `q` éventuellement vide.
 * `null` = incident (down / index vide / filtre rejeté) → SQL.
 */
export async function browseMeiliIndex(
  req: MeiliBrowseRequest,
): Promise<MeiliBrowseResult | null> {
  const host = (req.host || "").replace(/\/+$/, "");
  if (!host || !req.indexUid) return null;
  const timeoutMs = req.timeoutMs ?? 3000;
  const headers = meiliHeaders(req.apiKey);
  try {
    const statsRes = await fetch(`${host}/indexes/${req.indexUid}/stats`, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (statsRes.status === 404) return null;
    if (!statsRes.ok) return null;
    const stats = (await statsRes.json()) as { numberOfDocuments?: number };
    if (Number(stats.numberOfDocuments || 0) <= 0) return null;

    const page = Math.max(1, req.page ?? 1);
    const hitsPerPage = Math.min(Math.max(req.hitsPerPage ?? 20, 1), 200);
    const searchRes = await fetch(`${host}/indexes/${req.indexUid}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: req.query ?? "",
        filter: req.filters?.length ? req.filters : undefined,
        sort: req.sort?.length ? req.sort : undefined,
        page,
        hitsPerPage,
        attributesToRetrieve: req.attributesToRetrieve ?? ["id"],
        facets: req.facets?.length ? req.facets : undefined,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!searchRes.ok) return null;
    const data = (await searchRes.json()) as {
      hits?: Array<Record<string, unknown>>;
      totalHits?: number;
      estimatedTotalHits?: number;
      facetDistribution?: Record<string, Record<string, number>>;
    };
    const hits = Array.isArray(data.hits) ? data.hits : [];
    return {
      hits,
      total: Number(data.totalHits ?? data.estimatedTotalHits ?? hits.length),
      facetDistribution: data.facetDistribution,
    };
  } catch {
    return null;
  }
}

export function meiliFilterEq(attr: string, raw: string): string {
  const n = Number(raw);
  if (raw !== "" && Number.isFinite(n) && String(n) === raw) {
    return `${attr} = ${n}`;
  }
  const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `${attr} = "${escaped}"`;
}

export function hydrateRowsByIds(
  db: { prepare(sql: string): { all(...args: unknown[]): unknown[] } },
  table: string,
  ids: string[],
): Array<Record<string, unknown>> {
  if (ids.length === 0) return [];
  const ph = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM ${table} WHERE id IN (${ph})`)
    .all(...ids) as Array<Record<string, unknown>>;
  const map = new Map(rows.map((r) => [String(r.id), r]));
  const ordered: Array<Record<string, unknown>> = [];
  for (const id of ids) {
    const row = map.get(id);
    if (row) ordered.push(row);
  }
  return ordered;
}
