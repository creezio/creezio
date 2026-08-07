/**
 * Registre Admin des endpoints runtime (port TempoFlow O5 — gold).
 * Enrichit les routes réellement montées avec les métadonnées OpenAPI
 * quand un document est fourni.
 */

export type ApiEndpointRecord = {
  method: string;
  path: string;
  documented: boolean;
  summary: string | null;
  description: string | null;
  tags: string[];
};

export type ApiEndpointsRegistry = {
  generatedAt: string;
  source: string;
  openapiUrl: string;
  endpoints: ApiEndpointRecord[];
};

export type ApiEndpointRouteInput = {
  method: string;
  path: string;
};

type OpenApiOperation = {
  summary?: string;
  description?: string;
  tags?: string[];
};

type OpenApiDocument = {
  paths?: Record<string, Record<string, OpenApiOperation | undefined>>;
};

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
] as const;

export function buildApiEndpointsRegistry(opts: {
  routes: ApiEndpointRouteInput[];
  openApiDocument?: OpenApiDocument | null;
  openapiUrl?: string;
  source?: string;
}): ApiEndpointsRegistry {
  const operations = new Map<
    string,
    {
      summary?: string;
      description?: string;
      tags?: string[];
      documented: true;
    }
  >();

  for (const [pathKey, pathItem] of Object.entries(
    opts.openApiDocument?.paths || {},
  )) {
    if (!pathItem) continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      const normalizedPath = pathKey.replace(/\{([^}]+)\}/g, ":$1");
      operations.set(`${method.toUpperCase()} ${normalizedPath}`, {
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags,
        documented: true,
      });
    }
  }

  const seen = new Set<string>();
  const endpoints = opts.routes
    .filter((route) => route.method && route.method !== "ALL")
    .flatMap((route) => {
      const method = route.method.toUpperCase();
      const key = `${method} ${route.path}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const operation = operations.get(key);
      return [
        {
          method,
          path: route.path,
          documented: Boolean(operation),
          summary: operation?.summary || null,
          description: operation?.description || null,
          tags: operation?.tags || [],
        } satisfies ApiEndpointRecord,
      ];
    })
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
    );

  return {
    generatedAt: new Date().toISOString(),
    source: opts.source || "runtime routes (+ OpenAPI si fourni)",
    openapiUrl: opts.openapiUrl || "/api/v1/openapi.json",
    endpoints,
  };
}

/** Collecte les routes d'une app Hono (y compris sous-apps montées). */
export function collectHonoRoutes(
  app: { routes: Array<{ method: string; path: string }> },
  pathPrefix = "",
): ApiEndpointRouteInput[] {
  const prefix = pathPrefix.replace(/\/$/, "");
  return app.routes
    .filter((route) => route.method && route.method !== "ALL")
    .map((route) => {
      const sub = route.path.startsWith("/") ? route.path : `/${route.path}`;
      const full =
        sub === "/"
          ? prefix || "/"
          : `${prefix}${sub}`.replace(/\/{2,}/g, "/");
      return { method: route.method, path: full };
    });
}
