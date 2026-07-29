/**
 * Runtime multi-DB SQLite (H2.0) — handles core / brand / plugin/<id>.
 *
 * Jour 0 serveur : ouvre **core + brand** uniquement.
 * Plugin : `openPlugin(id)` à l'install (ensurePluginDb + migrations).
 */

import type { PathsContext } from "./paths.js";
import {
  openNodeSqliteDatabase,
  type OpenSqliteDatabase,
  type SqliteDatabase,
  type SqliteStatement,
} from "./sqlite-driver.js";
import {
  ensureMigrations,
  listAppliedMigrations,
  type EnsureMigrationsResult,
  type SqliteMigration,
} from "./sqlite-migrations.js";
import {
  ensureDay0SqliteLayout,
  ensurePluginDb,
  pluginDbExists,
  resolveBrandDbPath,
  resolveCoreDbPath,
  resolvePluginDbPath,
} from "./sqlite-layout.js";

export type SqliteLayerKind = "core" | "brand" | "plugin";

export type SqliteLayerRef =
  | { kind: "core" }
  | { kind: "brand" }
  | { kind: "plugin"; pluginId: string };

export type SqliteHandle = {
  readonly layer: SqliteLayerRef;
  readonly path: string;
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
  listMigrations(): string[];
};

export type SqliteRuntimeStatus = {
  corePath: string;
  brandPath: string;
  coreOpen: boolean;
  brandOpen: boolean;
  /** Plugin ids dont le handle est ouvert (pas seulement fichier existant). */
  openPlugins: string[];
  /** Plugin ids dont le fichier DB existe sur disque. */
  installedPlugins: string[];
};

export type OpenPluginResult = {
  handle: SqliteHandle;
  created: boolean;
  migrations: EnsureMigrationsResult;
};

export type SqliteRuntime = {
  readonly paths: { core: string; brand: string };
  getCore(): SqliteHandle;
  getBrand(): SqliteHandle;
  /** Throw si plugin non ouvert. */
  getPlugin(pluginId: string): SqliteHandle;
  hasPluginOpen(pluginId: string): boolean;
  pluginFileExists(pluginId: string): boolean;
  /**
   * Install / open plugin DB : ensure fichier + open + migrations plugin.
   * Ne touche jamais core/brand.
   */
  openPlugin(
    pluginId: string,
    migrations?: readonly SqliteMigration[],
  ): OpenPluginResult;
  listOpenPlugins(): string[];
  status(): SqliteRuntimeStatus;
  close(): void;
};

export type CreateSqliteRuntimeOptions = {
  ctx: PathsContext;
  /** Migrations appliquées sur core au boot (jour 0). */
  coreMigrations?: readonly SqliteMigration[];
  /** Migrations appliquées sur brand au boot (jour 0). */
  brandMigrations?: readonly SqliteMigration[];
  openDatabase?: OpenSqliteDatabase;
  /** Touch brand file si absent (défaut true). */
  touchBrand?: boolean;
};

function wrapHandle(
  layer: SqliteLayerRef,
  dbPath: string,
  db: SqliteDatabase,
): SqliteHandle {
  let closed = false;
  return {
    layer,
    path: dbPath,
    exec(sql) {
      if (closed) throw new Error("sqlite handle closed");
      db.exec(sql);
    },
    prepare(sql) {
      if (closed) throw new Error("sqlite handle closed");
      return db.prepare(sql);
    },
    close() {
      if (closed) return;
      closed = true;
      db.close?.();
    },
    listMigrations() {
      if (closed) throw new Error("sqlite handle closed");
      return listAppliedMigrations(db);
    },
  };
}

/**
 * Crée le runtime multi-DB : layout jour 0 + open core/brand + migrations.
 * Aucun plugin n'est ouvert tant que `openPlugin` n'est pas appelé.
 */
export function createSqliteRuntime(
  opts: CreateSqliteRuntimeOptions,
): SqliteRuntime {
  const open = opts.openDatabase || openNodeSqliteDatabase;
  const touchBrand = opts.touchBrand !== false;
  const day0 = ensureDay0SqliteLayout(opts.ctx, { touchBrand });

  const coreDb = open(day0.core);
  coreDb.exec("PRAGMA foreign_keys = ON;");
  if (opts.coreMigrations?.length) {
    ensureMigrations(coreDb, opts.coreMigrations);
  } else {
    ensureMigrations(coreDb, []);
  }

  const brandDb = open(day0.brand);
  brandDb.exec("PRAGMA foreign_keys = ON;");
  if (opts.brandMigrations?.length) {
    ensureMigrations(brandDb, opts.brandMigrations);
  } else {
    ensureMigrations(brandDb, []);
  }

  let coreHandle: SqliteHandle | null = wrapHandle(
    { kind: "core" },
    day0.core,
    coreDb,
  );
  let brandHandle: SqliteHandle | null = wrapHandle(
    { kind: "brand" },
    day0.brand,
    brandDb,
  );
  const plugins = new Map<string, SqliteHandle>();
  let closed = false;

  function assertOpen(): void {
    if (closed) throw new Error("SqliteRuntime closed");
  }

  return {
    paths: { core: day0.core, brand: day0.brand },

    getCore() {
      assertOpen();
      if (!coreHandle) throw new Error("core handle missing");
      return coreHandle;
    },

    getBrand() {
      assertOpen();
      if (!brandHandle) throw new Error("brand handle missing");
      return brandHandle;
    },

    getPlugin(pluginId) {
      assertOpen();
      const h = plugins.get(pluginId);
      if (!h) {
        throw new Error(`plugin DB non ouverte: ${pluginId}`);
      }
      return h;
    },

    hasPluginOpen(pluginId) {
      return plugins.has(pluginId);
    },

    pluginFileExists(pluginId) {
      return pluginDbExists(opts.ctx, pluginId);
    },

    openPlugin(pluginId, migrations = []) {
      assertOpen();
      const existing = plugins.get(pluginId);
      if (existing) {
        const mig =
          migrations.length > 0
            ? ensureMigrations(
                {
                  exec: (sql) => existing.exec(sql),
                  prepare: (sql) => existing.prepare(sql),
                },
                migrations,
              )
            : { applied: [] as string[], already: existing.listMigrations() };
        return { handle: existing, created: false, migrations: mig };
      }

      const ensured = ensurePluginDb(opts.ctx, pluginId);
      const db = open(ensured.path);
      db.exec("PRAGMA foreign_keys = ON;");
      const mig = ensureMigrations(db, migrations);
      const handle = wrapHandle(
        { kind: "plugin", pluginId },
        ensured.path,
        db,
      );
      plugins.set(pluginId, handle);
      return { handle, created: ensured.created, migrations: mig };
    },

    listOpenPlugins() {
      return [...plugins.keys()].sort();
    },

    status() {
      const installed: string[] = [];
      // Ne scanne pas le FS exhaustivement — expose open + existence connue via openPlugin.
      for (const id of plugins.keys()) {
        if (pluginDbExists(opts.ctx, id)) installed.push(id);
      }
      return {
        corePath: resolveCoreDbPath(opts.ctx),
        brandPath: resolveBrandDbPath(opts.ctx),
        coreOpen: Boolean(coreHandle) && !closed,
        brandOpen: Boolean(brandHandle) && !closed,
        openPlugins: [...plugins.keys()].sort(),
        installedPlugins: installed.sort(),
      };
    },

    close() {
      if (closed) return;
      closed = true;
      for (const h of plugins.values()) h.close();
      plugins.clear();
      brandHandle?.close();
      coreHandle?.close();
      brandHandle = null;
      coreHandle = null;
    },
  };
}

/** Résout le chemin d'une couche (utile tests / diagnostics). */
export function resolveLayerPath(
  ctx: PathsContext,
  layer: SqliteLayerRef,
): string {
  if (layer.kind === "core") return resolveCoreDbPath(ctx);
  if (layer.kind === "brand") return resolveBrandDbPath(ctx);
  return resolvePluginDbPath(ctx, layer.pluginId);
}
