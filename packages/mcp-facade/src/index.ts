/**
 * @creezio/mcp-facade — MCP d'app unique (Phase H1.2 / discovery H2.3).
 */

export type {
  DiscoverToolsBySpaceFn,
  DiscoverToolsFn,
  McpAuthResult,
  McpFacadeOptions,
  McpListToolsResult,
  McpRegisteredTool,
  McpToolCallResult,
  McpToolDefinition,
  McpToolHandler,
  McpToolsBySpace,
  McpToolSpace,
} from "./types.js";

export type { McpFacade } from "./facade.js";
export { createMcpFacade } from "./facade.js";
export { signMcpJwt, verifyMcpBearer } from "./jwt.js";
