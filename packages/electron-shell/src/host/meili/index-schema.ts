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
 * Les marques CV/Fidu injectent leur propre schema au cutover N2p via
 * `configureMeiliCatalogSqlTables` (tables SQL comptées).
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

/**
 * Tables SQL utilisées pour les compteurs de cohérence Meili.
 * Défaut = schéma TempoFlow (`produits` / `fournisseurs`).
 * Marques sans catalogue TF : `configureMeiliCatalogSqlTables`.
 */
export type MeiliCatalogSqlTables = {
  /** Table lignes « produits » (compteur → tf2_produits). */
  produits: string;
  /**
   * Table lignes « sites / marketplaces » (compteur → tf2_marketplaces / tf2_all).
   * Défaut TF : `fournisseurs`. Champ retourné dans CatalogSqlCounts.fournisseurs
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
