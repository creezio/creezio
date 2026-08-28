/**
 * Browse paginé Meili — API publique `@creezio/electron-shell/meili`.
 *
 * Contrat (SoT AGENTS.md section Meili) :
 * - `q` vide = browse filtré / page catalogue (POST `q:""` + filter).
 * - `null` = Meili KO / index vide / filtre rejeté → SQL fallback.
 * - 0 hit sur un index peuplé = succès (pas un fallback SQL).
 * - Interdit : `if (q) meili else sql`.
 * - Ne pas utiliser `searchMeiliIndexes` pour le browse (retourne [] si q vide).
 */

export type MeiliBrowseRequest = {
  host: string;
  apiKey?: string;
  indexUid: string;
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

function meiliHeaders(apiKey?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

export function meiliFilterEq(attr: string, raw: string): string {
  const n = Number(raw);
  if (raw !== "" && Number.isFinite(n) && String(n) === raw) {
    return `${attr} = ${n}`;
  }
  const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `${attr} = "${escaped}"`;
}

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
    if (statsRes.status === 404 || !statsRes.ok) return null;
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
