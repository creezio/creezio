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
} from "./index-schema.js";
export type {
  CatalogIndexUid,
  CatalogSqlCounts,
  GedIndexUid,
  GedSqlCounts,
  MeiliCatalogSqlTables,
  MeiliFingerprint,
} from "./index-schema.js";

export {
  buildFingerprint,
  countCatalogSql,
  countGedSql,
  readCoherenceDbSnapshot,
  readFingerprintFromDb,
  readIndexInProgress,
  readSqliteSchemaVersion,
  writeFingerprintToDb,
} from "./coherence-db.js";
export type {
  CoherenceDbSnapshot,
  MeiliIndexInProgress,
} from "./coherence-db.js";

export type { MeiliCoherencePaths, MeiliReadyDecision } from "./coherence.js";
export {
  configureMeiliCoherencePaths,
  decideMeiliReady,
} from "./coherence.js";

export { runIndexation } from "./indexer.js";
