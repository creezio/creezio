# @creezio/mcp-facade — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/mcp-facade/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/admin/adapters.ts`](../src/admin/adapters.ts) | 25 | `configureMcpAdmin`, `getMcpAdminAdapters`, `resetMcpAdminAdaptersForTests` |
| [`src/admin/http-routes.ts`](../src/admin/http-routes.ts) | 103 | `CreateMcpAdminRoutesOptions`, `createMcpAdminRoutes` |
| [`src/admin/index.ts`](../src/admin/index.ts) | 46 | `configureMcpAdmin`, `getMcpAdminAdapters`, `resetMcpAdminAdaptersForTests`, `ensureMcpAdminSchema`, `listMcpToolPolicies`, `getMcpToolPolicy`, `updateMcpToolPolicy`, `listMcpClients` |
| [`src/admin/mcp-admin.ts`](../src/admin/mcp-admin.ts) | 419 | `ensureMcpAdminSchema`, `McpToolPolicy`, `listMcpToolPolicies`, `getMcpToolPolicy`, `updateMcpToolPolicy`, `McpAdminClient`, `listMcpClients`, `setMcpClientEnabled` |
| [`src/admin/types.ts`](../src/admin/types.ts) | 50 | `McpToolDefinition`, `McpAdminSqliteStatement`, `McpAdminSqliteDatabase`, `McpRequestLogEntry`, `McpAdminAdapters` |
| [`src/brand-facade.ts`](../src/brand-facade.ts) | 66 | `CreateBrandMcpFacadeOptions`, `createBrandMcpFacade` |
| [`src/core-tools.ts`](../src/core-tools.ts) | 114 | `CREEZIO_CORE_MCP_TOOL_NAMES`, `CreezioCoreMcpToolName`, `CreateCoreMcpToolsOptions`, `createCoreMcpTools` |
| [`src/facade.ts`](../src/facade.ts) | 346 | `McpFacade`, `createMcpFacade` |
| [`src/hono-bind.ts`](../src/hono-bind.ts) | 131 | `HonoMcpSdkResult`, `HonoMcpToolRegisterFn`, `BindFacadeToolsToHonoOptions`, `mcpFacadeResultToSdk`, `bindFacadeToolsToHono` |
| [`src/hono-proxy.ts`](../src/hono-proxy.ts) | 263 | `WrapMcpFacadeWithHonoProxyOptions`, `wrapMcpFacadeWithHonoProxy`, `__mcpHonoProxyTest` |
| [`src/index.ts`](../src/index.ts) | 206 | `CREEZIO_PLATFORM_HOST_MCP_TOOL_NAMES`, `createMcpFacade`, `signMcpJwt`, `verifyMcpBearer`, `assertNamespacedToolName`, `isLegacyAliasName`, `parseNamespacedToolName`, `composeToolPolicies` |
| [`src/jwt.ts`](../src/jwt.ts) | 103 | `verifyMcpBearer`, `signMcpJwt` |
| [`src/namespace.ts`](../src/namespace.ts) | 72 | `ParsedToolName`, `parseNamespacedToolName`, `assertNamespacedToolName`, `isLegacyAliasName` |
| [`src/oauth/cors-policy.ts`](../src/oauth/cors-policy.ts) | 29 | `mcpCorsAllowlist`, `resolveMcpCorsOrigin` |
| [`src/oauth/hono-app.ts`](../src/oauth/hono-app.ts) | 228 | `createMcpHonoApp` |
| [`src/oauth/index.ts`](../src/oauth/index.ts) | 69 | `ACCESS_TOKEN_TTL_S`, `REFRESH_TOKEN_TTL_S`, `MCP_SCOPE`, `MCP_SCOPE_LEGACY`, `MCP_SCOPE_READ`, `MCP_SCOPE_WRITE`, `MCP_SCOPES`, `McpPublicUrlRequiredError` |
| [`src/oauth/rate-limit.ts`](../src/oauth/rate-limit.ts) | 53 | `McpRateLimitResult`, `checkMcpRateLimit`, `rateLimitHeaders`, `resetMcpRateLimits` |
| [`src/oauth/routes.ts`](../src/oauth/routes.ts) | 873 | `createMcpOAuthRoutes` |
| [`src/oauth/store.ts`](../src/oauth/store.ts) | 570 | `MCP_SCOPE_LEGACY`, `MCP_SCOPE_READ`, `MCP_SCOPE_WRITE`, `MCP_SCOPES`, `MCP_SCOPE`, `ACCESS_TOKEN_TTL_S`, `REFRESH_TOKEN_TTL_S`, `configureMcpOAuth` |
| [`src/oauth/types.ts`](../src/oauth/types.ts) | 108 | `McpOAuthSqliteDatabase`, `McpOAuthAdapters`, `McpOAuthSessionUser`, `McpOAuthSession`, `McpOAuthSessionBridge`, `McpOAuthRoutesConfig`, `McpServerAuthContext`, `McpStreamableTransport` |
| [`src/open-external-tab-host-tools.ts`](../src/open-external-tab-host-tools.ts) | 187 | `CREEZIO_OPEN_EXTERNAL_TAB_MCP_TOOL_NAME`, `OpenExternalTabResolved`, `OpenExternalTabResolveResult`, `OpenExternalTabHostMcpToolConfig`, `OpenExternalTabHostMcpRegisterFn`, `OpenExternalTabUser`, `CreateOpenExternalTabHostMcpToolsOptions`, `createOpenExternalTabHostMcpTools` |
| [`src/policy.ts`](../src/policy.ts) | 153 | `PluginAclPolicyResolver`, `PluginAclActorResolver`, `DecidePluginAccessFn`, `denyCrossLayerToolCall`, `composeToolPolicies`, `createDenyUnauthorizedPluginToolPolicy` |
| [`src/runtime.ts`](../src/runtime.ts) | 36 | `MCP_PRODUCT_EXECUTOR`, `McpProductExecutor`, `McpFacadeRole`, `McpFacadeMode`, `McpUpstreamRef`, `resolveMcpFacadeRole` |
| [`src/types.ts`](../src/types.ts) | 133 | `McpToolSpace`, `McpPublicSurfaceMode`, `McpToolDefinition`, `McpToolCallResult`, `McpToolHandler`, `McpRegisteredTool`, `DiscoverToolsFn`, `DiscoverToolsBySpaceFn` |
| [`ui/index.ts`](../ui/index.ts) | 6 | `McpAdminClient` |
| [`ui/mcp-admin-client.tsx`](../ui/mcp-admin-client.tsx) | 271 | `McpAdminClient` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 38 | `BadgeProps`, `Badge` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/card.tsx`](../ui/primitives/card.tsx) | 45 | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| [`ui/primitives/cn.ts`](../ui/primitives/cn.ts) | 7 | `cn` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/tabs.tsx`](../ui/primitives/tabs.tsx) | 52 | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |

---

## Détail par fichier

### `src/admin/adapters.ts`

- **Lignes** : 25
- **Exports** : `configureMcpAdmin`, `getMcpAdminAdapters`, `resetMcpAdminAdaptersForTests`

Injection host pour mcp-admin (évite imports `@/` marque).

### `src/admin/http-routes.ts`

- **Lignes** : 103
- **Exports** : `CreateMcpAdminRoutesOptions`, `createMcpAdminRoutes`

Routes Hono Admin MCP (port TempoFlow — N6).
Auth owner reste côté marque (montage sous /admin).

### `src/admin/index.ts`

- **Lignes** : 46
- **Exports** : `configureMcpAdmin`, `getMcpAdminAdapters`, `resetMcpAdminAdaptersForTests`, `ensureMcpAdminSchema`, `listMcpToolPolicies`, `getMcpToolPolicy`, `updateMcpToolPolicy`, `listMcpClients`, `setMcpClientEnabled`, `revokeMcpClient`, `rotateMcpClientSecret`, `clientCanAuthenticate`, `touchMcpClient`, `mcpAdminStatus`, `mcpDiagnostics`, `mcpMetrics`, `auditMcpAdmin`, `listMcpAuditLogs`, `pruneMcpAuditLogs`, `exportMcpDiagnostics`, `createMcpAdminRoutes`

MCP admin — policies, clients OAuth, diagnostics, routes Hono (N6).

### `src/admin/mcp-admin.ts`

- **Lignes** : 419
- **Exports** : `ensureMcpAdminSchema`, `McpToolPolicy`, `listMcpToolPolicies`, `getMcpToolPolicy`, `updateMcpToolPolicy`, `McpAdminClient`, `listMcpClients`, `setMcpClientEnabled`, `revokeMcpClient`, `rotateMcpClientSecret`, `clientCanAuthenticate`, `touchMcpClient`, `mcpAdminStatus`, `mcpDiagnostics`, `mcpMetrics`, `auditMcpAdmin`, `listMcpAuditLogs`, `pruneMcpAuditLogs`, `exportMcpDiagnostics`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/admin/types.ts`

- **Lignes** : 50
- **Exports** : `McpToolDefinition`, `McpAdminSqliteStatement`, `McpAdminSqliteDatabase`, `McpRequestLogEntry`, `McpAdminAdapters`

Types admin MCP (port TempoFlow — N6).
Le registre métier des tools reste injecté par la marque.

### `src/brand-facade.ts`

- **Lignes** : 66
- **Exports** : `CreateBrandMcpFacadeOptions`, `createBrandMcpFacade`

DX factory marque — remplace le boilerplate create*BrandMcp ×3.
La marque ne fournit que api + aliases + discoverModuleTools.

### `src/core-tools.ts`

- **Lignes** : 114
- **Exports** : `CREEZIO_CORE_MCP_TOOL_NAMES`, `CreezioCoreMcpToolName`, `CreateCoreMcpToolsOptions`, `createCoreMcpTools`

Tools MCP cœur (`creezio.*`) — SoT kit (H1/H4 → M9).
Les marques importent les noms / factories ; handlers Hono peuvent
rester brand-specific tant que les noms restent alignés.

### `src/facade.ts`

- **Lignes** : 346
- **Exports** : `McpFacade`, `createMcpFacade`

Façade / proxy MCP unique — tools cœur + discoverTools modules/plugins.
H2.3 : discovery / listage scindés par couche (core / module / plugin).
H4   : registry dynamique, namespacing, aliases legacy, policies deny
       cross-layer, surface publique sans double exposition.
Pas de MCP « produit Creezio » séparé du MCP de l'app.

### `src/hono-bind.ts`

- **Lignes** : 131
- **Exports** : `HonoMcpSdkResult`, `HonoMcpToolRegisterFn`, `BindFacadeToolsToHonoOptions`, `mcpFacadeResultToSdk`, `bindFacadeToolsToHono`

O4r3 — bind Hono `/mcp` (SDK McpServer) → façade `create*BrandMcp`.
Un seul SoT handlers : `facade.callTool`. Hono ne garde que transport,
auth Bearer, policies admin — pas de second registre métier.

### `src/hono-proxy.ts`

- **Lignes** : 263
- **Exports** : `WrapMcpFacadeWithHonoProxyOptions`, `wrapMcpFacadeWithHonoProxy`, `__mcpHonoProxyTest`

Proxy façade Electron → Hono `/mcp` (D1/C2 → M9 SoT kit).
Parle le transport Streamable HTTP JSON (même shape que test-mcp-oauth).
Si l'upstream est absent ou en erreur et `fallbackLocal`, délègue à la
façade locale (brand mounts) — zéro perte offline / tests.

### `src/index.ts`

- **Lignes** : 206
- **Exports** : `CREEZIO_PLATFORM_HOST_MCP_TOOL_NAMES`, `createMcpFacade`, `signMcpJwt`, `verifyMcpBearer`, `assertNamespacedToolName`, `isLegacyAliasName`, `parseNamespacedToolName`, `composeToolPolicies`, `createDenyUnauthorizedPluginToolPolicy`, `denyCrossLayerToolCall`, `CREEZIO_CORE_MCP_TOOL_NAMES`, `createCoreMcpTools`, `MCP_PRODUCT_EXECUTOR`, `resolveMcpFacadeRole`, `__mcpHonoProxyTest`, `wrapMcpFacadeWithHonoProxy`, `bindFacadeToolsToHono`, `mcpFacadeResultToSdk`, `createBrandMcpFacade`, `ACCESS_TOKEN_TTL_S`, `REFRESH_TOKEN_TTL_S`, `MCP_SCOPE`, `MCP_SCOPE_LEGACY`, `MCP_SCOPE_READ`, `MCP_SCOPE_WRITE`, `MCP_SCOPES`, `McpPublicUrlRequiredError`, `canonicalizeMcpUrl`, `checkMcpRateLimit`, `configureMcpOAuth`, `consumeAuthCode`, `createAuthCode`, `createMcpHonoApp`, `createMcpOAuthRoutes`, `createRefreshToken`, `getClient`, `getMcpOAuthAdapters`, `isMcpPublicUrlRequiredError`, `mcpBaseUrl`, `mcpCorsAllowlist`

@creezio/mcp-facade — MCP d'app unique (H1.2 / discovery H2.3 / proxy H4 / M9).

### `src/jwt.ts`

- **Lignes** : 103
- **Exports** : `verifyMcpBearer`, `signMcpJwt`

Vérification JWT HS256 minimale (sans dépendance jsonwebtoken).
Alignée sur le secret local-config `mcpJwtSecret` / MCP_JWT_SECRET.

### `src/namespace.ts`

- **Lignes** : 72
- **Exports** : `ParsedToolName`, `parseNamespacedToolName`, `assertNamespacedToolName`, `isLegacyAliasName`

Namespacing H4 — core.* / creezio.* · module.<owner>.* · plugin.<owner>.*

### `src/oauth/cors-policy.ts`

- **Lignes** : 29
- **Exports** : `mcpCorsAllowlist`, `resolveMcpCorsOrigin`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/oauth/hono-app.ts`

- **Lignes** : 228
- **Exports** : `createMcpHonoApp`

Factory Hono `/mcp` + OAuth — SoT kit (équivalent fonctionnel server/mcp/app.ts).
Transport Streamable HTTP et buildMcpServer restent injectés par la marque.

### `src/oauth/index.ts`

- **Lignes** : 69
- **Exports** : `ACCESS_TOKEN_TTL_S`, `REFRESH_TOKEN_TTL_S`, `MCP_SCOPE`, `MCP_SCOPE_LEGACY`, `MCP_SCOPE_READ`, `MCP_SCOPE_WRITE`, `MCP_SCOPES`, `McpPublicUrlRequiredError`, `canonicalizeMcpUrl`, `configureMcpOAuth`, `consumeAuthCode`, `createAuthCode`, `createRefreshToken`, `getClient`, `getMcpOAuthAdapters`, `isMcpPublicUrlRequiredError`, `mcpBaseUrl`, `mcpOauthReady`, `mcpResourceUrl`, `normalizeMcpScopes`, `peekAuthCode`, `pruneExpiredCodes`, `registerClient`, `resetMcpOAuthAdaptersForTests`, `resolveMcpPublicUrl`, `resourceAcceptable`, `rotateRefreshToken`, `signAccessToken`, `touchOAuthClientLastUsed`, `verifyAccessToken`, `verifyClientSecret`, `verifyPkceS256`, `checkMcpRateLimit`, `rateLimitHeaders`, `resetMcpRateLimits`, `mcpCorsAllowlist`, `resolveMcpCorsOrigin`, `createMcpOAuthRoutes`, `createMcpHonoApp`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/oauth/rate-limit.ts`

- **Lignes** : 53
- **Exports** : `McpRateLimitResult`, `checkMcpRateLimit`, `rateLimitHeaders`, `resetMcpRateLimits`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/oauth/routes.ts`

- **Lignes** : 873
- **Exports** : `createMcpOAuthRoutes`

Endpoints OAuth 2.1 du serveur MCP — SoT kit (port TempoFlow gold).
Branding / session / cookie injectables via McpOAuthRoutesConfig.

### `src/oauth/store.ts`

- **Lignes** : 570
- **Exports** : `MCP_SCOPE_LEGACY`, `MCP_SCOPE_READ`, `MCP_SCOPE_WRITE`, `MCP_SCOPES`, `MCP_SCOPE`, `ACCESS_TOKEN_TTL_S`, `REFRESH_TOKEN_TTL_S`, `configureMcpOAuth`, `getMcpOAuthAdapters`, `resetMcpOAuthAdaptersForTests`, `McpPublicUrlRequiredError`, `isMcpPublicUrlRequiredError`, `resolveMcpPublicUrl`, `mcpBaseUrl`, `mcpResourceUrl`, `canonicalizeMcpUrl`, `resourceAcceptable`, `mcpOauthReady`, `normalizeMcpScopes`, `McpOAuthClient`, `RegisterClientInput`, `registerClient`, `getClient`, `verifyClientSecret`, `CreateCodeInput`, `createAuthCode`, `ConsumedCode`, `peekAuthCode`, `consumeAuthCode`, `verifyPkceS256`, `createRefreshToken`, `RotatedRefresh`, `rotateRefreshToken`, `signAccessToken`, `McpAccessToken`, `verifyAccessToken`, `pruneExpiredCodes`, `touchOAuthClientLastUsed`

Store OAuth 2.1 MCP (PKCE S256, DCR, refresh rotation) — SoT kit.
Port TempoFlow gold ; DB / JWT secret / URL publique injectables.

### `src/oauth/types.ts`

- **Lignes** : 108
- **Exports** : `McpOAuthSqliteDatabase`, `McpOAuthAdapters`, `McpOAuthSessionUser`, `McpOAuthSession`, `McpOAuthSessionBridge`, `McpOAuthRoutesConfig`, `McpServerAuthContext`, `McpStreamableTransport`, `McpConnectedServer`, `McpApiKeyRecord`, `CreateMcpHonoAppOptions`

Types OAuth MCP + transport Hono — adapters injectés (zéro hardcode marque).

### `src/open-external-tab-host-tools.ts`

- **Lignes** : 187
- **Exports** : `CREEZIO_OPEN_EXTERNAL_TAB_MCP_TOOL_NAME`, `OpenExternalTabResolved`, `OpenExternalTabResolveResult`, `OpenExternalTabHostMcpToolConfig`, `OpenExternalTabHostMcpRegisterFn`, `OpenExternalTabUser`, `CreateOpenExternalTabHostMcpToolsOptions`, `createOpenExternalTabHostMcpTools`

D-P18 — tool MCP host-only `open_external_tab` (desktop).
SoT kit partagée TF / CV / Fidu. Métier résolution URL reste injecté.

### `src/policy.ts`

- **Lignes** : 153
- **Exports** : `PluginAclPolicyResolver`, `PluginAclActorResolver`, `DecidePluginAccessFn`, `denyCrossLayerToolCall`, `composeToolPolicies`, `createDenyUnauthorizedPluginToolPolicy`

Policies MCP H4 — deny cross-layer cohérent api-kernel H2.
H5 — plugin ACL (see/execute) alignée Product Hub.

### `src/runtime.ts`

- **Lignes** : 36
- **Exports** : `MCP_PRODUCT_EXECUTOR`, `McpProductExecutor`, `McpFacadeRole`, `McpFacadeMode`, `McpUpstreamRef`, `resolveMcpFacadeRole`

Contrat MCP produit (D1/C2 → M9) — une seule stack.
- Exécuteur HTTP public : **Hono** `GET|POST /mcp`.
- Façade Electron `@creezio/mcp-facade` : adaptateur brand-mounts (tests /
  offline) **ou** proxy vers Hono dès qu'un upstream local est annoncé.
Hermes / Cursor / ChatGPT → toujours `{base}/mcp`, jamais un 2ᵉ serveur
MCP dans le process Electron.

### `src/types.ts`

- **Lignes** : 133
- **Exports** : `McpToolSpace`, `McpPublicSurfaceMode`, `McpToolDefinition`, `McpToolCallResult`, `McpToolHandler`, `McpRegisteredTool`, `DiscoverToolsFn`, `DiscoverToolsBySpaceFn`, `McpAuthorizeContext`, `McpToolPolicyDecision`, `McpAuthorizeToolCallFn`, `McpFacadeOptions`, `McpListToolsResult`, `McpToolsBySpace`, `McpAuthResult`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 6
- **Exports** : `McpAdminClient`

MCP Admin UI (port TempoFlow — N6).
Consommer via `@creezio/mcp-facade/ui`.

### `ui/mcp-admin-client.tsx`

- **Lignes** : 271
- **Exports** : `McpAdminClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/badge.tsx`

- **Lignes** : 38
- **Exports** : `BadgeProps`, `Badge`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/button.tsx`

- **Lignes** : 45
- **Exports** : `ButtonProps`, `Button`, `buttonVariants`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/card.tsx`

- **Lignes** : 45
- **Exports** : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/cn.ts`

- **Lignes** : 7
- **Exports** : `cn`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/input.tsx`

- **Lignes** : 20
- **Exports** : `Input`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/tabs.tsx`

- **Lignes** : 52
- **Exports** : `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

_(pas de cartouche JSDoc en tête — voir le code)_

