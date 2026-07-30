# @creezio/auth — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/auth/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/config.ts`](../src/config.ts) | 74 | `AuthConfig`, `configureAuth`, `getAuthConfig`, `getAuthCookieName`, `resetAuthConfigForTests` |
| [`src/env-store.ts`](../src/env-store.ts) | 160 | `getKitAuthStore`, `KitAuthResult`, `migrateBrandCredentialsToKit`, `authenticateViaKit`, `countKitAuthUsers` |
| [`src/hono-middleware.ts`](../src/hono-middleware.ts) | 308 | `PublicApiKeyRecord`, `HonoAuthAdapters`, `HonoAuthMiddleware`, `createHonoAuth` |
| [`src/hono-routes.ts`](../src/hono-routes.ts) | 374 | `AuthRouteUser`, `AuthRouteAdapters`, `createAuthRoutes` |
| [`src/index.ts`](../src/index.ts) | 104 | `AUTH_CORE_SQL`, `createMemoryAuthStore`, `createSqliteAuthStore`, `openNodeSqliteDatabase`, `hashPassword`, `hashToken`, `newToken`, `verifyPassword` |
| [`src/ipc.ts`](../src/ipc.ts) | 115 | `IpcHandleFn`, `AuthIpcBindings`, `bindAuthIpcHandlers`, `authLoginWithStore` |
| [`src/memory-store.ts`](../src/memory-store.ts) | 165 | `createMemoryAuthStore` |
| [`src/password.ts`](../src/password.ts) | 34 | `hashPassword`, `verifyPassword`, `hashToken`, `newToken` |
| [`src/schema.ts`](../src/schema.ts) | 24 | `AUTH_CORE_SQL` |
| [`src/session-types.ts`](../src/session-types.ts) | 57 | `AuthSessionUser`, `SessionRole`, `SessionPayload`, `SessionCookieSecureOpts`, `SessionCookieOptions`, `NavAccessAdapters`, `SessionUserLookup` |
| [`src/session.ts`](../src/session.ts) | 250 | `isAuthDisabled`, `getAuthCredentials`, `validateEnvCredentials`, `createSessionToken`, `createSessionTokenForUsername`, `verifySessionToken`, `getSession`, `sessionCookieOptions` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 45 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | 240 | `SqliteAuthStore`, `CreateSqliteAuthStoreOptions`, `createSqliteAuthStore` |
| [`src/types.ts`](../src/types.ts) | 51 | `AuthUser`, `AuthSession`, `AuthRegisterInput`, `AuthLoginInput`, `AuthAccountPublic`, `AuthStore` |
| [`ui/index.ts`](../ui/index.ts) | 16 | `LoginForm`, `SessionProvider`, `useSession` |
| [`ui/login-form.tsx`](../ui/login-form.tsx) | 330 | `LoginFormProps`, `LoginForm` |
| [`ui/session-provider.tsx`](../ui/session-provider.tsx) | 247 | `SessionRole`, `SessionMe`, `SessionContextValue`, `SessionProviderProps`, `SessionProvider`, `useSession` |

---

## Détail par fichier

### `src/config.ts`

- **Lignes** : 74
- **Exports** : `AuthConfig`, `configureAuth`, `getAuthConfig`, `getAuthCookieName`, `resetAuthConfigForTests`

Configuration auth marque — cookie / permissions owner.
Aucun nom de cookie ni bridge hardcodé dans le kit.

### `src/env-store.ts`

- **Lignes** : 160
- **Exports** : `getKitAuthStore`, `KitAuthResult`, `migrateBrandCredentialsToKit`, `authenticateViaKit`, `countKitAuthUsers`

Auth SoT via env `CREEZIO_CORE_DB_PATH` / `DB_PATH` (process Next/CRM) — M8.

### `src/hono-middleware.ts`

- **Lignes** : 308
- **Exports** : `PublicApiKeyRecord`, `HonoAuthAdapters`, `HonoAuthMiddleware`, `createHonoAuth`

Middlewares session Hono génériques.
Les clés API publiques / scopes sont injectés par la marque.

### `src/hono-routes.ts`

- **Lignes** : 374
- **Exports** : `AuthRouteUser`, `AuthRouteAdapters`, `createAuthRoutes`

Factory routes auth Hono (login / logout / me / impersonation / AI workspace).
Lookup users + ACL injectés — le kit ne connaît pas le métier marque.

### `src/index.ts`

- **Lignes** : 104
- **Exports** : `AUTH_CORE_SQL`, `createMemoryAuthStore`, `createSqliteAuthStore`, `openNodeSqliteDatabase`, `hashPassword`, `hashToken`, `newToken`, `verifyPassword`, `authLoginWithStore`, `bindAuthIpcHandlers`, `authenticateViaKit`, `countKitAuthUsers`, `getKitAuthStore`, `migrateBrandCredentialsToKit`, `configureAuth`, `getAuthConfig`, `getAuthCookieName`, `resetAuthConfigForTests`, `clearSessionCookieOptions`, `createSessionToken`, `createSessionTokenForUsername`, `getAuthCredentials`, `getSession`, `isAuthDisabled`, `sessionActorIsOwner`, `sessionCanAccessPath`, `sessionCookieOptions`, `sessionIsImpersonating`, `toHonoCookie`, `validateEnvCredentials`, `verifySessionToken`, `createHonoAuth`, `createAuthRoutes`, `createRecoveryVerifier`, `generateRecoveryKey`, `normalizeRecoveryKey`, `unwrapSecretsWithRecoveryKey`, `verifyRecoveryKey`, `wrapSecretsWithRecoveryKey`

@creezio/auth — session native Creezio (store + JWT + Hono + UI).
UI React : `@creezio/auth/ui`.
Recovery crypto : `@creezio/platform-core` (réexporté ci-dessous).

### `src/ipc.ts`

- **Lignes** : 115
- **Exports** : `IpcHandleFn`, `AuthIpcBindings`, `bindAuthIpcHandlers`, `authLoginWithStore`

Bind handlers IPC auth sur les canaux `@creezio/shell` IpcChannels.auth.
L'hôte Electron fournit `handle(channel, fn)`.

### `src/memory-store.ts`

- **Lignes** : 165
- **Exports** : `createMemoryAuthStore`

Store auth mémoire — tests + sandbox sans sqlite.

### `src/password.ts`

- **Lignes** : 34
- **Exports** : `hashPassword`, `verifyPassword`, `hashToken`, `newToken`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/schema.ts`

- **Lignes** : 24
- **Exports** : `AUTH_CORE_SQL`

DDL auth — tables dans sqlite **core** (pas brand). 
export const AUTH_CORE_SQL = `
CREATE TABLE IF NOT EXISTS creezio_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  stay_logged_in INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

### `src/session-types.ts`

- **Lignes** : 57
- **Exports** : `AuthSessionUser`, `SessionRole`, `SessionPayload`, `SessionCookieSecureOpts`, `SessionCookieOptions`, `NavAccessAdapters`, `SessionUserLookup`

Types session JWT génériques (indépendants du métier users marque).

### `src/session.ts`

- **Lignes** : 250
- **Exports** : `isAuthDisabled`, `getAuthCredentials`, `validateEnvCredentials`, `createSessionToken`, `createSessionTokenForUsername`, `verifySessionToken`, `getSession`, `sessionCookieOptions`, `clearSessionCookieOptions`, `sessionActorIsOwner`, `sessionIsImpersonating`, `sessionCanAccessPath`, `toHonoCookie`

Helpers session JWT cookie Next — génériques, cookieName via configureAuth.

### `src/sqlite-driver.ts`

- **Lignes** : 45
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal pour @creezio/auth (Phase I1).
Compatible better-sqlite3 et node:sqlite DatabaseSync.
Pas d'`import.meta` — dual-build CJS Electron.

### `src/sqlite-store.ts`

- **Lignes** : 240
- **Exports** : `SqliteAuthStore`, `CreateSqliteAuthStoreOptions`, `createSqliteAuthStore`

Store auth persisté dans sqlite **core** (Phase I1).

### `src/types.ts`

- **Lignes** : 51
- **Exports** : `AuthUser`, `AuthSession`, `AuthRegisterInput`, `AuthLoginInput`, `AuthAccountPublic`, `AuthStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 16
- **Exports** : `LoginForm`, `SessionProvider`, `useSession`

@creezio/auth/ui — LoginForm + SessionProvider (React / Next).
Bridge desktop : configureShellUiBrand({ desktopApiGlobal }) côté marque.

### `ui/login-form.tsx`

- **Lignes** : 330
- **Exports** : `LoginFormProps`, `LoginForm`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/session-provider.tsx`

- **Lignes** : 247
- **Exports** : `SessionRole`, `SessionMe`, `SessionContextValue`, `SessionProviderProps`, `SessionProvider`, `useSession`

_(pas de cartouche JSDoc en tête — voir le code)_

