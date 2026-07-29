# `@creezio/assistant`

Assistant / chat **plateforme** (pas de skills métier marque).

## Persistance (décision I2)

| Chemin | Usage |
|--------|--------|
| **`resolveCoreDbPath` / `SqliteRuntime.paths.core`** | **Cible** — `createSqliteAssistantStore` |
| `resolveAssistantDbPath` → `assistant_chats.db` | **Historique** marques ; migration progressive (I13 TF) |

- Store mémoire (tests H1)
- Surfaces IPC : `IpcChannels.assistant` / `IpcChannels.llm` (`@creezio/shell`)

## Mémoire

```ts
import { createMemoryAssistantStore } from "@creezio/assistant";
const a = createMemoryAssistantStore();
const c = a.createConversation({ title: "Demo" });
a.appendMessage(c.id, { role: "user", content: "hello" });
```

## SQLite core (I2)

```ts
import {
  ASSISTANT_CORE_SQL,
  createSqliteAssistantStore,
} from "@creezio/assistant";

// Migrer via SqliteRuntime + ASSISTANT_CORE_SQL, puis :
const a = createSqliteAssistantStore({ coreDbPath: runtime.paths.core });
const c = a.createConversation({ title: "Demo" });
a.appendMessage(c.id, { role: "user", content: "hello" });
// restart → listMessages(c.id) intact
a.close();
```
