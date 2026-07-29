/**
 * Contrats HTTP façade Creezio — indépendants d'Express/Fastify/Next.
 */

export type ApiSpace = "core" | "module" | "plugin";

export type ApiRequest = {
  method: string;
  /** Path absolu commençant par `/api/v1/...` (query string optionnelle stripée). */
  path: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
};

export type ApiHandlerContext = {
  req: ApiRequest;
  /** Espace monté (module/plugin id ou `core`). */
  space: ApiSpace;
  mountId: string;
  /** Sous-chemin relatif au préfixe de montage (sans slash initial). */
  subPath: string;
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
};

export type ApiKernelOptions = {
  brandId?: string;
  /** Override version architecture (défaut = platform-core). */
  architectureVersion?: string;
  /** Version package kit / app exposée sur /version. */
  appVersion?: string;
};

export type MountedApiInfo = {
  space: Exclude<ApiSpace, "core">;
  id: string;
  allowCrossWrite: boolean;
};
