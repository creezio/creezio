# `@creezio/assistant`

Assistant / chat **plateforme** (pas de skills métier marque).

- Store conversations mémoire (H1) ; chemin DB historique `resolveAssistantDbPath`
  documenté — migration progressive vers sqlite core possible
- Surfaces IPC : `IpcChannels.assistant` / `IpcChannels.llm` (`@creezio/shell`)

```ts
import { createMemoryAssistantStore } from "@creezio/assistant";
const a = createMemoryAssistantStore();
const c = a.createConversation({ title: "Demo" });
a.appendMessage(c.id, { role: "user", content: "hello" });
```
