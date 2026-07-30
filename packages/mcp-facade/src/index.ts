/**
 * @creezio/mcp-facade — MCP d'app unique (H1.2 / discovery H2.3 / proxy H4 / M9).
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
export type {
  DecidePluginAccessFn,
  PluginAclActorResolver,
  PluginAclPolicyResolver,
} from "./policy.js";
export {
  composeToolPolicies,
  createDenyUnauthorizedPluginToolPolicy,
  denyCrossLayerToolCall,
} from "./policy.js";

export type {
  CreezioCoreMcpToolName,
  CreateCoreMcpToolsOptions,
} from "./core-tools.js";
export {
  CREEZIO_CORE_MCP_TOOL_NAMES,
  createCoreMcpTools,
} from "./core-tools.js";

export type {
  McpFacadeMode,
  McpFacadeRole,
  McpProductExecutor,
  McpUpstreamRef,
} from "./runtime.js";
export {
  MCP_PRODUCT_EXECUTOR,
  resolveMcpFacadeRole,
} from "./runtime.js";

export type { WrapMcpFacadeWithHonoProxyOptions } from "./hono-proxy.js";
export {
  __mcpHonoProxyTest,
  wrapMcpFacadeWithHonoProxy,
} from "./hono-proxy.js";
