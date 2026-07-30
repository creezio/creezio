import path from "node:path";
import { createRequire } from "node:module";
import type { Migration } from "../types.js";

/**
 * Module Database avancé (style Notion) — SoT SQL = `@creezio/database` (R1).
 * Tables : automations, outbox, runs, vues, access log.
 * Chargement runtime via createRequire (cwd app) — pas de cycle build.
 */
function loadDatabaseCoreSql(): string {
  const req = createRequire(path.join(process.cwd(), "package.json"));
  const mod = req("@creezio/database") as { DATABASE_CORE_SQL?: string };
  if (typeof mod.DATABASE_CORE_SQL !== "string" || !mod.DATABASE_CORE_SQL.trim()) {
    throw new Error(
      "platformHistoricalMigrations: DATABASE_CORE_SQL introuvable (@creezio/database)",
    );
  }
  return mod.DATABASE_CORE_SQL;
}

const migration: Migration = {
  version: 33,
  name: "database-automations",
  up(db) {
    db.exec(loadDatabaseCoreSql());
  },
};

export default migration;
