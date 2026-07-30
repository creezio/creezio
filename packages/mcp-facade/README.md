# `@creezio/mcp-facade`

**Une seule façade / proxy MCP** = MCP de l'app. Pas de « produit MCP Creezio » séparé.

## Contrat SoT `listTools` (D-P18)

| Surface | Source |
|---------|--------|
| Electron brand-runtime | `createBrandMcpFacade` / `create*BrandMcp` |
| Hono `/mcp` | `bindFacadeToolsToHono(facade, …)` (+ host-only tools) |
| Assistant `mcp-bridge` | même factory, `publicSurface: "canonical"` |

Les trois doivent exposer le **même ensemble métier** (modulo `publicSurface` / aliases).  
Tools host (desktop, AI tasks) restent hors factory — jamais de doublon métier.

## Capacités

| Phase | Surface |
|-------|---------|
| H1 | Tools cœur + `discoverTools` + JWT |
| H2 | `listToolsBySpace` / `discoverToolsBySpace` |
| **H4** | Registry, namespacing, **aliases legacy**, policies deny cross-layer, `publicSurface` |
| **M9** | `wrapMcpFacadeWithHonoProxy` + contrat `MCP_PRODUCT_EXECUTOR` + `createCoreMcpTools` |
| **D-P18** | OAuth 2.1 / PKCE / well-known + factory Hono `/mcp` + `createBrandMcpFacade` |

### Namespaces

- `creezio.*` / `core.*` — cœur (réservé façade)
- `module.<ownerId>.*` — métier brand
- `plugin.<ownerId>.*` — sidecars orga

### Anti double exposition

```ts
import { createMcpFacade } from "@creezio/mcp-facade";

const mcp = createMcpFacade({
  jwtSecret: process.env.MCP_JWT_SECRET,
  publicSurface: "legacy-preferred", // masque module.panier.get si alias get_panier
  aliases: {
    get_panier: "module.panier.get",
    add_to_panier: "module.panier.add_ligne",
  },
  discoverToolsBySpace: async () => ({ module: [/* … */], plugin: [] }),
});

await mcp.callTool("get_panier", {}); // → handler module.panier.get
```

`publicSurface` : `legacy-preferred` (défaut H4) | `canonical` | `both`.

## Factory marque (DX)

```ts
import { createBrandMcpFacade } from "@creezio/mcp-facade";
import { BRAND_MCP_ALIASES } from "./mcp-aliases";
import { createBrandModuleMcpTools } from "./mcp-tools";

export function createMyBrandMcp(api, options = {}) {
  return createBrandMcpFacade({
    api,
    aliases: BRAND_MCP_ALIASES,
    discoverModuleTools: createBrandModuleMcpTools,
    publicSurface: "legacy-preferred",
    ...options,
  });
}
```

Reste en marque : `mcp-tools.ts` (handlers métier), `mcp-aliases.ts` (noms legacy publics).

## Brancher OAuth + `/mcp`

```ts
import {
  configureMcpOAuth,
  createMcpOAuthRoutes,
  createMcpHonoApp,
  ensureMcpAdminSchema,
  resolveMcpCorsOrigin,
} from "@creezio/mcp-facade";
import { StreamableHTTPTransport } from "@hono/mcp";

configureMcpOAuth({
  getWriteDb,
  tableExists,
  // pas de hardcode domaine marque
});

const oauthRoutes = createMcpOAuthRoutes({
  productName: "Ma Marque CRM",
  resourceName: "Ma Marque CRM MCP",
  consentScopesHtml: `<li>…</li>`,
  session: {
    getSessionFromContext,
    authenticateUser,
    validateCredentials,
    getOwnerId: () => getOwner()?.id ?? null,
    createSessionCookie, // injectable — ne pas hardcoder le nom de cookie
  },
});

export const mcpApp = createMcpHonoApp({
  oauthRoutes,
  ensureSchema: ensureMcpAdminSchema,
  resolveCorsOrigin: resolveMcpCorsOrigin,
  apiKeyAuth: {
    prefix: "brand_live_",
    verify: verifyApiKey,
    resolveUserId: (key) => key.user_id || getOwner()?.id || null,
  },
  createTransport: () =>
    new StreamableHTTPTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    }),
  buildMcpServer, // mince : façade + bindFacadeToolsToHono + host-only
});
```

## Checklist extinction fichiers locaux

Après cutover marque, supprimer (ou stub ≤ ~40 LOC délégant) :

- [ ] `src/lib/mcp-oauth.ts` → `configureMcpOAuth` + re-exports kit
- [ ] `src/server/mcp/oauth.ts` → `createMcpOAuthRoutes({…})`
- [ ] `src/server/mcp/rate-limit.ts` / `cors-policy.ts` → kit
- [ ] logique transport dans `src/server/mcp/app.ts` → `createMcpHonoApp`
- [ ] tools métier inline dans `server.ts` → `electron/modules/mcp-tools.ts` (+ aliases)
- [ ] host-tools = host-only (desktop / AI), zéro panier/GED/VASP dupliqué

## Host tools plateforme

`CREEZIO_PLATFORM_HOST_MCP_TOOL_NAMES` : `open_external_tab`, `list_tools_by_space`.  
- `open_external_tab` → `createOpenExternalTabHostMcpTools` (adapters marque :
  resolve / toOpenTabParams / dispatch / users).  
- Workflows AI tasks (`create_ai_task`, …) → `createAiTaskHostMcpTools` dans
  `@creezio/tasks` (host-only, SoT partagée TF/CV).  
Reste marque : résolution URL métier (+ discovery TF `list_tools_by_space`) et
façade. Le métier (panier, GED, dossiers VASP) **ne va jamais** dans le kit.
