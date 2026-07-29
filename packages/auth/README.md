# `@creezio/auth`

Session / login / logout / recovery — **natif Creezio**, indépendant de la marque.

- Schéma tables : **sqlite core** (`AUTH_CORE_SQL`) — migrations H2 + store I1
- Store mémoire (tests) + **`createSqliteAuthStore`** (persistance core.db)
- Driver injecté (`openDatabase`) : défaut `node:sqlite` ; Electron → better-sqlite3
- Handlers IPC branchables sur `IpcChannels.auth` (`@creezio/shell`)
- Recovery key via `@creezio/platform-core`

## Mémoire (tests)

```ts
import { createMemoryAuthStore, bindAuthIpcHandlers } from "@creezio/auth";

const auth = createMemoryAuthStore();
await auth.register({ email: "a@b.c", password: "x", displayName: "A" });
const session = await auth.login({ email: "a@b.c", password: "x" });
```

## SQLite core (I1 — production / demobrand)

```ts
import { createSqliteAuthStore } from "@creezio/auth";
import { resolveCoreDbPath } from "@creezio/platform-core";

const auth = createSqliteAuthStore({
  coreDbPath: resolveCoreDbPath(ctx),
  // openDatabase: (p) => require("better-sqlite3")(p), // Electron
});
await auth.register({ email: "a@b.c", password: "secret" });
const session = await auth.login({ email: "a@b.c", password: "secret" });
// … restart process → getSession(session.token) toujours valide
auth.close();
```

Le DDL est appliqué à l’ouverture (`CREATE TABLE IF NOT EXISTS`).  
Avec `SqliteRuntime`, préférer aussi la migration `AUTH_CORE_SQL` au boot (H2).
