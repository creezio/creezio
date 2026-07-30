/**
 * MCP admin — policies, clients OAuth, diagnostics, routes Hono (N6).
 */

export type {
  McpAdminAdapters,
  McpAdminSqliteDatabase,
  McpAdminSqliteStatement,
  McpRequestLogEntry,
  McpToolDefinition,
} from "./types.js";

export {
  configureMcpAdmin,
  getMcpAdminAdapters,
  resetMcpAdminAdaptersForTests,
} from "./adapters.js";

export type {
  McpToolPolicy,
  McpAdminClient,
} from "./mcp-admin.js";

export {
  ensureMcpAdminSchema,
  listMcpToolPolicies,
  getMcpToolPolicy,
  updateMcpToolPolicy,
  listMcpClients,
  setMcpClientEnabled,
  revokeMcpClient,
  rotateMcpClientSecret,
  clientCanAuthenticate,
  touchMcpClient,
  mcpAdminStatus,
  mcpDiagnostics,
  mcpMetrics,
  auditMcpAdmin,
  listMcpAuditLogs,
  pruneMcpAuditLogs,
  exportMcpDiagnostics,
} from "./mcp-admin.js";

export type { CreateMcpAdminRoutesOptions } from "./http-routes.js";
export { createMcpAdminRoutes } from "./http-routes.js";
