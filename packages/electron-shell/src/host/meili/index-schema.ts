/**
 * Schéma logique des index Meili catalogue (TF gold — N2).
 * Bumper INDEX_SCHEMA_VERSION à chaque changement d'indexes / settings / docs
 * pour forcer une réindexation au boot.
 *
 * Index réels (voir electron/meili-indexer.ts) :
 *   - tf2_produits
 *   - tf2_marketplaces
 *   - tf2_all  (unifié keyword = marketplaces uniquement)
 *
 * Les marques CV/Fidu injectent leur propre schema au cutover N2p.
 */

/** v1 = produits / marketplaces / all (port shell depuis Fidu). */
export const INDEX_SCHEMA_VERSION = 1;

export const MEILI_FINGERPRINT_META_KEY = "meili_index_fingerprint";

/** Clé meta : indexation en cours (posée au start, effacée à la fin). */
export const MEILI_INDEX_IN_PROGRESS_KEY = "meili_index_in_progress";

export const CATALOG_INDEXES = [
  "tf2_produits",
  "tf2_marketplaces",
  "tf2_all",
] as const;

export type CatalogIndexUid = (typeof CATALOG_INDEXES)[number];

/** Alias historique (API cohérence GED) — liste catalogue. */
export const GED_INDEXES = CATALOG_INDEXES;
export type GedIndexUid = CatalogIndexUid;

export type CatalogSqlCounts = {
  produits: number;
  fournisseurs: number;
};

/** Alias pour compat API cohérence (ex-GedSqlCounts). */
export type GedSqlCounts = CatalogSqlCounts;

export type MeiliFingerprint = {
  indexSchema: number;
  sqliteSchema: number;
  counts: CatalogSqlCounts;
  builtAt: string;
  appVersion?: string;
};

export function expectedMeiliCounts(
  sql: CatalogSqlCounts,
): Record<CatalogIndexUid, number> {
  return {
    tf2_produits: sql.produits,
    tf2_marketplaces: sql.fournisseurs,
    // Indexeur Tempo : tf2_all = marketplaces uniquement (pas de produits).
    tf2_all: sql.fournisseurs,
  };
}

export function parseFingerprint(raw: string | null | undefined): MeiliFingerprint | null {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(raw) as MeiliFingerprint;
    if (
      typeof data.indexSchema !== "number" ||
      typeof data.sqliteSchema !== "number" ||
      !data.counts ||
      typeof data.builtAt !== "string"
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function serializeFingerprint(fp: MeiliFingerprint): string {
  return JSON.stringify(fp);
}
