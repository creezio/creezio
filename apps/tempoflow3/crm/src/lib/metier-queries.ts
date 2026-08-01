/**
 * Queries métier tempoflow3 — client HTTP vers l'API brand générée.
 */
const DEFAULT_BASE =
  process.env.METIER_BASE_URL || "http://127.0.0.1:18791";

export async function metierFetch(
  pathName: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`${DEFAULT_BASE}${pathName}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `metier ${res.status} ${pathName}: ${(body as { error?: string }).error || res.statusText}`,
    );
  }
  return body;
}

export async function listEntity(entityId: string) {
  const data = (await metierFetch(`/api/v1/brand/${entityId}`)) as {
    items: unknown[];
  };
  return data.items;
}

export async function createEntity(entityId: string, payload: Record<string, unknown>) {
  return metierFetch(`/api/v1/brand/${entityId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const BRAND_PAGES = [
  {
    "id": "fournisseurs",
    "path": "/fournisseurs",
    "title": "Fournisseurs",
    "entityId": "fournisseurs",
    "kind": "list"
  },
  {
    "id": "produits",
    "path": "/produits",
    "title": "Produits",
    "entityId": "produits",
    "kind": "list"
  },
  {
    "id": "prix",
    "path": "/prix",
    "title": "Prix",
    "entityId": "prix",
    "kind": "list"
  },
  {
    "id": "panier",
    "path": "/panier",
    "title": "Panier",
    "entityId": "panier_lignes",
    "kind": "flow"
  },
  {
    "id": "commandes",
    "path": "/commandes",
    "title": "Commandes",
    "entityId": "commandes",
    "kind": "list"
  }
] as const;
