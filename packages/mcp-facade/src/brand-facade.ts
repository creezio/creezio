/**
 * DX factory marque — remplace le boilerplate create*BrandMcp ×3.
 * La marque ne fournit que api + aliases + discoverModuleTools.
 */
import type { ApiKernel } from "@creezio/api-kernel";
import { createMcpFacade, type McpFacade } from "./facade.js";
import type {
  McpFacadeOptions,
  McpPublicSurfaceMode,
  McpRegisteredTool,
} from "./types.js";

export type CreateBrandMcpFacadeOptions = Omit<
  McpFacadeOptions,
  "discoverToolsBySpace" | "aliases"
> & {
  api: ApiKernel;
  /** Aliases legacy métier (surface publique). */
  aliases: Record<string, string>;
  /** Discovery tools module.* (factory mcp-tools marque). */
  discoverModuleTools: (
    api: ApiKernel,
  ) => McpRegisteredTool[] | Promise<McpRegisteredTool[]>;
  /** Discovery plugins (défaut : []). */
  discoverPluginTools?: (
    api: ApiKernel,
  ) => McpRegisteredTool[] | Promise<McpRegisteredTool[]>;
  /** Surface publique (défaut legacy-preferred — compat clients MCP externes). */
  publicSurface?: McpPublicSurfaceMode;
  /** Aliases additionnels fusionnés. */
  extraAliases?: Record<string, string>;
};

/**
 * Une seule factory listTools/callTool pour Electron / Hono / assistant.
 */
export function createBrandMcpFacade(
  options: CreateBrandMcpFacadeOptions,
): McpFacade {
  const {
    api,
    aliases,
    discoverModuleTools,
    discoverPluginTools,
    extraAliases,
    publicSurface = "legacy-preferred",
    ...rest
  } = options;

  return createMcpFacade({
    allowUnauthenticated: true,
    enforceNamespaces: true,
    publicSurface,
    defaultCrossLayerDeny: true,
    listApiMounts: () => api.listMounts(),
    ...rest,
    aliases: { ...aliases, ...(extraAliases || {}) },
    discoverToolsBySpace: async () => ({
      module: await discoverModuleTools(api),
      plugin: discoverPluginTools
        ? await discoverPluginTools(api)
        : [],
    }),
  });
}
