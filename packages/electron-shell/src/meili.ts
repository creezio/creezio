/**
 * @deprecated P1.b — le sous-domaine Meili vit dans `@creezio/search` ;
 * importer depuis là. Shim de compat du subpath historique
 * `@creezio/electron-shell/meili` (surface FIGÉE — gate
 * `test-phase-electron-shell-frozen-exports`).
 */

export {
  CATALOG_INDEXES,
  GED_INDEXES,
  INDEX_SCHEMA_VERSION,
  MEILI_FINGERPRINT_META_KEY,
  MEILI_INDEX_IN_PROGRESS_KEY,
  configureMeiliCatalogSqlTables,
  expectedMeiliCounts,
  getMeiliCatalogSqlTables,
  parseFingerprint,
  resetMeiliCatalogSqlTablesForTests,
  serializeFingerprint,
} from "@creezio/search";
export type {
  CatalogIndexUid,
  CatalogSqlCounts,
  GedIndexUid,
  GedSqlCounts,
  MeiliCatalogSqlTables,
  MeiliFingerprint,
} from "@creezio/search";

export {
  GENERIC_CATALOG_INDEXES,
  configureMeiliBrandFeed,
  expectedCountsForFeed,
  getMeiliBrandFeed,
  resetMeiliBrandFeedForTests,
} from "@creezio/search";
export type {
  BrandMeiliDocument,
  BrandMeiliFeed,
  BrandMeiliIndexSpec,
  GenericCatalogIndexUid,
  MeiliFeedSqliteDb,
} from "@creezio/search";

export {
  buildFingerprint,
  countCatalogSql,
  countGedSql,
  readCoherenceDbSnapshot,
  readFingerprintFromDb,
  readIndexInProgress,
  readSqliteSchemaVersion,
  writeFingerprintToDb,
} from "@creezio/search";
export type {
  CoherenceDbSnapshot,
  MeiliIndexInProgress,
} from "@creezio/search";

export type { MeiliCoherencePaths, MeiliReadyDecision } from "@creezio/search";
export {
  configureMeiliCoherencePaths,
  decideMeiliReady,
  meiliCoherenceScriptPath,
} from "@creezio/search";

export { runIndexation } from "@creezio/search";
export { runFeedIndexation, searchMeiliIndexes } from "@creezio/search";
export {
  browseMeiliIndex,
  browseMeiliIndexOutcome,
  meiliFilterEq,
} from "@creezio/search";
export type {
  MeiliBrowseOutcome,
  MeiliBrowseRequest,
  MeiliBrowseResult,
} from "@creezio/search";
