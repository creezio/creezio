/**
 * Runtime sandbox DemoBrand (H2.4) — multi-DB réel + routes API isolées.
 *
 * Preuve kit :
 * - jour 0 = core + brand only
 * - module `demo-notes` écrit uniquement dans brand
 * - `installSandboxPlugin` crée `plugin/<id>.db` + mount API plugin
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  composeMigrations,
  createSqliteRuntime,
  type PathsContext,
  type SqliteMigration,
  type SqliteRuntime,
} from "@creezio/platform-core";
import { AUTH_CORE_SQL } from "@creezio/auth";
import {
  PRODUCT_HUB_ACL_ORG_SQL,
  PRODUCT_HUB_ACL_USER_SQL,
  PRODUCT_HUB_CORE_SQL,
  createSqliteProductHubStore,
  type SqliteProductHubStore,
} from "@creezio/product-hub";
import {
  createApiKernel,
  type ApiKernel,
  type ApiMount,
} from "@creezio/api-kernel";
import {
  createMcpFacade,
  type McpFacade,
  type McpRegisteredTool,
} from "@creezio/mcp-facade";
import { demobrandManifest as manifest } from "./app-manifest.js";

export const DEMOBRAND_NOTES_SQL = `
CREATE TABLE IF NOT EXISTS demobrand_notes (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
`;

export const DEMOBRAND_PLUGIN_KV_SQL = `
CREATE TABLE IF NOT EXISTS plugin_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
`;

export function demobrandCoreMigrations(): SqliteMigration[] {
  return composeMigrations(
    { id: "h2_001_auth", sql: AUTH_CORE_SQL },
    {
      id: "h2_002_product_hub",
      sql: [
        PRODUCT_HUB_CORE_SQL,
        PRODUCT_HUB_ACL_USER_SQL,
        PRODUCT_HUB_ACL_ORG_SQL,
      ].join("\n"),
    },
  );
}

export function demobrandBrandMigrations(): SqliteMigration[] {
  return composeMigrations({
    id: "h2_brand_001_notes",
    sql: DEMOBRAND_NOTES_SQL,
  });
}

export function demobrandPluginMigrations(): SqliteMigration[] {
  return composeMigrations({
    id: "h2_plugin_001_kv",
    sql: DEMOBRAND_PLUGIN_KV_SQL,
  });
}

function createDemoNotesMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) {
        return { status: 503, body: { ok: false, error: "db_unavailable" } };
      }
      const method = req.method.toUpperCase();

      // Tentative explicite d'écrire core → doit 403 via ScopedDbAccess
      if (subPath === "attack-core" && method === "POST") {
        db.access({ kind: "core" }, "write").exec(
          `INSERT INTO _creezio_schema_info(key, value) VALUES ('pwned', '1')`,
        );
        return { status: 200, body: { ok: true, pwned: true } };
      }

      if (subPath === "notes" && method === "GET") {
        const rows = db
          .prepare(
            `SELECT id, body, created_at FROM demobrand_notes ORDER BY created_at DESC`,
          )
          .all() as Array<{ id: string; body: string; created_at: string }>;
        return { status: 200, body: { ok: true, layer: db.layer, notes: rows } };
      }

      if (subPath === "notes" && method === "POST") {
        const body =
          req.body && typeof req.body === "object"
            ? (req.body as { body?: string; id?: string })
            : {};
        const id = body.id || `note-${Date.now()}`;
        const text = String(body.body ?? "");
        const createdAt = new Date().toISOString();
        db.prepare(
          `INSERT INTO demobrand_notes (id, body, created_at) VALUES (?, ?, ?)`,
        ).run(id, text, createdAt);
        return {
          status: 201,
          body: { ok: true, layer: db.layer, note: { id, body: text, created_at: createdAt } },
        };
      }

      return { status: 404, body: { ok: false, error: "not_found", subPath } };
    },
  };
}

function createPluginKvMount(pluginId: string): ApiMount {
  return {
    dbLayer: "plugin",
    handle: async ({ req, subPath, db }) => {
      if (!db) {
        return { status: 503, body: { ok: false, error: "db_unavailable" } };
      }
      const method = req.method.toUpperCase();

      if (subPath === "attack-core" && method === "POST") {
        db.access({ kind: "core" }, "write").exec(
          `INSERT INTO _creezio_schema_info(key, value) VALUES ('pwned', '1')`,
        );
        return { status: 200, body: { ok: true, pwned: true } };
      }

      if (subPath === "kv" && method === "GET") {
        const rows = db
          .prepare(`SELECT key, value, updated_at FROM plugin_kv`)
          .all() as Array<{ key: string; value: string; updated_at: string }>;
        return {
          status: 200,
          body: { ok: true, pluginId, layer: db.layer, kv: rows },
        };
      }

      if (subPath === "kv" && method === "POST") {
        const body =
          req.body && typeof req.body === "object"
            ? (req.body as { key?: string; value?: string })
            : {};
        const key = String(body.key || "default");
        const value = String(body.value ?? "");
        const updatedAt = new Date().toISOString();
        db.prepare(
          `INSERT INTO plugin_kv (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        ).run(key, value, updatedAt);
        return {
          status: 201,
          body: { ok: true, pluginId, layer: db.layer, entry: { key, value, updated_at: updatedAt } },
        };
      }

      return { status: 404, body: { ok: false, error: "not_found", subPath } };
    },
  };
}

export type DemobrandSandbox = {
  ctx: PathsContext;
  runtime: SqliteRuntime;
  api: ApiKernel;
  mcp: McpFacade;
  productHub: SqliteProductHubStore;
  installPlugin(pluginId: string): {
    path: string;
    created: boolean;
  };
  close(): void;
};

/**
 * Boot sandbox H2. `userDataRoot` optionnel (tests / CI) — défaut tmp.
 */
export function createDemobrandSandbox(opts?: {
  userDataRoot?: string;
}): DemobrandSandbox {
  const userDataRoot =
    opts?.userDataRoot ||
    fs.mkdtempSync(path.join(os.tmpdir(), "creezio-demobrand-h2-"));

  const ctx: PathsContext = {
    manifest,
    userDataRoot,
    isPackaged: true,
  };

  const runtime = createSqliteRuntime({
    ctx,
    coreMigrations: demobrandCoreMigrations(),
    brandMigrations: demobrandBrandMigrations(),
    touchBrand: true,
  });

  const productHub = createSqliteProductHubStore({
    coreDbPath: runtime.paths.core,
    conversationPrefix: "demobrand",
  });

  const api = createApiKernel({
    brandId: manifest.brandId,
    appVersion: "0.1.0",
    sqliteRuntime: runtime,
  });
  api.registerModuleApi("demo-notes", createDemoNotesMount());

  function moduleTools(): McpRegisteredTool[] {
    return [
      {
        name: "module.demo-notes.list",
        description: "Liste les notes brand (sandbox)",
        space: "module",
        ownerId: "demo-notes",
        handler: async () => {
          const res = await api.handle({
            method: "GET",
            path: "/api/v1/modules/demo-notes/notes",
          });
          return { ok: res.status < 400, content: res.body };
        },
      },
    ];
  }

  function pluginTools(): McpRegisteredTool[] {
    return runtime.listOpenPlugins().map((pluginId) => ({
      name: `plugin.${pluginId}.kv_list`,
      description: `Liste KV plugin ${pluginId}`,
      space: "plugin" as const,
      ownerId: pluginId,
      handler: async () => {
        const res = await api.handle({
          method: "GET",
          path: `/api/v1/plugins/${pluginId}/kv`,
        });
        return { ok: res.status < 400, content: res.body };
      },
    }));
  }

  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => ({
      module: moduleTools(),
      plugin: pluginTools(),
    }),
  });

  return {
    ctx,
    runtime,
    api,
    mcp,
    productHub,

    installPlugin(pluginId) {
      const opened = runtime.openPlugin(pluginId, demobrandPluginMigrations());
      api.registerPluginApi(pluginId, createPluginKvMount(pluginId));
      return { path: opened.handle.path, created: opened.created };
    },

    close() {
      productHub.close();
      runtime.close();
    },
  };
}
