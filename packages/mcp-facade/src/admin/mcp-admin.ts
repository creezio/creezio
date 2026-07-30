import { createHash, randomBytes } from "node:crypto";
import { getMcpAdminAdapters } from "./adapters.js";
import type { McpToolDefinition } from "./types.js";

export type { McpToolDefinition } from "./types.js";

function getDb() {
  return getMcpAdminAdapters().getDb();
}
function getWriteDb() {
  return getMcpAdminAdapters().getWriteDb();
}
function tableExists(name: string) {
  return getMcpAdminAdapters().tableExists(name);
}
function MCP_TOOL_REGISTRY(): McpToolDefinition[] {
  return getMcpAdminAdapters().listTools();
}
function mcpOauthReady() {
  return getMcpAdminAdapters().mcpOauthReady();
}
function resolveMcpPublicUrl() {
  return getMcpAdminAdapters().resolveMcpPublicUrl();
}
function listRequestLogs(opts: { source: string; limit: number }) {
  const fn = getMcpAdminAdapters().listRequestLogs;
  return fn ? fn(opts) : { logs: [] as Array<{ status: number; durationMs: number; detail: Record<string, unknown> }> };
}

let schemaEnsured = false;

function hasColumn(table: string, column: string): boolean {
  if (!tableExists(table)) return false;
  return (
    getDb()
      .prepare(`PRAGMA table_info("${table.replaceAll('"', '""')}")`)
      .all() as Array<{ name: string }>
  ).some((item) => item.name === column);
}

export function ensureMcpAdminSchema(): void {
  if (schemaEnsured) return;
  const db = getWriteDb();
  if (tableExists("mcp_oauth_clients")) {
    if (!hasColumn("mcp_oauth_clients", "enabled")) {
      db.exec(`ALTER TABLE mcp_oauth_clients ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1`);
    }
    if (!hasColumn("mcp_oauth_clients", "revoked_at")) {
      db.exec(`ALTER TABLE mcp_oauth_clients ADD COLUMN revoked_at TEXT`);
    }
    if (!hasColumn("mcp_oauth_clients", "last_used_at")) {
      db.exec(`ALTER TABLE mcp_oauth_clients ADD COLUMN last_used_at TEXT`);
    }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_tool_policies (
      tool_name TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      allowed_roles TEXT NOT NULL DEFAULT 'owner,collaborator',
      allowed_scopes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS mcp_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      event TEXT NOT NULL,
      actor TEXT,
      client_id TEXT,
      tool_name TEXT,
      outcome TEXT NOT NULL DEFAULT 'ok',
      detail_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_audit_created ON mcp_audit_logs(created_at);
  `);
  const insert = db.prepare(
    `INSERT OR IGNORE INTO mcp_tool_policies
       (tool_name, enabled, allowed_roles, allowed_scopes)
     VALUES (?, 1, ?, ?)`,
  );
  const seedFn = () => {
    for (const tool of MCP_TOOL_REGISTRY()) {
      const roles = (tool.defaultRoles || ["owner", "collaborator"]).join(",");
      insert.run(tool.name, roles, tool.requiredScope);
    }
  };
  if (db.transaction) db.transaction(seedFn)();
  else seedFn();
  pruneMcpAuditLogs();
  schemaEnsured = true;
}

export type McpToolPolicy = McpToolDefinition & {
  enabled: boolean;
  allowedRoles: string[];
  allowedScopes: string[];
  updatedAt: string | null;
};

export function listMcpToolPolicies(): McpToolPolicy[] {
  ensureMcpAdminSchema();
  const rows = getDb()
    .prepare(
      `SELECT tool_name, enabled, allowed_roles, allowed_scopes, updated_at
       FROM mcp_tool_policies`,
    )
    .all() as Array<{
    tool_name: string;
    enabled: number;
    allowed_roles: string;
    allowed_scopes: string;
    updated_at: string;
  }>;
  const policy = new Map(rows.map((row) => [row.tool_name, row]));
  return MCP_TOOL_REGISTRY().map((tool) => {
    const row = policy.get(tool.name);
    return {
      ...tool,
      enabled: row?.enabled !== 0,
      allowedRoles: (row?.allowed_roles || "owner,collaborator").split(",").filter(Boolean),
      allowedScopes: (row?.allowed_scopes || tool.requiredScope).split(/[\s,]+/).filter(Boolean),
      updatedAt: row?.updated_at || null,
    };
  });
}

export function getMcpToolPolicy(name: string): McpToolPolicy | null {
  return listMcpToolPolicies().find((tool) => tool.name === name) || null;
}

export function updateMcpToolPolicy(
  name: string,
  input: { enabled?: boolean; allowedRoles?: string[]; allowedScopes?: string[] },
): McpToolPolicy | null {
  ensureMcpAdminSchema();
  if (!MCP_TOOL_REGISTRY().some((tool) => tool.name === name)) return null;
  const current = getMcpToolPolicy(name)!;
  const roles = (input.allowedRoles || current.allowedRoles).filter((role) =>
    ["owner", "collaborator"].includes(role),
  );
  const scopes = (input.allowedScopes || current.allowedScopes).filter((scope) =>
    ["crm", "crm:read", "crm:write", "full"].includes(scope),
  );
  getWriteDb()
    .prepare(
      `UPDATE mcp_tool_policies
       SET enabled = ?, allowed_roles = ?, allowed_scopes = ?, updated_at = datetime('now')
       WHERE tool_name = ?`,
    )
    .run(input.enabled ?? current.enabled ? 1 : 0, roles.join(","), scopes.join(","), name);
  auditMcpAdmin("tool_policy_updated", {
    toolName: name,
    detail: { enabled: input.enabled ?? current.enabled, roles, scopes },
  });
  return getMcpToolPolicy(name);
}

export type McpAdminClient = {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  scope: string | null;
  created_at: string;
  enabled: boolean;
  revoked_at: string | null;
  last_used_at: string | null;
  active_refresh_tokens: number;
};

export function listMcpClients(): McpAdminClient[] {
  ensureMcpAdminSchema();
  if (!mcpOauthReady()) return [];
  const rows = getDb()
    .prepare(
      `SELECT c.client_id, c.client_name, c.redirect_uris,
              c.token_endpoint_auth_method, c.scope, c.created_at,
              c.enabled, c.revoked_at, c.last_used_at,
              SUM(CASE WHEN r.revoked_at IS NULL AND r.expires_at > unixepoch() THEN 1 ELSE 0 END)
                AS active_refresh_tokens
       FROM mcp_oauth_clients c
       LEFT JOIN mcp_oauth_refresh_tokens r ON r.client_id = c.client_id
       GROUP BY c.client_id
       ORDER BY c.created_at DESC`,
    )
    .all() as Array<Omit<McpAdminClient, "redirect_uris" | "enabled"> & {
    redirect_uris: string;
    enabled: number;
  }>;
  return rows.map((row) => ({
    ...row,
    enabled: row.enabled !== 0 && !row.revoked_at,
    redirect_uris: safeStringArray(row.redirect_uris),
    active_refresh_tokens: Number(row.active_refresh_tokens || 0),
  }));
}

function safeStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function setMcpClientEnabled(clientId: string, enabled: boolean): boolean {
  ensureMcpAdminSchema();
  const result = getWriteDb()
    .prepare(`UPDATE mcp_oauth_clients SET enabled = ? WHERE client_id = ? AND revoked_at IS NULL`)
    .run(enabled ? 1 : 0, clientId);
  if (result.changes) {
    if (!enabled) revokeClientTokens(clientId);
    auditMcpAdmin(enabled ? "client_enabled" : "client_disabled", { clientId });
  }
  return result.changes > 0;
}

export function revokeMcpClient(clientId: string): boolean {
  ensureMcpAdminSchema();
  const result = getWriteDb()
    .prepare(
      `UPDATE mcp_oauth_clients
       SET enabled = 0, revoked_at = COALESCE(revoked_at, datetime('now'))
       WHERE client_id = ?`,
    )
    .run(clientId);
  revokeClientTokens(clientId);
  if (result.changes) auditMcpAdmin("client_revoked", { clientId });
  return result.changes > 0;
}

export function rotateMcpClientSecret(
  clientId: string,
): { clientSecret: string } | null {
  ensureMcpAdminSchema();
  const client = getDb()
    .prepare(
      `SELECT token_endpoint_auth_method, revoked_at
       FROM mcp_oauth_clients WHERE client_id = ?`,
    )
    .get(clientId) as
    | { token_endpoint_auth_method: string; revoked_at: string | null }
    | undefined;
  if (!client || client.revoked_at || client.token_endpoint_auth_method === "none") return null;
  const clientSecret = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(clientSecret, "utf8").digest("hex");
  getWriteDb()
    .prepare(`UPDATE mcp_oauth_clients SET client_secret_hash = ? WHERE client_id = ?`)
    .run(hash, clientId);
  revokeClientTokens(clientId);
  auditMcpAdmin("client_secret_rotated", { clientId });
  return { clientSecret };
}

function revokeClientTokens(clientId: string): void {
  getWriteDb()
    .prepare(
      `UPDATE mcp_oauth_refresh_tokens
       SET revoked_at = COALESCE(revoked_at, unixepoch())
       WHERE client_id = ?`,
    )
    .run(clientId);
}

export function clientCanAuthenticate(clientId: string): boolean {
  ensureMcpAdminSchema();
  const row = getDb()
    .prepare(
      `SELECT enabled, revoked_at FROM mcp_oauth_clients WHERE client_id = ?`,
    )
    .get(clientId) as { enabled: number; revoked_at: string | null } | undefined;
  return Boolean(row && row.enabled !== 0 && !row.revoked_at);
}

export function touchMcpClient(clientId: string): void {
  ensureMcpAdminSchema();
  getWriteDb()
    .prepare(`UPDATE mcp_oauth_clients SET last_used_at = datetime('now') WHERE client_id = ?`)
    .run(clientId);
}

export function mcpAdminStatus() {
  const publicUrl = resolveMcpPublicUrl();
  const clients = listMcpClients();
  const tools = listMcpToolPolicies();
  return {
    ready: mcpOauthReady(),
    publicUrl,
    mcpUrl: publicUrl ? `${publicUrl}/mcp` : null,
    oauthReady: mcpOauthReady(),
    jwtConfigured: Boolean(process.env.MCP_JWT_SECRET),
    toolCount: tools.length,
    enabledToolCount: tools.filter((tool) => tool.enabled).length,
    clientCount: clients.length,
    enabledClientCount: clients.filter((client) => client.enabled).length,
  };
}

export function mcpDiagnostics() {
  const status = mcpAdminStatus();
  const checks = [
    { id: "oauth_schema", ok: status.oauthReady, message: "Tables OAuth MCP" },
    { id: "jwt_secret", ok: status.jwtConfigured, message: "Secret JWT MCP configuré" },
    { id: "public_url", ok: Boolean(status.publicUrl), message: "URL publique / tunnel" },
    { id: "tools", ok: status.enabledToolCount > 0, message: "Au moins un tool actif" },
  ];
  return { status, checks, healthy: checks.every((check) => check.ok) };
}

export function mcpMetrics() {
  const logs = listRequestLogs({ source: "mcp", limit: 1000 }).logs;
  const errors = logs.filter((log) => log.status >= 400 || log.detail.ok === false);
  const durations = logs.map((log) => log.durationMs).sort((a, b) => a - b);
  return {
    window: "process",
    requests: logs.length,
    errors: errors.length,
    errorRate: logs.length ? errors.length / logs.length : 0,
    averageDurationMs: logs.length
      ? Math.round(logs.reduce((sum, log) => sum + log.durationMs, 0) / logs.length)
      : 0,
    p95DurationMs: durations.length
      ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
      : 0,
    byTool: Object.fromEntries(
      MCP_TOOL_REGISTRY().map((tool) => [
        tool.name,
        logs.filter((log) => log.detail.tool === tool.name).length,
      ]),
    ),
  };
}

export function auditMcpAdmin(
  event: string,
  options: {
    actor?: string | null;
    clientId?: string | null;
    toolName?: string | null;
    outcome?: string;
    detail?: unknown;
  } = {},
): void {
  ensureMcpAdminSchema();
  getWriteDb()
    .prepare(
      `INSERT INTO mcp_audit_logs
       (event, actor, client_id, tool_name, outcome, detail_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      event,
      options.actor || null,
      options.clientId || null,
      options.toolName || null,
      options.outcome || "ok",
      options.detail == null ? null : JSON.stringify(options.detail),
    );
}

export function listMcpAuditLogs(limit = 200) {
  ensureMcpAdminSchema();
  return getDb()
    .prepare(
      `SELECT id, created_at, event, actor, client_id, tool_name, outcome, detail_json
       FROM mcp_audit_logs ORDER BY id DESC LIMIT ?`,
    )
    .all(Math.min(1000, Math.max(1, limit)));
}

export function pruneMcpAuditLogs(
  retentionDays = Number(process.env.MCP_AUDIT_RETENTION_DAYS || 30),
): number {
  if (!tableExists("mcp_audit_logs")) return 0;
  const days = Number.isFinite(retentionDays)
    ? Math.min(365, Math.max(1, Math.floor(retentionDays)))
    : 30;
  return getWriteDb()
    .prepare(`DELETE FROM mcp_audit_logs WHERE created_at < datetime('now', ?)`)
    .run(`-${days} days`).changes;
}

export function exportMcpDiagnostics() {
  const clients = listMcpClients().map((client) => ({
    idPrefix: client.client_id.slice(0, 12),
    name: client.client_name,
    redirectHosts: client.redirect_uris.map((uri) => {
      try {
        return new URL(uri).host;
      } catch {
        return "invalid";
      }
    }),
    scope: client.scope,
    enabled: client.enabled,
    revoked: Boolean(client.revoked_at),
    lastUsedAt: client.last_used_at,
  }));
  return {
    generatedAt: new Date().toISOString(),
    diagnostics: mcpDiagnostics(),
    metrics: mcpMetrics(),
    tools: listMcpToolPolicies().map((tool) => ({
      name: tool.name,
      enabled: tool.enabled,
      requiredScope: tool.requiredScope,
      allowedRoles: tool.allowedRoles,
      allowedScopes: tool.allowedScopes,
    })),
    clients,
    auditRetentionDays: Number(process.env.MCP_AUDIT_RETENTION_DAYS || 30),
    configuration: {
      corsConfigured: Boolean(process.env.MCP_CORS_ORIGINS?.trim()),
      publicUrlConfigured: Boolean(resolveMcpPublicUrl()),
      jwtConfigured: Boolean(process.env.MCP_JWT_SECRET),
    },
  };
}
