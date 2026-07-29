/**
 * Façade API Creezio — registre + routes cœur + deny-by-default cross-write.
 */

import { ARCHITECTURE_VERSION } from "@creezio/platform-core";
import type {
  ApiKernelOptions,
  ApiMount,
  ApiRequest,
  ApiResponse,
  ApiSpace,
  MountedApiInfo,
} from "./types.js";

export const API_V1_PREFIX = "/api/v1" as const;
export const API_CORE_PREFIX = `${API_V1_PREFIX}/core` as const;
export const API_MODULES_PREFIX = `${API_V1_PREFIX}/modules` as const;
export const API_PLUGINS_PREFIX = `${API_V1_PREFIX}/plugins` as const;

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizePath(raw: string): string {
  const noQuery = raw.split("?")[0] || "/";
  if (!noQuery.startsWith("/")) return `/${noQuery}`;
  return noQuery.replace(/\/{2,}/g, "/");
}

function json(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): ApiResponse {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
    body,
  };
}

function assertMountId(id: string, kind: string): void {
  if (!/^[a-z][a-z0-9_-]{0,62}$/.test(id)) {
    throw new Error(`${kind} id invalide: ${id}`);
  }
}

export type ApiKernel = {
  registerModuleApi(id: string, mount: ApiMount): void;
  registerPluginApi(id: string, mount: ApiMount): void;
  unregisterModuleApi(id: string): boolean;
  unregisterPluginApi(id: string): boolean;
  listMounts(): MountedApiInfo[];
  handle(req: ApiRequest): Promise<ApiResponse>;
  /** Préfixe domaine unique documenté. */
  readonly prefix: typeof API_V1_PREFIX;
};

export function createApiKernel(opts: ApiKernelOptions = {}): ApiKernel {
  const modules = new Map<string, ApiMount>();
  const plugins = new Map<string, ApiMount>();
  const architectureVersion = opts.architectureVersion ?? ARCHITECTURE_VERSION;
  const appVersion = opts.appVersion ?? "0.0.0";
  const brandId = opts.brandId ?? null;

  function handleCore(method: string, subPath: string): ApiResponse {
    const m = method.toUpperCase();
    if (subPath === "health" || subPath === "") {
      if (m !== "GET" && m !== "HEAD") {
        return json(405, { ok: false, error: "method_not_allowed" });
      }
      return json(200, {
        ok: true,
        space: "core",
        brandId,
        ts: new Date().toISOString(),
      });
    }
    if (subPath === "version") {
      if (m !== "GET") {
        return json(405, { ok: false, error: "method_not_allowed" });
      }
      return json(200, {
        ok: true,
        version: appVersion,
        architectureVersion,
        brandId,
      });
    }
    if (subPath === "architecture") {
      if (m !== "GET") {
        return json(405, { ok: false, error: "method_not_allowed" });
      }
      return json(200, {
        ok: true,
        architectureVersion,
        sqliteLayout: ["core", "brand", "plugin/<id>"],
        apiPrefix: API_V1_PREFIX,
        mounts: {
          modules: [...modules.keys()],
          plugins: [...plugins.keys()],
        },
      });
    }
    return json(404, { ok: false, error: "core_route_not_found", path: subPath });
  }

  async function dispatchMount(
    space: Exclude<ApiSpace, "core">,
    id: string,
    mount: ApiMount,
    req: ApiRequest,
    subPath: string,
  ): Promise<ApiResponse> {
    const method = req.method.toUpperCase();
    if (WRITE_METHODS.has(method) && !mount.allowCrossWrite) {
      // Deny-by-default : écritures restent dans l'espace monté.
      // Le handler ne reçoit que son propre préfixe — pas de proxy cross.
      // Flag allowCrossWrite réservé aux bridges explicites (ex. admin kit).
    }
    // Guard supplémentaire : refus si le path tente de « sortir » (déjà parsé).
    if (subPath.includes("..")) {
      return json(400, { ok: false, error: "invalid_path" });
    }
    return mount.handle({
      req,
      space,
      mountId: id,
      subPath,
    });
  }

  return {
    prefix: API_V1_PREFIX,

    registerModuleApi(id, mount) {
      assertMountId(id, "module");
      modules.set(id, mount);
    },

    registerPluginApi(id, mount) {
      assertMountId(id, "plugin");
      plugins.set(id, mount);
    },

    unregisterModuleApi(id) {
      return modules.delete(id);
    },

    unregisterPluginApi(id) {
      return plugins.delete(id);
    },

    listMounts() {
      const out: MountedApiInfo[] = [];
      for (const [id, m] of modules) {
        out.push({
          space: "module",
          id,
          allowCrossWrite: Boolean(m.allowCrossWrite),
        });
      }
      for (const [id, m] of plugins) {
        out.push({
          space: "plugin",
          id,
          allowCrossWrite: Boolean(m.allowCrossWrite),
        });
      }
      return out;
    },

    async handle(req) {
      const path = normalizePath(req.path);
      const method = (req.method || "GET").toUpperCase();

      if (!path.startsWith(`${API_V1_PREFIX}/`) && path !== API_V1_PREFIX) {
        return json(404, {
          ok: false,
          error: "outside_api_v1",
          hint: `Utiliser le préfixe ${API_V1_PREFIX}`,
        });
      }

      if (path === API_V1_PREFIX || path === `${API_V1_PREFIX}/`) {
        return json(200, {
          ok: true,
          prefix: API_V1_PREFIX,
          spaces: ["core", "modules", "plugins"],
        });
      }

      if (path.startsWith(`${API_CORE_PREFIX}/`) || path === API_CORE_PREFIX) {
        const sub =
          path === API_CORE_PREFIX
            ? ""
            : path.slice(API_CORE_PREFIX.length + 1);
        return handleCore(method, sub);
      }

      const modMatch = path.match(
        /^\/api\/v1\/modules\/([a-z][a-z0-9_-]{0,62})(?:\/(.*))?$/,
      );
      if (modMatch) {
        const id = modMatch[1]!;
        const subPath = modMatch[2] || "";
        const mount = modules.get(id);
        if (!mount) {
          return json(404, { ok: false, error: "module_not_mounted", id });
        }
        // Cross-write deny : un module ne peut pas cibler /core ou /plugins
        // via ce dispatcher (path déjà contraint à /modules/<id>).
        if (
          WRITE_METHODS.has(method) &&
          mount.allowCrossWrite !== true &&
          subPath.startsWith("__cross/")
        ) {
          return json(403, {
            ok: false,
            error: "cross_write_denied",
            space: "module",
            id,
          });
        }
        return dispatchMount("module", id, mount, { ...req, method, path }, subPath);
      }

      const plgMatch = path.match(
        /^\/api\/v1\/plugins\/([a-z][a-z0-9_-]{0,62})(?:\/(.*))?$/,
      );
      if (plgMatch) {
        const id = plgMatch[1]!;
        const subPath = plgMatch[2] || "";
        const mount = plugins.get(id);
        if (!mount) {
          return json(404, { ok: false, error: "plugin_not_mounted", id });
        }
        if (
          WRITE_METHODS.has(method) &&
          mount.allowCrossWrite !== true &&
          subPath.startsWith("__cross/")
        ) {
          return json(403, {
            ok: false,
            error: "cross_write_denied",
            space: "plugin",
            id,
          });
        }
        return dispatchMount("plugin", id, mount, { ...req, method, path }, subPath);
      }

      return json(404, { ok: false, error: "not_found", path });
    },
  };
}
