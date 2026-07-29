/**
 * Façade / proxy MCP unique — tools cœur + discoverTools modules/plugins.
 * H2.3 : discovery / listage scindés par couche (core / module / plugin).
 * H4   : registry dynamique, namespacing, aliases legacy, policies deny
 *        cross-layer, surface publique sans double exposition.
 *
 * Pas de MCP « produit Creezio » séparé du MCP de l'app.
 */

import { ARCHITECTURE_VERSION } from "@creezio/platform-core";
import { API_V1_PREFIX } from "@creezio/api-kernel";
import { verifyMcpBearer } from "./jwt.js";
import { assertNamespacedToolName, isLegacyAliasName } from "./namespace.js";
import {
  composeToolPolicies,
  denyCrossLayerToolCall,
} from "./policy.js";
import type {
  DiscoverToolsBySpaceFn,
  DiscoverToolsFn,
  McpAuthorizeToolCallFn,
  McpFacadeOptions,
  McpListToolsResult,
  McpPublicSurfaceMode,
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
    /** Override ponctuel de la surface publique. */
    publicSurface?: McpPublicSurfaceMode;
  }): Promise<McpListToolsResult>;
  /** H2 : tools groupés par couche. */
  listToolsBySpace(opts?: {
    bearerToken?: string | null;
    publicSurface?: McpPublicSurfaceMode;
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
  /** H4 — enregistre un tool namespacé (module/plugin ; core réservé). */
  registerTool(tool: McpRegisteredTool): void;
  /** H4 — alias legacy → canonique. */
  registerAlias(alias: string, canonicalName: string): void;
  /** H4 — retire un tool du registre dynamique. */
  unregisterTool(name: string): boolean;
  /** H4 — map alias → canonique. */
  listAliases(): Record<string, string>;
  /** H4 — résout alias → nom canonique. */
  resolveToolName(name: string): string;
};

function emptyBySpace(): McpToolsBySpace {
  return { core: [], module: [], plugin: [] };
}

function coreTools(opts: {
  architectureVersion: string;
  brandId?: string;
  listApiMounts?: () => Array<{ space: string; id: string }>;
  listToolsBySpaceSync?: () => McpToolsBySpace;
  listAliasesSync?: () => Record<string, string>;
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
          note: "Une seule façade MCP = MCP de l'app (proxy unifié H4)",
          toolSpaces: ["core", "module", "plugin"],
          publicSurfaceModes: [
            "canonical",
            "legacy-preferred",
            "both",
          ],
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
    {
      name: "creezio.admin.list_aliases",
      description:
        "Liste les aliases legacy → tools canoniques (anti double exposition)",
      space: "core",
      inputSchema: { type: "object", properties: {} },
      handler: async () => ({
        ok: true,
        content: {
          aliases: opts.listAliasesSync ? opts.listAliasesSync() : {},
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
    ...(t.aliasOf ? { aliasOf: t.aliasOf } : {}),
  };
}

function groupBySpace(tools: McpToolDefinition[]): McpToolsBySpace {
  const out = emptyBySpace();
  for (const t of tools) {
    out[t.space].push(t);
  }
  return out;
}

/**
 * Applique publicSurface : évite de lister à la fois get_panier et
 * module.panier.get quand un alias les relie.
 */
function applyPublicSurface(
  tools: McpRegisteredTool[],
  aliases: Map<string, string>,
  mode: McpPublicSurfaceMode,
): McpToolDefinition[] {
  const canonicalHidden = new Set<string>();
  if (mode === "legacy-preferred") {
    for (const canonical of aliases.values()) {
      canonicalHidden.add(canonical);
    }
  }

  const defs: McpToolDefinition[] = [];

  for (const t of tools) {
    if (mode === "legacy-preferred" && canonicalHidden.has(t.name)) {
      continue;
    }
    defs.push(toDef(t));
  }

  if (mode === "legacy-preferred" || mode === "both") {
    const byName = new Map(tools.map((t) => [t.name, t]));
    for (const [alias, canonical] of aliases) {
      const target = byName.get(canonical);
      if (!target) continue;
      if (defs.some((d) => d.name === alias)) continue;
      defs.push({
        name: alias,
        description: `${target.description} (alias → ${canonical})`,
        space: target.space,
        ...(target.ownerId ? { ownerId: target.ownerId } : {}),
        ...(target.inputSchema ? { inputSchema: target.inputSchema } : {}),
        aliasOf: canonical,
      });
    }
  }

  return defs;
}

export function createMcpFacade(options: McpFacadeOptions = {}): McpFacade {
  let discover: DiscoverToolsFn = options.discoverTools || (async () => []);
  let discoverBySpace: DiscoverToolsBySpaceFn =
    options.discoverToolsBySpace || (async () => ({}));
  const architectureVersion =
    options.architectureVersion ?? ARCHITECTURE_VERSION;
  const enforceNamespaces = options.enforceNamespaces !== false;
  const publicSurfaceDefault: McpPublicSurfaceMode =
    options.publicSurface ?? "legacy-preferred";

  const dynamicTools = new Map<string, McpRegisteredTool>();
  const aliases = new Map<string, string>();

  if (options.aliases) {
    for (const [alias, canonical] of Object.entries(options.aliases)) {
      aliases.set(alias, canonical);
    }
  }

  const authorize: McpAuthorizeToolCallFn = (() => {
    const custom = options.authorizeToolCall;
    const useDefault = options.defaultCrossLayerDeny !== false;
    if (custom && useDefault) {
      return composeToolPolicies(denyCrossLayerToolCall, custom);
    }
    if (custom) return custom;
    if (useDefault) return denyCrossLayerToolCall;
    return async () => ({ allow: true as const });
  })();

  function registerAlias(alias: string, canonicalName: string): void {
    if (!alias || !canonicalName) {
      throw new Error("mcp_alias_invalid: alias et canonical requis");
    }
    if (alias === canonicalName) {
      throw new Error("mcp_alias_invalid: alias = canonical");
    }
    if (!isLegacyAliasName(alias) && enforceNamespaces) {
      // Autoriser aussi un alias namespacé (ex. module.panier.get → autre),
      // mais interdire qu'un alias pointe vers rien de valide plus tard.
    }
    aliases.set(alias, canonicalName);
  }

  function registerTool(tool: McpRegisteredTool): void {
    if (tool.space === "core") {
      throw new Error(
        "mcp_register_core_denied: les tools core sont réservés à la façade",
      );
    }
    if (enforceNamespaces) {
      assertNamespacedToolName(tool.space, tool.name, tool.ownerId);
    }
    dynamicTools.set(tool.name, tool);
  }

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
        out.push({ ...t, space: t.space || space });
      }
    }
    for (const t of dynamicTools.values()) {
      out.push(t);
    }
    return out;
  }

  async function allTools(): Promise<McpRegisteredTool[]> {
    const discovered = await discoveredTools();
    const byName = new Map<string, McpRegisteredTool>();

    const core = coreTools({
      architectureVersion,
      brandId: options.brandId,
      listApiMounts: options.listApiMounts,
      listToolsBySpaceSync: () => cachedBySpace,
      listAliasesSync: () => Object.fromEntries(aliases),
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
      if (enforceNamespaces) {
        try {
          assertNamespacedToolName(t.space, t.name, t.ownerId);
        } catch {
          // Tool non conforme : ignoré (pas de crash discovery).
          continue;
        }
      }
      byName.set(t.name, t);
    }

    const all = [...byName.values()];
    cachedBySpace = groupBySpace(all.map(toDef));
    return all;
  }

  function resolveToolName(name: string): string {
    return aliases.get(name) || name;
  }

  return {
    setDiscoverTools(fn) {
      discover = fn;
    },

    setDiscoverToolsBySpace(fn) {
      discoverBySpace = fn;
    },

    registerTool,
    registerAlias,

    unregisterTool(name) {
      return dynamicTools.delete(name);
    },

    listAliases() {
      return Object.fromEntries(aliases);
    },

    resolveToolName,

    async listTools(opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        throw Object.assign(new Error(a.error), { status: a.status });
      }
      const tools = await allTools();
      const mode = opts?.publicSurface ?? publicSurfaceDefault;
      let defs = applyPublicSurface(tools, aliases, mode);
      if (opts?.space) {
        defs = defs.filter((t) => t.space === opts.space);
      }
      return { tools: defs };
    },

    async listToolsBySpace(opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        throw Object.assign(new Error(a.error), { status: a.status });
      }
      const tools = await allTools();
      const mode = opts?.publicSurface ?? publicSurfaceDefault;
      return groupBySpace(applyPublicSurface(tools, aliases, mode));
    },

    async callTool(name, args = {}, opts) {
      const a = await auth(opts?.bearerToken);
      if (!a.ok) {
        return { ok: false, error: a.error };
      }
      const canonicalName = resolveToolName(name);
      const isAlias = canonicalName !== name;
      const tools = await allTools();
      const tool = tools.find((t) => t.name === canonicalName);
      if (!tool) return { ok: false, error: "tool_not_found" };

      const decision = await authorize({
        name,
        canonicalName,
        space: tool.space,
        ownerId: tool.ownerId,
        subject: a.subject,
        args,
        isAlias,
      });
      if (!decision.allow) {
        return { ok: false, error: decision.reason };
      }

      return tool.handler(args);
    },
  };
}
