# `@creezio/api-kernel`

Façade HTTP unique Creezio (P17) : **un** préfixe `/api/v1`, quatre espaces,
deny-by-default cross-write, isolation DB par couche. **Zéro** route métier
TempoFlow / Certivan / Fidu dans le kit.

## Espaces (façade unique)

```text
/api/v1
├── /core/*                         ← kit (health, version, architecture)
├── /platform/<id>/*                ← APIs plateforme kit (DB core)
├── /modules/<id>/*                 ← métier marque (DB brand)
└── /plugins/<id>/*                 ← plugins installés (DB plugin/<id>)
```

| Espace | Préfixe | API registre | Couche DB |
|--------|---------|--------------|-----------|
| Cœur | `/api/v1/core/*` | routes kit | `core` |
| Platform | `/api/v1/platform/<id>/*` | `registerPlatformApi` | `core` |
| Modules | `/api/v1/modules/<id>/*` | `registerModuleApi` | `brand` |
| Plugins | `/api/v1/plugins/<id>/*` | `registerPluginApi` | `plugin/<id>` |

### Interdit

```ts
// ❌ Abus historique — tasks/mails ne sont PAS des modules marque
api.registerModuleApi("platform-tasks", createTasksApiMount(tasks));

// ✅ Espace platform (DB core)
api.registerPlatformApi("platform-tasks", createTasksApiMount(tasks));
api.registerPlatformApi("platform-mails", createMailsApiMount(mails));
api.registerPlatformApi("observability", createObservabilityApiMount(obs));
api.registerPlatformApi("automations", createAutomationsApiMount(automations));
```

`registerModuleApi("platform-*")` **lève** une erreur explicite.

## Isolation DB (H2.2)

Si `sqliteRuntime` est fourni, chaque mount reçoit `ctx.db` (`ScopedDbAccess`) :

- `platform` → couche **core**
- `module` → couche **brand**
- `plugin` → couche **plugin/\<id\>**

Toute tentative `db.access({ kind: "core" }, "write")` depuis brand/plugin →
**403** `cross_layer_write_denied`.

## Brancher Hono (marques Next)

Les marques exposent encore des routes **flat** Hono (`/tasks`, `/panier`,
`/auth`, `/email`…) consommées par l'UI. La façade kernel se monte **en
parallèle** sur les espaces documentés — sans big-bang métier.

```ts
import { mountApiKernelOnHono } from "@creezio/api-kernel";
import { getTempoflowModuleApi } from "@/lib/brand-module-api";

export const api = new OpenAPIHono().basePath("/api/v1");

// Façade unique — process Next (pas seulement Electron/MCP)
mountApiKernelOnHono(api, getTempoflowModuleApi(), {
  spaces: ["core", "platform", "modules", "plugins"],
});

// Dette temporaire (cutovers packages dédiés) :
api.route("/tasks", tasksRoutes);
api.route("/panier", panierRoutes);
api.route("/auth", authRoutes);
// …
```

Preuve mesurable : `GET /api/v1/core/health` et
`GET /api/v1/modules/<id>/…` passent par `kernel.handle` dans le process Next.

Le bridge fait `next()` sur les 404 kernel (`platform_not_mounted`, etc.) pour
ne pas voler les routes flat voisines (ex. `/platform/contract`).

## Une seule factory mounts (anti-duplication)

SoT des mounts métier = `electron/modules/*/api-mount.ts` (symlink
`crm/modules`). Electron `brand-runtime` et Next `brand-module-api` doivent
appeler **la même** fonction d'enregistrement :

```ts
// modules/register-brand-api.ts
import { registerApiMounts, type ApiKernel } from "@creezio/api-kernel";
import { createPanierMount, createDispatchMount /* … */ } from "./index";

export function registerBrandModuleApis(api: ApiKernel): void {
  registerApiMounts(api, {
    modules: [
      ["panier", createPanierMount()],
      ["dispatch", createDispatchMount()],
      // …
    ],
  });
}
```

```ts
// src/lib/brand-module-api.ts — mince (modèle Fidu)
const api = createApiKernel({ brandId, sqliteRuntime: createNextSqliteRuntimeShim() });
registerBrandModuleApis(api);
```

Pas de `MountGold` / copies de logique dans `brand-module-api.ts`.

## Usage kernel nu

```ts
import { createApiKernel, registerApiMounts } from "@creezio/api-kernel";
import { createSqliteRuntime } from "@creezio/platform-core";

const runtime = createSqliteRuntime({ ctx });
const api = createApiKernel({ brandId: "demobrand", sqliteRuntime: runtime });

registerApiMounts(api, {
  modules: [
    ["catalog", {
      handle: async (ctx) => ({ status: 200, body: { layer: ctx.db?.layer } }),
    }],
  ],
  platform: [
    ["platform-tasks", createTasksApiMount(tasks)],
  ],
});

const res = await api.handle({ method: "GET", path: "/api/v1/core/health" });
```

## Dette flat Hono (assumée)

Reste hors kernel jusqu'aux missions packages dédiées :

| Domaine | Ex. routes flat | Cible cutover |
|---------|-----------------|---------------|
| Auth | `/api/v1/auth` | `@creezio/auth` |
| Tasks UI | `/api/v1/tasks` | `@creezio/tasks` (+ `/platform/platform-tasks`) |
| Mails | `/api/v1/email` | `@creezio/mails` |
| Assistant | `/api/v1/assistant` | `@creezio/assistant` |
| Métier marque | `/panier`, `/dossiers`, … | mounts `/modules/<id>` + UI |

Cette dette **n'est pas** un second design API : c'est un backlog de cutover
route-par-route. La façade unique = espaces `core` / `platform` / `modules` /
`plugins`.
