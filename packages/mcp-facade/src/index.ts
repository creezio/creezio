/**
 * @creezio/mcp-facade — MCP d'app unique (Phase H1.2).
 */

export type {
  DiscoverToolsFn,
  McpAuthResult,
  McpFacadeOptions,
  McpListToolsResult,
  McpRegisteredTool,
  McpToolCallResult,
  McpToolDefinition,
  McpToolHandler,
  McpToolSpace,
} from "./types.js";

export type { McpFacade } from "./facade.js";
export { createMcpFacade } from "./facade.js";
export { signMcpJwt, verifyMcpBearer } from "./jwt.js";
