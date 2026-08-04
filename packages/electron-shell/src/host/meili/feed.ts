/**
 * Contrat d’alimentation Meili générique (Phase C).
 *
 * La marque fournit un feed (tables + indexes + mapping colonnes).
 * L’OS exécute startMeili / runIndexation / swap — sans SQL marque hardcodé.
 *
 * Le feed est OBLIGATOIRE : `runIndexation()` sans feed configuré lève une
 * erreur explicite (le kit n'embarque plus d'UIDs marque legacy).
 */

export type BrandMeiliDocument = Record<string, unknown> & {
  id: string | number;
};

export type BrandMeiliIndexSpec = {
  /** UID Meili (ex. catalog_products) — pas de préfixe marque hardcodé kit. */
  uid: string;
  settings: Record<string, unknown>;
  /**
   * Clé de compteur fingerprint.
   * `produits` | `sites` (sites → counts.fournisseurs historique) | libre.
   */
  countKey: string;
  /** Table SQL source. */
  table: string;
  /** Colonnes indexées (id toujours forcé). */
  columns: string[];
  /** Champ `type` du document Meili. */
  docType: string;
  /** Exclure lignes soft-archivées si colonne archived_at. */
  excludeArchived?: boolean;
};

export type BrandMeiliFeed = {
  id: string;
  schemaVersion: number;
  /** Préfixe stdout progression (ex. TEMPOFLOW3 → `TEMPOFLOW3PROGRESS …`). */
  progressPrefix: string;
  /** Tables SQL pour compteurs cohérence. */
  countTables: {
    produits: string;
    sites: string;
  };
  indexes: readonly BrandMeiliIndexSpec[];
  obsoleteIndexUids?: readonly string[];
  /** Index miroir fingerprint (défaut catalog_meta). */
  metaIndexUid?: string;
};

/** UIDs génériques recommandés. */
export const GENERIC_CATALOG_INDEXES = [
  "catalog_products",
  "catalog_sites",
] as const;

export type GenericCatalogIndexUid = (typeof GENERIC_CATALOG_INDEXES)[number];

let configuredFeed: BrandMeiliFeed | null = null;

/** Enregistre le feed marque pour runIndexation / helpers (process courant). */
export function configureMeiliBrandFeed(feed: BrandMeiliFeed): void {
  configuredFeed = feed;
}

export function getMeiliBrandFeed(): BrandMeiliFeed | null {
  return configuredFeed;
}

export function resetMeiliBrandFeedForTests(): void {
  configuredFeed = null;
}

/**
 * Feed CHR cœur (produits + fournisseurs) — usable par factory --from-prd.
 * UIDs génériques `catalog_*` (jamais d'UID marque).
 */
export function createChrCatalogMeiliFeed(opts: {
  brandId: string;
  progressPrefix?: string;
  schemaVersion?: number;
}): BrandMeiliFeed {
  const prefix = (
    opts.progressPrefix ||
    opts.brandId.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  ).slice(0, 32);
  return {
    id: `${opts.brandId}-catalog`,
    schemaVersion: opts.schemaVersion ?? 1,
    progressPrefix: prefix,
    countTables: { produits: "produits", sites: "fournisseurs" },
    indexes: [
      {
        uid: "catalog_products",
        countKey: "produits",
        table: "produits",
        columns: ["id", "nom", "categorie", "fournisseur_id", "unite"],
        docType: "product",
        excludeArchived: true,
        settings: {
          searchableAttributes: ["nom", "categorie", "unite"],
          filterableAttributes: ["type", "fournisseur_id", "categorie"],
          displayedAttributes: [
            "id",
            "type",
            "nom",
            "categorie",
            "fournisseur_id",
            "unite",
          ],
        },
      },
      {
        uid: "catalog_sites",
        countKey: "sites",
        table: "fournisseurs",
        columns: ["id", "nom", "contact", "email", "telephone", "site_web"],
        docType: "site",
        excludeArchived: true,
        settings: {
          searchableAttributes: ["nom", "contact", "email"],
          filterableAttributes: ["type"],
          displayedAttributes: [
            "id",
            "type",
            "nom",
            "contact",
            "email",
            "telephone",
            "site_web",
          ],
        },
      },
    ],
    obsoleteIndexUids: [],
    metaIndexUid: "catalog_meta",
  };
}

/** Compteurs attendus par UID depuis counts SQL fingerprint. */
export function expectedCountsForFeed(
  feed: BrandMeiliFeed,
  sql: { produits: number; fournisseurs: number },
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const idx of feed.indexes) {
    if (idx.countKey === "produits") out[idx.uid] = sql.produits;
    else if (idx.countKey === "sites" || idx.countKey === "fournisseurs") {
      out[idx.uid] = sql.fournisseurs;
    } else {
      out[idx.uid] = 0;
    }
  }
  return out;
}
