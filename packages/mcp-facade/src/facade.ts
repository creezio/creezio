/**
 * Façade MCP unique — tools cœur + discoverTools modules/plugins.
 * H2.3 : discovery / listage scindés par couche (core / module / plugin).
 * Pas de MCP « produit Creezio » séparé du MCP de l'app.
 */

import { ARCHITECTURE_VERSION } from "@creezio/platform-core";
import { API_V1_PREFIX } from "@creezio/api-kernel";
import { verifyMcpBearer } from "./jwt.js";
import type {
  DiscoverToolsBySpaceFn,
  DiscoverToolsFn,
  McpFacadeOptions,
  McpListToolsResult,
  McpRegisteredTool,
  McpToolCallResult,
  McpToolDefinition,
  McpToolsBySpace,
  McpToolSpace,
} from "./types.js";

export type McpFacade = {
  listTools(opts?: {
    bearerToken?: string | null;
    /** Filtre H2 — une seule couche. */
    space?: McpToolSpace;
  }): Promise<McpListToolsResult>;
  /** H2 : tools groupés par couche. */
  listToolsBySpace(opts?: {
    bearerToken?: string | null;
  }): Promise<McpToolsBySpace>;
  callTool(
    name: string,
    args?: Record<string, unknown>,
    opts?: { bearerToken?: string | null },
  ): Promise<McpToolCallResult>;
  /** Réenregistre / remplace le discoverer plat. */
  setDiscoverTools(fn: DiscoverToolsFn): void;
  /** Réenregistre le discoverer scindé (H2). */
  setDiscoverToolsBySpace(fn: DiscoverToolsBySpaceFn): void;
};

function emptyBySpace(): McpToolsBySpace {
  return { core: [], module: [], plugin: [] };
}

function coreTools(opts: {
  architectureVersion: string;
  brandId?: string;
  listApiMounts?: () => Array<{ space: string; id: string }>;
  listToolsBySpaceSync?: () => McpToolsBySpace;
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
          toolSpaces: ["core", "module", "plugin"],
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
    {
      name: "creezio.admin.list_tools_by_space",
      description:
        "Liste les tools MCP groupés par couche (core / module / plugin)",
      space: "core",
      inputSchema: { type: "object", properties: {} },
      handler: async () => ({
        ok: true,
        content: {
          bySpace: opts.listToolsBySpaceSync
            ? opts.listToolsBySpaceSync()
            : emptyBySpace(),
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

function groupBySpace(tools: McpRegisteredTool[]): McpToolsBySpace {
  const out = emptyBySpace();
  for (const t of tools) {
    out[t.space].push(toDef(t));
  }
  return out;
}

export function createMcpFacade(options: McpFacadeOptions = {}): McpFacade {
  let discover: DiscoverToolsFn = options.discoverTools || (async () => []);
  let discoverBySpace: DiscoverToolsBySpaceFn =
    options.discoverToolsBySpace || (async () => ({}));
  const architectureVersion =
    options.architectureVersion ?? ARCHITECTURE_VERSION;

  async function auth(bearer?: string | null) {
    return verifyMcpBearer(bearer, options.jwtSecret, {
      allowUnauthenticated: options.allowUnauthenticated,
    });
  }

  async function discoveredTools(): Promise<McpRegisteredTool[]> {
    const flat = await discover();
    const bySpace = await discoverBySpace();
    const out: McpRegisteredTool[] = [...flat];
    for (const space of ["module", "plugin"] as const) {
      for (const t of bySpace[space] || []) {
        // Force space coherence si le discoverer se trompe.
        out.push({ ...t, space: t.space || space });
      }
    }
    return out;
  }

  async function allTools(): Promise<McpRegisteredTool[]> {
    const discovered = await discoveredTools();
    const byName = new Map<string, McpRegisteredTool>();

    // Placeholders pour list_tools_by_space (rempli après merge)
    const core = coreTools({
      architectureVersion,
      brandId: options.brandId,
      listApiMounts: options.listApiMounts,
      listToolsBySpaceSync: () => {
        // Snapshot synchrone des tools déjà dans byName hors ce tool lui-même
        // — remplacé après construction complète via closure mutable.
        return cachedBySpace;
      },
    });

    let cachedBySpace = emptyBySpace();

    for (const t of core) byName.set(t.name, t);
    for (const t of discovered) {
      if (byName.has(t.name)) {
        // Les tools cœur gagnent ; modules/plugins doivent préfixer leur id.
        continue;
      }
      if (t.space === "core") {
        // Interdit : un discoverer ne peut pas injecter un tool core.
        continue;
      }
      byName.set(t.name, t);
    }

    const all = [...byName.values()];
    cachedBySpace = groupBySpace(all);
    return all;
  }

  return {
    setDiscoverTools(fn) {
      discover = fn;
    },

    setDiscoverToolsBySpace(fn) {
      discoverBySpace = fn;
    },

    async listTools(opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        throw Object.assign(new Error(a.error), { status: a.status });
      }
      const tools = await allTools();
      const filtered = opts?.space
        ? tools.filter((t) => t.space === opts.space)
        : tools;
      return { tools: filtered.map(toDef) };
    },

    async listToolsBySpace(opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        throw Object.assign(new Error(a.error), { status: a.status });
      }
      return groupBySpace(await allTools());
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
