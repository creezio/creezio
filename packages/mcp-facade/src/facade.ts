/**
 * Façade MCP unique — tools cœur + discoverTools modules/plugins.
 * Pas de MCP « produit Creezio » séparé du MCP de l'app.
 */

import { ARCHITECTURE_VERSION } from "@creezio/platform-core";
import { API_V1_PREFIX } from "@creezio/api-kernel";
import { verifyMcpBearer } from "./jwt.js";
import type {
  DiscoverToolsFn,
  McpFacadeOptions,
  McpListToolsResult,
  McpRegisteredTool,
  McpToolCallResult,
  McpToolDefinition,
} from "./types.js";

export type McpFacade = {
  listTools(opts?: { bearerToken?: string | null }): Promise<McpListToolsResult>;
  callTool(
    name: string,
    args?: Record<string, unknown>,
    opts?: { bearerToken?: string | null },
  ): Promise<McpToolCallResult>;
  /** Réenregistre / remplace le discoverer. */
  setDiscoverTools(fn: DiscoverToolsFn): void;
};

function coreTools(opts: {
  architectureVersion: string;
  brandId?: string;
  listApiMounts?: () => Array<{ space: string; id: string }>;
}): McpRegisteredTool[] {
  return [
    {
      name: "creezio.health",
      description: "Ping santé façade MCP / API cœur",
      space: "core",
      inputSchema: { type: "object", properties: {} },
      handler: async () => ({
        ok: true,
        content: { ok: true, brandId: opts.brandId ?? null },
      }),
    },
    {
      name: "creezio.architecture",
      description: "Version architecture + préfixe API unique",
      space: "core",
      inputSchema: { type: "object", properties: {} },
      handler: async () => ({
        ok: true,
        content: {
          architectureVersion: opts.architectureVersion,
          apiPrefix: API_V1_PREFIX,
          note: "Une seule façade MCP = MCP de l'app (pas de produit MCP séparé)",
        },
      }),
    },
    {
      name: "creezio.admin.list_mounts",
      description: "Liste les montages API modules/plugins connus",
      space: "core",
      inputSchema: { type: "object", properties: {} },
      handler: async () => ({
        ok: true,
        content: {
          mounts: opts.listApiMounts ? opts.listApiMounts() : [],
        },
      }),
    },
  ];
}

function toDef(t: McpRegisteredTool): McpToolDefinition {
  return {
    name: t.name,
    description: t.description,
    space: t.space,
    ...(t.ownerId ? { ownerId: t.ownerId } : {}),
    ...(t.inputSchema ? { inputSchema: t.inputSchema } : {}),
  };
}

export function createMcpFacade(options: McpFacadeOptions = {}): McpFacade {
  let discover: DiscoverToolsFn = options.discoverTools || (async () => []);
  const architectureVersion =
    options.architectureVersion ?? ARCHITECTURE_VERSION;

  async function auth(bearer?: string | null) {
    return verifyMcpBearer(bearer, options.jwtSecret, {
      allowUnauthenticated: options.allowUnauthenticated,
    });
  }

  async function allTools(): Promise<McpRegisteredTool[]> {
    const discovered = await discover();
    const core = coreTools({
      architectureVersion,
      brandId: options.brandId,
      listApiMounts: options.listApiMounts,
    });
    const byName = new Map<string, McpRegisteredTool>();
    for (const t of core) byName.set(t.name, t);
    for (const t of discovered) {
      if (byName.has(t.name)) {
        // Les tools cœur gagnent ; modules/plugins doivent préfixer leur id.
        continue;
      }
      byName.set(t.name, t);
    }
    return [...byName.values()];
  }

  return {
    setDiscoverTools(fn) {
      discover = fn;
    },

    async listTools(opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        throw Object.assign(new Error(a.error), { status: a.status });
      }
      const tools = await allTools();
      return { tools: tools.map(toDef) };
    },

    async callTool(name, args = {}, opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        return { ok: false, error: a.error };
      }
      const tools = await allTools();
      const tool = tools.find((t) => t.name === name);
      if (!tool) return { ok: false, error: "tool_not_found" };
      return tool.handler(args);
    },
  };
}
