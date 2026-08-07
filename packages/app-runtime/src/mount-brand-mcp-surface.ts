/**
 * Monte OAuth MCP + admin MCP sur le runtime marque (SQLite core + store OS).
 * Sans credentials externes : issuer = baseUrl harness/loopback.
 */
import { Hono } from "hono";
import type { AppManifest } from "@creezio/brand-config";
import type { SqliteRuntime } from "@creezio/platform-core";
import {
  configureMcpOAuth,
  configureMcpAdmin,
  createMcpOAuthRoutes,
  createMcpAdminRoutes,
  ensureMcpAdminSchema,
  mcpOauthReady,
  resolveMcpPublicUrl,
  mcpAdminStatus,
  type McpFacade,
} from "@creezio/mcp-facade";
import {
  buildApiEndpointsRegistry,
  collectHonoRoutes,
  createApiEndpointsRoutes,
  createRequestLogsRoutes,
} from "@creezio/observability";
import type { BrandOsComposition } from "./compose-brand-os.js";

export type BrandMcpSurface = {
  app: Hono;
  /** true si tables OAuth présentes */
  oauthReady: () => boolean;
  publicUrl: () => string | null;
};

function tableExists(db: {
  prepare: (sql: string) => { get: (...a: unknown[]) => unknown };
}, name: string): boolean {
  return Boolean(
    db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name=?`,
      )
      .get(name),
  );
}

/** DDL OAuth MCP sur core.db (parité step historique 022 — sans schema_version brand). */
const MCP_OAUTH_CORE_DDL = `
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id                  TEXT PRIMARY KEY,
  client_secret_hash         TEXT,
  client_name                TEXT,
  redirect_uris              TEXT NOT NULL,
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'client_secret_post',
  grant_types                TEXT NOT NULL DEFAULT 'authorization_code,refresh_token',
  scope                      TEXT,
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  enabled                   INTEGER NOT NULL DEFAULT 1,
  revoked_at                TEXT,
  last_used_at              TEXT
);
CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
  code_hash             TEXT PRIMARY KEY,
  client_id             TEXT NOT NULL,
  redirect_uri          TEXT NOT NULL,
  scope                 TEXT NOT NULL,
  resource              TEXT,
  code_challenge        TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  expires_at            INTEGER NOT NULL,
  used_at               INTEGER,
  user_id               TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS mcp_oauth_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL,
  scope      TEXT NOT NULL,
  resource   TEXT,
  expires_at INTEGER NOT NULL,
  rotated_at INTEGER,
  revoked_at INTEGER,
  user_id    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mcp_oauth_codes_expires
  ON mcp_oauth_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_mcp_oauth_rt_client
  ON mcp_oauth_refresh_tokens (client_id);
`;

function ensureMcpOauthCoreSchema(db: { exec: (sql: string) => void }): void {
  db.exec(MCP_OAUTH_CORE_DDL);
}

export function mountBrandMcpSurface(opts: {
  manifest: AppManifest;
  runtime: SqliteRuntime;
  os: BrandOsComposition;
  mcp: McpFacade;
  /** Base URL publique (loopback OK pour preuves locales). */
  publicBaseUrl: () => string;
}): BrandMcpSurface {
  const getDb = () => opts.runtime.getCore();

  // JWT + tables OAuth avant configure — oauthReady / admin status prouvables.
  const jwtSecret = opts.os.store.ensureMcpJwtSecret();
  if (jwtSecret) process.env.MCP_JWT_SECRET = jwtSecret;
  ensureMcpOauthCoreSchema(getDb());

  configureMcpOAuth({
    getWriteDb: () => getDb() as never,
    tableExists: (n) => tableExists(getDb(), n),
    getJwtSecret: () => opts.os.store.ensureMcpJwtSecret(),
    resolvePublicUrl: () => opts.publicBaseUrl(),
  });

  const toolDefs: Array<{
    name: string;
    category: string;
    access: "read" | "write";
    requiredScope: string;
    description?: string;
  }> = [];
  void opts.mcp.listTools().then((listed) => {
    toolDefs.length = 0;
    for (const t of listed.tools || []) {
      toolDefs.push({
        name: String(t.name),
        category: "module",
        access: "read",
        requiredScope: "crm:read",
        description: t.description ? String(t.description) : undefined,
      });
    }
  });

  configureMcpAdmin({
    getDb: () => getDb() as never,
    getWriteDb: () => getDb() as never,
    tableExists: (n) => tableExists(getDb(), n),
    listTools: () => toolDefs,
    mcpOauthReady,
    resolveMcpPublicUrl,
  });

  try {
    ensureMcpAdminSchema();
  } catch {
    /* schema peut déjà exister via migrations platform */
  }

  const productName = opts.manifest.client.productName;
  const oauthRoutes = createMcpOAuthRoutes({
    productName,
    session: {
      getSessionFromContext: async () => null,
      authenticateUser: (username, password) => {
        const auth = opts.os.store.getLocalAuth();
        if (!auth) return null;
        if (auth.authUser === username && auth.authPassword === password) {
          return { id: "owner", username: auth.authUser };
        }
        return null;
      },
      validateCredentials: (username, password) => {
        const auth = opts.os.store.getLocalAuth();
        return Boolean(
          auth &&
            auth.authUser === username &&
            auth.authPassword === password,
        );
      },
      getOwnerId: () => "owner",
    },
  });

  const adminRoutes = createMcpAdminRoutes({
    diagnosticFilenamePrefix: opts.manifest.brandId,
  });
  const requestLogsRoutes = createRequestLogsRoutes();
  const adminSurface = new Hono();
  adminSurface.route("/", adminRoutes);
  adminSurface.route("/", requestLogsRoutes);
  adminSurface.route(
    "/",
    createApiEndpointsRoutes({
      getRegistry: () =>
        buildApiEndpointsRegistry({
          routes: collectHonoRoutes(adminSurface, "/api/v1/admin"),
          source: "brand admin surface (MCP + request-logs + endpoints)",
          openapiUrl: "/api/v1/openapi.json",
        }),
    }),
  );

  const app = new Hono();
  app.route("/", oauthRoutes);
  app.route("/api/v1/admin", adminSurface);

  // Sonde légère hors Hono OAuth (preuves)
  app.get("/api/v1/os/mcp-oauth/status", (c) =>
    c.json({
      ok: true,
      oauthReady: mcpOauthReady(),
      publicUrl: resolveMcpPublicUrl(),
      admin: (() => {
        try {
          return mcpAdminStatus();
        } catch (e) {
          return {
            error: e instanceof Error ? e.message : String(e),
          };
        }
      })(),
    }),
  );

  return {
    app,
    oauthReady: () => mcpOauthReady(),
    publicUrl: () => resolveMcpPublicUrl(),
  };
}

/** Proxy Node http → Hono pour chemins OAuth/admin (+ registre endpoints O5). */
export function mcpSurfaceHandlesPath(pathname: string): boolean {
  return (
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/oauth/") ||
    pathname.startsWith("/api/v1/admin/mcp") ||
    pathname === "/api/v1/admin/endpoints" ||
    pathname === "/api/v1/admin/request-logs" ||
    pathname.startsWith("/api/v1/admin/request-logs/") ||
    pathname === "/api/v1/os/mcp-oauth/status"
  );
}
