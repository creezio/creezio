/**
 * Génération des tools MCP depuis les opérations de module (SoT).
 * Handler = requête synthétique vers le même mount HTTP — zéro 2e implémentation.
 */

import type {
  ApiKernel,
  ApiMount,
  ApiRequest,
  ApiResponse,
  ApiSpace,
  EntitySpec,
  ListedModuleOperation,
  ModuleOperation,
  MountedApiInfo,
} from "@creezio/api-kernel";
import {
  entityOperationsFromSpec,
  resolveOperationHttpPath,
} from "@creezio/api-kernel";
import type { McpRegisteredTool, McpToolCallResult } from "./types.js";

export type GenerateModuleToolsInvoke = (
  req: ApiRequest,
) => Promise<ApiResponse>;

export type GenerateModuleToolsOptions = {
  /** Id HTTP du mount (défaut = moduleId). */
  mountId?: string;
  space?: Exclude<ApiSpace, "core">;
};

function interpolatePath(
  template: string,
  args: Record<string, unknown>,
): { path: string; used: Set<string> } {
  const used = new Set<string>();
  const path = template.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name: string) => {
    used.add(name);
    const value = args[name];
    return encodeURIComponent(value == null ? "" : String(value));
  });
  return { path, used };
}

function asQuery(
  rest: Record<string, unknown>,
): Record<string, string | undefined> {
  const query: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      query[key] = value.map((v) => String(v)).join(",");
      continue;
    }
    if (typeof value === "object") continue;
    query[key] = String(value);
  }
  return query;
}

function defaultInputSchema(op: ModuleOperation): Record<string, unknown> {
  if (op.inputSchema && typeof op.inputSchema === "object") {
    return op.inputSchema as Record<string, unknown>;
  }
  const params = [
    ...normalizePath(op.path).matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g),
  ].map((m) => m[1]!);
  const properties: Record<string, { type: string }> = {};
  for (const name of params) properties[name] = { type: "string" };
  return {
    type: "object",
    properties,
    required: params,
    additionalProperties: true,
  };
}

function normalizePath(path: string): string {
  const raw = String(path || "").trim();
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function restArgs(
  args: Record<string, unknown>,
  used: Set<string>,
): Record<string, unknown> {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (used.has(key)) continue;
    rest[key] = value;
  }
  return rest;
}

function responseToToolResult(res: ApiResponse): McpToolCallResult {
  if (res.status >= 400) {
    const body = res.body as { error?: string } | undefined;
    return {
      ok: false,
      error:
        (body && typeof body === "object" && body.error) ||
        `http_${res.status}`,
      content: res.body,
    };
  }
  return { ok: true, content: res.body };
}

/**
 * Génère un tool MCP par op — `module.<id>.<op.id>`.
 * Handler = requête synthétique (method/path/body) vers le même
 * `ApiMount.handle` via `invokeMount` (typiquement `api.handle`) —
 * zéro 2ᵉ implémentation métier.
 */
export function generateModuleToolsFromOperations(
  moduleId: string,
  ops: readonly ModuleOperation[],
  invokeMount: GenerateModuleToolsInvoke,
  options: GenerateModuleToolsOptions = {},
): McpRegisteredTool[] {
  const mountId = options.mountId || moduleId;
  const space = options.space || "module";
  const tools: McpRegisteredTool[] = [];
  for (const op of ops) {
    const template = resolveOperationHttpPath(space, mountId, op.path);
    tools.push({
      name: `module.${mountId}.${op.id}`,
      description: op.description,
      space: "module",
      ownerId: moduleId,
      inputSchema: defaultInputSchema(op),
      ...(op.roles?.length ? { defaultRoles: op.roles } : {}),
      mcpPublishDefault: op.mcpPublishDefault === true,
      requiredScope:
        op.method === "GET" ? "crm:read" : op.permission || "crm:write",
      handler: async (args) => {
        const { path, used } = interpolatePath(template, args);
        const rest = restArgs(args, used);
        const method = op.method;
        const req: ApiRequest = {
          method,
          path,
          ...(method === "GET"
            ? { query: asQuery(rest) }
            : { body: rest }),
        };
        return responseToToolResult(await invokeMount(req));
      },
    });
  }
  return tools;
}

function toolsFromListedOps(
  api: ApiKernel,
  listed: readonly ListedModuleOperation[],
  spaces: ReadonlySet<Exclude<ApiSpace, "core">>,
): McpRegisteredTool[] {
  const byMount = new Map<
    string,
    { space: Exclude<ApiSpace, "core">; ops: ModuleOperation[] }
  >();
  for (const { space, mountId, op } of listed) {
    if (!spaces.has(space)) continue;
    const cur = byMount.get(mountId);
    if (cur) {
      cur.ops.push(op);
      continue;
    }
    byMount.set(mountId, { space, ops: [op] });
  }
  const invokeMount: GenerateModuleToolsInvoke = (req) => api.handle(req);
  const out: McpRegisteredTool[] = [];
  for (const [mountId, { space, ops }] of byMount) {
    out.push(
      ...generateModuleToolsFromOperations(mountId, ops, invokeMount, {
        mountId,
        space,
      }),
    );
  }
  return out;
}

/**
 * Tools `module.*` générés depuis `api.listOperations()` (space module).
 * SoT runtime — plus besoin de `BrandModuleDef.mcpTools()`.
 */
export function generateModuleToolsFromListedOps(
  api: ApiKernel,
  listed?: readonly ListedModuleOperation[],
): McpRegisteredTool[] {
  return toolsFromListedOps(
    api,
    listed ?? api.listOperations(),
    new Set(["module"]),
  );
}

/** Tools générés depuis les mounts déjà enregistrés sur le kernel. */
export function generateModuleToolsFromMountedOps(
  api: ApiKernel,
  mounts?: readonly MountedApiInfo[],
): McpRegisteredTool[] {
  if (!mounts) {
    return toolsFromListedOps(
      api,
      api.listOperations(),
      new Set(["module", "platform"]),
    );
  }
  const out: McpRegisteredTool[] = [];
  for (const mount of mounts) {
    if (mount.space !== "module" && mount.space !== "platform") continue;
    if (!mount.operations?.length) continue;
    out.push(
      ...generateModuleToolsFromOperations(
        mount.id,
        mount.operations,
        (req) => api.handle(req),
        { mountId: mount.id, space: mount.space },
      ),
    );
  }
  return out;
}

const warnedLegacyMcpTools = new Set<string>();

/** console.warn (une fois par module) — doctor a le pendant `MODULE_MCP_TOOLS_DEPRECATED`. */
export function warnLegacyModuleMcpTools(moduleId: string): void {
  if (warnedLegacyMcpTools.has(moduleId)) return;
  warnedLegacyMcpTools.add(moduleId);
  console.warn(
    `[creezio] module ${moduleId}: mcpTools() est déprécié — les tools MCP sont générés depuis operations[] (api.listOperations()). Enable/publish via /admin/mcp.`,
  );
}

/**
 * Discovery runtime : toujours générer depuis `listOperations()` (space module),
 * puis union avec les tools marque éventuels (legacy `mcpTools()`).
 */
export function discoverModuleToolsFromKernel(
  api: ApiKernel,
  brandTools: readonly McpRegisteredTool[] = [],
): McpRegisteredTool[] {
  return mergeGeneratedAndLegacyModuleTools(
    generateModuleToolsFromListedOps(api),
    brandTools,
  );
}

export type BrandModuleOpsSource = {
  id: string;
  entitySpecs?: Record<string, EntitySpec>;
  apiMounts?: Record<string, ApiMount>;
  /** @deprecated Tools générés depuis les ops. Conservé le temps de la migration. */
  mcpTools?: (api: ApiKernel) => McpRegisteredTool[];
};

/**
 * Discovery kit-side : SoT = `api.listOperations()` (space module).
 * Fallback : ops des BrandModuleDef (EntitySpec CRUD + apiMounts) si le
 * kernel n'a pas encore les mounts. `mcpTools()` manuscrit = warn, fusionné
 * seulement s'il n'y a pas de collision de nom.
 */
export function discoverModuleToolsFromBrandModules(
  modules: readonly BrandModuleOpsSource[],
  api: ApiKernel,
): McpRegisteredTool[] {
  const fromKernel = generateModuleToolsFromListedOps(api);
  const generated: McpRegisteredTool[] = [...fromKernel];
  const generatedNames = new Set(fromKernel.map((t) => t.name));
  const invoke: GenerateModuleToolsInvoke = (req) => api.handle(req);

  if (!fromKernel.length) {
    for (const mod of modules) {
      const seenOp = new Set<string>();
      for (const [mountId, spec] of Object.entries(mod.entitySpecs ?? {})) {
        const ops = entityOperationsFromSpec(spec);
        for (const op of ops) seenOp.add(`${mountId}:${op.id}`);
        const tools = generateModuleToolsFromOperations(mod.id, ops, invoke, {
          mountId,
          space: "module",
        });
        for (const tool of tools) {
          generated.push(tool);
          generatedNames.add(tool.name);
        }
      }
      for (const [mountId, mount] of Object.entries(mod.apiMounts ?? {})) {
        const extras = (mount.operations ?? []).filter(
          (op) => !seenOp.has(`${mountId}:${op.id}`),
        );
        if (!extras.length) continue;
        const tools = generateModuleToolsFromOperations(mod.id, extras, invoke, {
          mountId,
          space: "module",
        });
        for (const tool of tools) {
          generated.push(tool);
          generatedNames.add(tool.name);
        }
      }
    }
  }

  const legacy: McpRegisteredTool[] = [];
  for (const mod of modules) {
    if (!mod.mcpTools) continue;
    warnLegacyModuleMcpTools(mod.id);
    for (const tool of mod.mcpTools(api)) {
      if (generatedNames.has(tool.name)) continue;
      legacy.push(tool);
    }
  }
  return [...generated, ...legacy];
}

/** Fusion : générés d'abord (gagnent), manuscrits ensuite si nom libre. */
export function mergeGeneratedAndLegacyModuleTools(
  generated: readonly McpRegisteredTool[],
  legacy: readonly McpRegisteredTool[],
): McpRegisteredTool[] {
  const byName = new Map<string, McpRegisteredTool>();
  for (const tool of generated) byName.set(tool.name, tool);
  for (const tool of legacy) {
    if (!byName.has(tool.name)) byName.set(tool.name, tool);
  }
  return [...byName.values()];
}
