/**
 * @creezio/mcp-facade — MCP d'app unique (H1.2 / discovery H2.3 / proxy H4).
 */

export type {
  DiscoverToolsBySpaceFn,
  DiscoverToolsFn,
  McpAuthResult,
  McpAuthorizeContext,
  McpAuthorizeToolCallFn,
  McpFacadeOptions,
  McpListToolsResult,
  McpPublicSurfaceMode,
  McpRegisteredTool,
  McpToolCallResult,
  McpToolDefinition,
  McpToolHandler,
  McpToolPolicyDecision,
  McpToolsBySpace,
  McpToolSpace,
} from "./types.js";

export type { McpFacade } from "./facade.js";
export { createMcpFacade } from "./facade.js";
export { signMcpJwt, verifyMcpBearer } from "./jwt.js";
export {
  assertNamespacedToolName,
  isLegacyAliasName,
  parseNamespacedToolName,
} from "./namespace.js";
export type { ParsedToolName } from "./namespace.js";
export {
  composeToolPolicies,
  denyCrossLayerToolCall,
} from "./policy.js";
