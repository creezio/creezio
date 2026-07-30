/**
 * Contrats HTTP façade Creezio — indépendants d'Express/Fastify/Next.
 */

import type { SqliteRuntime } from "@creezio/platform-core";
import type { ScopedDbAccess } from "./db-scope.js";

/**
 * Espaces de la façade unique `/api/v1`.
 * - `core` — routes kit (health/version/architecture)
 * - `platform` — APIs plateforme kit (tasks/mails/obs/automations) → DB core
 * - `module` — métier marque → DB brand
 * - `plugin` — plugins installés → DB plugin/<id>
 */
export type ApiSpace = "core" | "platform" | "module" | "plugin";

export type ApiRequest = {
  method: string;
  /** Path absolu commençant par `/api/v1/...` (query string optionnelle stripée). */
  path: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

/**
 * H5 — garde ACL plugin avant dispatch mount.
 * Même décision que MCP / control-plane via `decidePluginAccess`.
 */
export type ApiPluginAccessDecision =
  | { allow: true }
  | { allow: false; reason: string; status?: number };

export type ApiAuthorizePluginAccessFn = (ctx: {
  pluginId: string;
  method: string;
  subPath: string;
  req: ApiRequest;
}) => ApiPluginAccessDecision | Promise<ApiPluginAccessDecision>;

export type ApiResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
};

export type ApiHandlerContext = {
  req: ApiRequest;
  /** Espace monté (module/plugin/platform id ou `core`). */
  space: ApiSpace;
  mountId: string;
  /** Sous-chemin relatif au préfixe de montage (sans slash initial). */
  subPath: string;
  /**
   * Accès DB scopé (H2) — présent si le kernel a un `sqliteRuntime`.
   * Écriture hors couche → CrossLayerWriteDeniedError / 403.
   */
  db?: ScopedDbAccess;
};

export type ApiMountHandler = (
  ctx: ApiHandlerContext,
) => ApiResponse | Promise<ApiResponse>;

export type ApiMount = {
  handle: ApiMountHandler;
  /**
   * Si true, le handler peut recevoir des écritures cross-space
   * (défaut false = deny-by-default).
   */
  allowCrossWrite?: boolean;
  /**
   * Couche DB attendue pour ce mount (H2).
   * - platform → core (défaut)
   * - module → brand (défaut)
   * - plugin → plugin/<id> (défaut = mount id)
   * Ignoré pour les routes core kit.
   */
  dbLayer?: "core" | "brand" | "plugin";
};

export type ApiKernelOptions = {
  brandId?: string;
  /** Override version architecture (défaut = platform-core). */
  architectureVersion?: string;
  /** Version package kit / app exposée sur /version. */
  appVersion?: string;
  /**
   * Runtime multi-DB (H2) — injecte `ctx.db` scopé sur chaque mount.
   * Sans runtime, les routes fonctionnent mais sans garde DB (compat H1).
   */
  sqliteRuntime?: SqliteRuntime;
  /**
   * H5 — ACL plugin (see/execute) avant dispatch.
   * Absent ⇒ compat H2/H4 (pas de filtre org).
   */
  authorizePluginAccess?: ApiAuthorizePluginAccessFn;
};

export type MountedApiInfo = {
  space: Exclude<ApiSpace, "core">;
  id: string;
  allowCrossWrite: boolean;
  dbLayer: "core" | "brand" | "plugin";
};
