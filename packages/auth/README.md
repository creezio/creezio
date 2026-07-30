# `@creezio/auth`

Session / login / logout / recovery — **natif Creezio**, indépendant de la marque.

- Schéma tables : **sqlite core** (`AUTH_CORE_SQL`) — store credentials
- Store mémoire (tests) + **`createSqliteAuthStore`** (persistance core.db)
- **Session JWT cookie** Next (`configureAuth` + helpers)
- **UI login** : `@creezio/auth/ui` (`LoginForm`, `SessionProvider`)
- **Routes / middlewares Hono** : `createAuthRoutes`, `createHonoAuth`
- Recovery key crypto : **SoT `@creezio/platform-core`** (réexporté)
- Handlers IPC branchables sur `IpcChannels.auth` (`@creezio/shell`)

## Config marque (obligatoire)

```ts
import { configureAuth } from "@creezio/auth";
import { ALL_NAV_PERMISSIONS } from "@/lib/nav-config";

configureAuth({
  cookieName: "tempoflow2_crm_session", // ou certivan_crm_session / fidu_session
  ownerPermissions: ALL_NAV_PERMISSIONS,
});
```

Aucun cookie / `window.*Desktop` hardcodé dans le kit.  
Bridge desktop UI : `configureShellUiBrand({ desktopApiGlobal })` (`@creezio/shell-ui`).

## Page `/login` mince

```tsx
import { LoginForm } from "@creezio/auth/ui";
import { isAuthDisabled } from "@creezio/auth";

export default function LoginPage() {
  if (isAuthDisabled()) redirect("/dashboard");
  return (
    <div>
      <h1>Ma Marque CRM</h1>
      <LoginForm />
    </div>
  );
}
```

## SessionProvider

```tsx
import { SessionProvider } from "@creezio/auth/ui";
import { ALL_NAV_PERMISSIONS } from "@/lib/nav-config";

<SessionProvider ownerPermissions={ALL_NAV_PERMISSIONS}>
  {children}
</SessionProvider>
```

## Routes Hono

```ts
import { createAuthRoutes, createHonoAuth } from "@creezio/auth";
import { resolveCookieSecure } from "@creezio/shell-ui";
import * as users from "@/lib/users";
import * as apiKeys from "@/lib/api-keys";
import { ALL_NAV_PERMISSIONS } from "@/lib/nav-config";

const honoAuth = createHonoAuth({
  apiKeyPrefix: apiKeys.API_KEY_PREFIX,
  verifyApiKey: apiKeys.verifyApiKey,
  checkRateLimit: apiKeys.checkRateLimit,
  rateLimitPerMinute: apiKeys.RATE_LIMIT_PER_MINUTE,
  apiKeyAllowsMethod: apiKeys.apiKeyAllowsMethod,
  apiKeyAllowsTasks: apiKeys.apiKeyAllowsTasks, // optionnel (Fidu peut omettre)
});

export const {
  getSessionFromContext,
  requireSession,
  requireNavPermission,
  requireOwnerNotImpersonating,
  requireSessionOrAgentKey,
  requireSessionOrApiKey,
  requireSessionOrTasksApiKey,
} = honoAuth;

export const authRoutes = createAuthRoutes({
  ...users,
  ownerPermissions: ALL_NAV_PERMISSIONS,
  getSessionFromContext,
  resolveCookieSecure: (c) =>
    resolveCookieSecure(
      { get: (n) => c.req.header(n) ?? null },
      { appPublicUrl: process.env.APP_PUBLIC_URL, appBaseUrl: process.env.APP_BASE_URL },
    ),
});
```

## Extinction marques (cutover)

Supprimer les jumeaux locaux :

| Fichier local | Remplacé par |
|---|---|
| `src/app/login/login-form.tsx` | `@creezio/auth/ui` → `LoginForm` |
| `src/components/auth/session-provider.tsx` | `@creezio/auth/ui` → `SessionProvider` |
| `src/lib/auth.ts` (gras) | `configureAuth` + helpers kit (stub ≤40 LOC OK) |
| `src/server/routes/auth.ts` (gras) | `createAuthRoutes(...)` |
| `src/server/hono-auth.ts` (gras) | `createHonoAuth(...)` |
| `electron/recovery-key.ts` | `@creezio/platform-core` |

## Hors scope (dette `mcp-facade`)

- `src/lib/mcp-oauth.ts`
- `src/server/mcp/oauth.ts`

Ne pas les avaler dans `@creezio/auth`. Ils peuvent importer les helpers session kit.

## Store credentials (rappel)

```ts
import { createSqliteAuthStore } from "@creezio/auth";
import { resolveCoreDbPath } from "@creezio/platform-core";

const auth = createSqliteAuthStore({
  coreDbPath: resolveCoreDbPath(ctx),
});
```
