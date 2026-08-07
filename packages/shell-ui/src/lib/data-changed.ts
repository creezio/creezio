/**
 * Bus client de réactivité data (mutations → UI).
 *
 * Contrat :
 * - Émetteurs : `emitDataChanged({ resource, ids?, source })` après une
 *   mutation confirmée (UI, fetch qui lit le header API, tool MCP/assistant).
 * - Consommateurs : `subscribeDataChanged` / hook UI `useCreezioResource`
 *   (rafraîchit la page ouverte sans reload manuel).
 *
 * Header HTTP homonyme (EntitySpec / mounts) : `x-creezio-data-changed`
 * (valeur = resource, CSV si plusieurs). Le fetch interceptor kit le
 * transforme en événement navigateur.
 */

export const CREEZIO_DATA_CHANGED_EVENT = "creezio:data-changed";
export const CREEZIO_DATA_CHANGED_HEADER = "x-creezio-data-changed";

export type CreezioDataChangedDetail = {
  /** Identifiant de ressource (ex. `panier`, `commandes`, table EntitySpec). */
  resource: string;
  ids?: string[];
  /** Provenance : `ui` | `api` | `mcp` | `assistant` | libre. */
  source?: string;
  at?: number;
};

export function emitDataChanged(detail: CreezioDataChangedDetail): void {
  if (typeof window === "undefined") return;
  const resource = String(detail.resource || "").trim();
  if (!resource) return;
  window.dispatchEvent(
    new CustomEvent(CREEZIO_DATA_CHANGED_EVENT, {
      detail: {
        resource,
        ids: detail.ids,
        source: detail.source,
        at: detail.at ?? Date.now(),
      } satisfies CreezioDataChangedDetail,
    }),
  );
}

export function subscribeDataChanged(
  handler: (detail: CreezioDataChangedDetail) => void,
  opts?: { resource?: string | string[] },
): () => void {
  if (typeof window === "undefined") return () => {};
  const wanted = opts?.resource
    ? new Set(
        (Array.isArray(opts.resource) ? opts.resource : [opts.resource]).map(
          (r) => r.trim(),
        ),
      )
    : null;

  const onEvent = (e: Event) => {
    const detail = (e as CustomEvent<CreezioDataChangedDetail>).detail;
    if (!detail?.resource) return;
    if (wanted && !wanted.has(detail.resource)) return;
    handler(detail);
  };
  window.addEventListener(CREEZIO_DATA_CHANGED_EVENT, onEvent);
  return () => window.removeEventListener(CREEZIO_DATA_CHANGED_EVENT, onEvent);
}

/** Parse le header `x-creezio-data-changed` (CSV) → resources. */
export function parseDataChangedHeader(
  value: string | null | undefined,
): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Heuristique tool MCP / assistant → resource (écriture).
 * Retourne null si tool probablement lecture seule.
 */
export function inferResourceFromToolName(toolName: string): string | null {
  const n = String(toolName || "").trim().toLowerCase();
  if (!n) return null;
  if (
    /^(get_|list_|search_|find_|read_|count_|describe_|schema_)/.test(n) ||
    n.endsWith("_get") ||
    n.endsWith("_list")
  ) {
    return null;
  }
  if (/panier|cart/.test(n)) return "panier";
  if (/commande/.test(n)) return "commandes";
  if (/sku/.test(n)) return "skus";
  if (/produit|product/.test(n)) return "produits";
  if (/fournisseur|supplier|vendor/.test(n)) return "fournisseurs";
  if (/client|customer/.test(n)) return "clients";
  if (/task|tache|todo/.test(n)) return "tasks";
  if (/mail|email/.test(n)) return "mails";
  // create_widget → widgets ; update_panier_ligne déjà couvert
  const m = /^(?:add_to_|add_|create_|update_|delete_|close_|set_|remove_|archive_)([a-z0-9_-]+)/.exec(
    n,
  );
  if (m?.[1]) {
    const stem = m[1].replace(/_ligne$/, "").replace(/_item$/, "");
    return stem || null;
  }
  if (/^(add_|create_|update_|delete_|close_|set_|remove_|archive_)/.test(n)) {
    return n.replace(/^(add_to_|add_|create_|update_|delete_|close_|set_|remove_|archive_)/, "") || null;
  }
  return null;
}

let fetchPatched = false;

/**
 * Intercepte `window.fetch` une fois : si la réponse porte
 * `x-creezio-data-changed`, émet le bus client (source `api`).
 */
export function installCreezioDataChangedFetch(): void {
  if (typeof window === "undefined" || fetchPatched) return;
  const original = window.fetch.bind(window);
  fetchPatched = true;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await original(input, init);
    try {
      const header = res.headers.get(CREEZIO_DATA_CHANGED_HEADER);
      for (const resource of parseDataChangedHeader(header)) {
        emitDataChanged({ resource, source: "api" });
      }
    } catch {
      /* ignore */
    }
    return res;
  };
}

/** Tests uniquement. */
export function resetDataChangedFetchForTests(): void {
  fetchPatched = false;
}
