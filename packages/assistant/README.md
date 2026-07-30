# `@creezio/assistant`

Assistant / chat **plateforme** Creezio (store + runtime + UI + surface HTTP).

Pas de métier panier / dispatch / relevés — injection marque via
`configureAssistantBrand`.

## Couches

| Couche | Import | Contenu |
|--------|--------|---------|
| Store (I2) | `@creezio/assistant` | `createSqliteAssistantStore`, mémoire |
| Runtime (N3) | `@creezio/assistant` | agent-loop, hermes, chat-db, meili-rag, routing, surface… |
| HTTP (D-P16) | `@creezio/assistant` | `createAssistantRoutes` — chat, conversations, ui/desktop-actions, Hermes… |
| UI (N3) | `@creezio/assistant/ui` | widget, provider, ui-driver, voice |

## Extension marque

```ts
import { configureAssistantBrand, mcpFacadeToAssistantConfig } from "@creezio/assistant";

configureAssistantBrand({
  // O4r : mcp + tasks (pas tools.executeTool métier)
  // mcp: mcpFacadeToAssistantConfig(facade),
  // tasks: { create, list },
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
    collectSourcesFromSqlRows: (rows) => [],
  },
  // mcp: mcpFacadeToAssistantConfig(facade),
  // tasks: { create, list },
  db: { queryAll, queryOne, getDbPath, getDb },
  meili: { indexes: [...], mapHit: (index, doc) => ({ ... }) },
  hermes: { defaultSkills: [...], kanbanTenant: "...", sessionIdPrefix: "mamarque-crm" },
});
```

```tsx
import { AssistantWidget, AssistantProvider } from "@creezio/assistant/ui";
```

## Montage HTTP marque

La logique HTTP (anciennement `crm/src/server/routes/assistant.ts` ~763 LOC)
vit dans le kit. La marque ne garde qu’un **stub** de montage :

```ts
// crm/src/server/routes/assistant.ts  (≤ ~40 LOC)
import "@/lib/assistant/configure-brand";
import { createAssistantRoutes } from "@creezio/assistant";
import { getSessionFromContext } from "../hono-auth";
import {
  registerDesktopBridge,
  unregisterDesktopBridge,
} from "@/lib/desktop-presence";

export const assistantRoutes = createAssistantRoutes({
  getSession: (c) => getSessionFromContext(c),
  desktopPresence: { registerDesktopBridge, unregisterDesktopBridge },
  // optionnel : usage analytics, Product Hub, features Fidu…
  // onChat: async (c) => { … recordUsageEvent … },
  // pluginProductHub: { listPluginProducts, pluginProductDetails },
  // desktopStreamAuth: "session", // Fidu
  // features: { agentProfile: false, hermesControls: false, conversationAcl: false },
});
```

Puis dans `app.ts` (inchangé) :

```ts
api.route("/assistant", assistantRoutes);
```

### Endpoints exposés

| Path | Notes |
|------|--------|
| `POST /chat` | → `handleAssistantChat` |
| `GET\|PUT /agent-profile` | feature `agentProfile` |
| `GET /plugin-approvals` | si `pluginProductHub` |
| `POST /ui-actions/:id/result` | résultat souris virtuelle |
| `GET /desktop-actions/stream` | SSE bridge Electron (canonique) |
| `GET /supplier-actions/stream` | **alias wire** historique TF |
| `POST /transcribe` | Whisper |
| `GET /models`, `/llm-status` | BYOK / modèles |
| `GET\|POST /hermes-*` | feature `hermesControls` |
| `GET\|POST\|PATCH\|DELETE /conversations…` | ACL optionnelle |

### Fichiers marque à **conserver** (config métier)

Ne pas avaler dans le kit :

- `src/lib/assistant/identity.ts`
- `app-map.ts`, `prompts.ts`, `work-briefs.ts`
- `meili-brand.ts`, `sql-tools.ts`, `sources.ts`, `entity-sources.ts`
- `brand-config.ts`, `configure-brand.ts`, `configure-brand-client.ts`
- `mcp-bridge.ts`, `tasks-adapter.ts` (adaptateurs minces)

### Fichiers marque à **supprimer / vider**

- `src/server/routes/assistant.ts` — remplacer par stub `createAssistantRoutes(…)`
- Toute copie locale de runtime chat / agent-loop / ui-actions

## Wire legacy (non API marque obligatoire)

Conservés pour compat Electron / UI existante — **pas** des contrats métier à reproduire :

| Wire | Remplacement préféré |
|------|----------------------|
| `supplier_*` tools / `/supplier-actions/stream` | `external_*` / `/desktop-actions/stream` |
| `fournisseurId` (active-surface) | `siteId` |
| `data-tf2-aid` / `data-tf2-assistant-ui` | attributs DOM partagés ×3 (historique) |

Desktop API : `identity.desktopApiGlobal` uniquement (fallback kit = `creezioDesktop`).

## Persistance

| Chemin | Usage |
|--------|--------|
| **`resolveCoreDbPath` / `SqliteRuntime.paths.core`** | **Cible** — `createSqliteAssistantStore` |
| `resolveAssistantDbPath` → `assistant_chats.db` | **Historique** marques (`chat-db` runtime) |
