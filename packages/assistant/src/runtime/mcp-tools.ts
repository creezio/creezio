/**
 * Bridge assistant ↔ façade MCP marque (O4r).
 * Surface métier = listTools / callTool — pas BrandTools.executeTool.
 */
import { assistantMcp } from "../brand/registry.js";
import type {
  AssistantMcpCallResult,
  AssistantMcpToolDef,
  AssistantToolDefinition,
} from "../brand/types.js";

let cache: { at: number; tools: AssistantMcpToolDef[]; names: Set<string> } = {
  at: 0,
  tools: [],
  names: new Set(),
};

function ttlMs(): number {
  return assistantMcp()?.listCacheTtlMs ?? 30_000;
}

export function mcpToolDefToAssistant(
  t: AssistantMcpToolDef,
): AssistantToolDefinition {
  const schema =
    t.inputSchema && typeof t.inputSchema === "object"
      ? t.inputSchema
      : { type: "object", properties: {} };
  const parameters =
    "type" in schema || "properties" in schema
      ? schema
      : { type: "object", properties: schema as Record<string, unknown> };
  return {
    type: "function",
    function: {
      name: t.name,
      description: t.description || t.name,
      parameters: parameters as Record<string, unknown>,
    },
  };
}

export async function refreshMcpToolCache(): Promise<void> {
  const mcp = assistantMcp();
  if (!mcp?.listTools) {
    cache = { at: Date.now(), tools: [], names: new Set() };
    return;
  }
  const bearer = mcp.bearerToken ? await mcp.bearerToken() : null;
  const tools = await mcp.listTools({ bearerToken: bearer });
  const list = Array.isArray(tools) ? tools : [];
  cache = {
    at: Date.now(),
    tools: list,
    names: new Set(list.map((t) => t.name)),
  };
}

export function cachedMcpToolDefinitions(): AssistantToolDefinition[] {
  return cache.tools.map(mcpToolDefToAssistant);
}

export function cachedMcpToolNames(): Set<string> {
  return cache.names;
}

export async function ensureMcpToolCache(): Promise<void> {
  if (Date.now() - cache.at < ttlMs() && cache.at > 0) return;
  await refreshMcpToolCache();
}

export function looksLikeMcpToolName(name: string): boolean {
  return (
    name.startsWith("module.") ||
    name.startsWith("plugin.") ||
    name.startsWith("creezio.") ||
    name.startsWith("core.")
  );
}

/** true si le nom est dans le cache discovery ou namespacé MCP. */
export function mcpOwnsToolName(name: string): boolean {
  if (!assistantMcp()?.callTool) return false;
  if (cache.names.has(name)) return true;
  return looksLikeMcpToolName(name);
}

export async function callAssistantMcpTool(
  name: string,
  args: Record<string, unknown>,
  ctx: Record<string, unknown>,
): Promise<AssistantMcpCallResult | null> {
  const mcp = assistantMcp();
  if (!mcp?.callTool) return null;
  await ensureMcpToolCache();
  if (!mcpOwnsToolName(name)) return null;
  const bearer = mcp.bearerToken ? await mcp.bearerToken() : null;
  try {
    const result = await mcp.callTool(name, args, {
      bearerToken: bearer,
      ctx,
    });
    // tool_not_found → laisser tomber vers « outil inconnu » (pas d’erreur opaque)
    if (
      result &&
      result.ok === false &&
      result.error === "tool_not_found" &&
      !cache.names.has(name)
    ) {
      return null;
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function summarizeMcpResult(
  name: string,
  result: AssistantMcpCallResult,
): string {
  if (typeof result.uiSummary === "string" && result.uiSummary) {
    return result.uiSummary;
  }
  if (!result.ok) return result.error || `échec ${name}`;
  const c = result.content;
  if (c && typeof c === "object" && !Array.isArray(c)) {
    const o = c as Record<string, unknown>;
    if (typeof o.uiSummary === "string") return o.uiSummary;
    if (o.commande_id != null) return `panier #${o.commande_id}`;
    if (Array.isArray(o.lignes)) return `panier · ${o.lignes.length} ligne(s)`;
  }
  return `mcp ${name}`;
}

/** Helper marque : adapter une McpFacade kit → AssistantMcpConfig. */
export function mcpFacadeToAssistantConfig(facade: {
  listTools: (opts?: {
    bearerToken?: string | null;
    space?: "core" | "module" | "plugin";
    publicSurface?: "legacy-preferred" | "canonical" | "both";
  }) => Promise<{ tools: Array<{
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    space?: string;
  }> }>;
  callTool: (
    name: string,
    args?: Record<string, unknown>,
    opts?: { bearerToken?: string | null },
  ) => Promise<AssistantMcpCallResult>;
  listAliases?: () => Record<string, string>;
}): import("../brand/types.js").AssistantMcpConfig {
  return {
    listCacheTtlMs: 30_000,
    async listTools(opts) {
      // Surface canonique : LLM voit module.panier.* (pas double legacy)
      const res = await facade.listTools({
        bearerToken: opts?.bearerToken,
        publicSurface: "canonical",
      });
      const tools = (res.tools || []).filter(
        (t) => t.space === "module" || t.space === "plugin" || !t.space,
      );
      // Inclure aussi les alias legacy utiles (add_to_panier) en mode both pour
      // rétrocompat prompts — mais publicSurface canonical les exclut.
      // On expose uniquement module/plugin.
      const aliases = facade.listAliases?.() || {};
      const out: AssistantMcpToolDef[] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      // Ajouter alias → même schema que canonique (LLM peut encore dire add_to_panier)
      const byName = new Map(tools.map((t) => [t.name, t]));
      for (const [alias, canonical] of Object.entries(aliases)) {
        const target = byName.get(canonical);
        if (!target) continue;
        if (out.some((t) => t.name === alias)) continue;
        // Ne pas ré-exposer add_to_cart (mort) ; alias MCP legacy OK
        if (alias === "add_to_cart") continue;
        out.push({
          name: alias,
          description: `${target.description} (alias → ${canonical})`,
          inputSchema: target.inputSchema,
        });
      }
      return out;
    },
    async callTool(name, args, opts) {
      return facade.callTool(name, args, {
        bearerToken: opts?.bearerToken,
      });
    },
  };
}
