# `@creezio/auth`

Session / login / logout / recovery — **natif Creezio**, indépendant de la marque.

- Schéma tables cible : **sqlite core** (`AUTH_CORE_SQL`)
- Store mémoire (tests) + store sqlite via driver injecté
- Handlers IPC branchables sur `IpcChannels.auth` (`@creezio/shell`)
- Recovery key via `@creezio/platform-core`

```ts
import { createMemoryAuthStore, bindAuthIpcHandlers } from "@creezio/auth";

const auth = createMemoryAuthStore();
await auth.register({ email: "a@b.c", password: "x", displayName: "A" });
const session = await auth.login({ email: "a@b.c", password: "x" });
```
