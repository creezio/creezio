# `@creezio/assistant`

Assistant / chat **plateforme** Creezio (store + runtime + UI).

Pas de métier panier / dispatch / relevés — injection marque via
`configureAssistantBrand`.

## Couches

| Couche | Import | Contenu |
|--------|--------|---------|
| Store (I2) | `@creezio/assistant` | `createSqliteAssistantStore`, mémoire |
| Runtime (N3) | `@creezio/assistant` | agent-loop, hermes, chat-db, meili-rag, routing, surface… |
| UI (N3) | `@creezio/assistant/ui` | widget, provider, ui-driver, voice |

## Extension marque

```ts
import { configureAssistantBrand } from "@creezio/assistant";

configureAssistantBrand({
  identity: {
    productName: "MaMarque",
    uiStorageKey: "mamarque-assistant-ui",
    modeStorageKey: "mamarque-assistant-mode",
    desktopApiGlobal: "mamarqueDesktop",
    globalStorePrefix: "__mm",
  },
  appMap: { pages: [...] },
  prompts: {
    baseSystemPrompt: "...",
    toolDefinitions: [...],
    buildHermesWorkSystemBrief: (now, user) => `...`,
  },
  tools: {
    getEntity: (kind, id) => ({ kind, entity: null }),
    executeTool: async (name, args) => null,
    collectSourcesFromSqlRows: (rows) => [],
  },
  db: { queryAll, queryOne, getDbPath, getDb },
  meili: { indexes: [...], mapHit: (index, doc) => ({ ... }) },
  hermes: { defaultSkills: [...], kanbanTenant: "..." },
});
```

```tsx
import { AssistantWidget, AssistantProvider } from "@creezio/assistant/ui";
```

## Persistance

| Chemin | Usage |
|--------|--------|
| **`resolveCoreDbPath` / `SqliteRuntime.paths.core`** | **Cible** — `createSqliteAssistantStore` |
| `resolveAssistantDbPath` → `assistant_chats.db` | **Historique** marques (`chat-db` runtime) |
