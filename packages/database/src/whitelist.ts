/**
 * Policy écriture / automation Admin Database.
 * SoT portée depuis TempoFlow ; configurable via `configureDatabasePolicy`.
 */

/** Tables métier TempoFlow autorisées CRUD (défaut historique). */
export const TEMPOFLOW_CRUD_WHITELIST = [
  "fournisseurs",
  "produits",
  "skus",
  "promotions",
  "releves_prix",
  "stack_items",
  "groupes_substitution",
  "substitution_membres",
] as const;

/** Tables jamais automatisables / jamais éditables via le module Database. */
export const DEFAULT_FORBIDDEN_WRITE_TABLES = [
  "users",
  "api_keys",
  "meta",
  "mcp_clients",
  "mcp_tokens",
  "mcp_tool_policies",
  "mcp_audit_logs",
  "plugin_acl",
  "db_automations",
  "db_automation_events",
  "db_automation_runs",
  "db_saved_views",
  "db_access_log",
] as const;

let crudWhitelist = new Set<string>(TEMPOFLOW_CRUD_WHITELIST);
let forbiddenWriteTables = new Set<string>(DEFAULT_FORBIDDEN_WRITE_TABLES);

export function configureDatabasePolicy(opts: {
  crudAllowlist?: Iterable<string>;
  forbiddenWriteTables?: Iterable<string>;
}): void {
  if (opts.crudAllowlist) {
    crudWhitelist = new Set(opts.crudAllowlist);
  }
  if (opts.forbiddenWriteTables) {
    forbiddenWriteTables = new Set(opts.forbiddenWriteTables);
  }
}

/** @deprecated préférer TEMPOFLOW_CRUD_WHITELIST + configureDatabasePolicy */
export const CRUD_WHITELIST = crudWhitelist;

/** @deprecated préférer DEFAULT_FORBIDDEN_WRITE_TABLES + configureDatabasePolicy */
export const FORBIDDEN_WRITE_TABLES = forbiddenWriteTables;

export function canCrudTable(table: string): boolean {
  return crudWhitelist.has(table) && !forbiddenWriteTables.has(table);
}

export function canAutomateTable(table: string): boolean {
  if (!table || table.startsWith("sqlite_")) return false;
  if (forbiddenWriteTables.has(table)) return false;
  if (
    table.startsWith("db_automation") ||
    table === "db_saved_views" ||
    table === "db_access_log"
  ) {
    return false;
  }
  return true;
}
