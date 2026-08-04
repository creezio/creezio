/**
 * Schéma logique des index Meili catalogue.
 *
 * Le descripteur SoT est le `BrandMeiliFeed` de la marque (UIDs `catalog_*`
 * via `configureMeiliBrandFeed` / `runFeedIndexation`). Ce module fournit :
 * - les clés meta fingerprint / in-progress (partagées feed ↔ cohérence) ;
 * - les UIDs génériques par défaut (`catalog_products` / `catalog_sites`)
 *   utilisés par la cohérence quand aucun feed n'est configuré ;
 * - les tables SQL comptées (`configureMeiliCatalogSqlTables`).
 *
 * Aucun UID marque ne vit dans le kit — une marque avec des UIDs
 * historiques les porte dans SON feed.
 *
 * Bumper INDEX_SCHEMA_VERSION (ou feed.schemaVersion) à chaque changement
 * d'indexes / settings / docs pour forcer une réindexation au boot.
 */

/** v1 = produits / sites (descripteur générique catalog_*). */
export const INDEX_SCHEMA_VERSION = 1;

export const MEILI_FINGERPRINT_META_KEY = "meili_index_fingerprint";

/** Clé meta : indexation en cours (posée au start, effacée à la fin). */
export const MEILI_INDEX_IN_PROGRESS_KEY = "meili_index_in_progress";

export const CATALOG_INDEXES = [
  "catalog_products",
  "catalog_sites",
] as const;

export type CatalogIndexUid = (typeof CATALOG_INDEXES)[number];

/** Alias historique (API cohérence GED) — liste catalogue. */
export const GED_INDEXES = CATALOG_INDEXES;
export type GedIndexUid = CatalogIndexUid;

/**
 * Tables SQL utilisées pour les compteurs de cohérence Meili.
 * Défaut = schéma CHR générique (`produits` / `fournisseurs`).
 * Marques avec un autre schéma : `configureMeiliCatalogSqlTables`.
 */
export type MeiliCatalogSqlTables = {
  /** Table lignes « produits » (compteur → catalog_products). */
  produits: string;
  /**
   * Table lignes « sites / marketplaces » (compteur → catalog_sites).
   * Défaut CHR : `fournisseurs`. Champ retourné dans CatalogSqlCounts.fournisseurs
   * (nom historique du fingerprint — ne pas renommer sans bump schema).
   */
  sites: string;
};

const DEFAULT_CATALOG_SQL_TABLES: MeiliCatalogSqlTables = {
  produits: "produits",
  sites: "fournisseurs",
};

let catalogSqlTables: MeiliCatalogSqlTables = { ...DEFAULT_CATALOG_SQL_TABLES };

/** Configure les tables SQL comptées pour la cohérence Meili (défaut TF). */
export function configureMeiliCatalogSqlTables(
  next: Partial<MeiliCatalogSqlTables>,
): void {
  catalogSqlTables = { ...catalogSqlTables, ...next };
}

export function getMeiliCatalogSqlTables(): MeiliCatalogSqlTables {
  return catalogSqlTables;
}

/** Tests uniquement. */
export function resetMeiliCatalogSqlTablesForTests(): void {
  catalogSqlTables = { ...DEFAULT_CATALOG_SQL_TABLES };
}

export type CatalogSqlCounts = {
  produits: number;
  /** Compteur table `sites` (défaut TF = fournisseurs) — nom fingerprint historique. */
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
    catalog_products: sql.produits,
    catalog_sites: sql.fournisseurs,
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
