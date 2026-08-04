# @creezio/api-kernel

## Rôle

`@creezio/api-kernel` fournit la façade HTTP unique Creezio. Il normalise l'accès aux API kit, plateforme, métier marque et plugins sous un seul préfixe `/api/v1`, avec un registre de mounts et une isolation DB deny-by-default.

Espaces publics :

```text
/api/v1
├── /core/*                  routes kit intégrées
├── /platform/<id>/*         APIs plateforme kit, couche DB core
├── /modules/<id>/*          modules métier marque, couche DB brand
└── /plugins/<id>/*          plugins installés, couche DB plugin/<id>
```

Le package est indépendant du framework HTTP. Il expose un kernel pur (`createApiKernel`) et un adaptateur Hono (`mountApiKernelOnHono`) pour les apps Next/Hono existantes.

## Périmètre (kit vs marque)

### Ce qui appartient au kit

- Le préfixe officiel `/api/v1` et ses constantes :
  - `API_V1_PREFIX`
  - `API_CORE_PREFIX`
  - `API_PLATFORM_PREFIX`
  - `API_MODULES_PREFIX`
  - `API_PLUGINS_PREFIX`
- Les contrats HTTP framework-agnostic :
  - `ApiRequest`, `ApiResponse`, `ApiHandlerContext`, `ApiMount`, `ApiKernelOptions`, `MountedApiInfo`.
- Le registre runtime :
  - `registerPlatformApi`, `registerModuleApi`, `registerPluginApi` ;
  - unregister et `listMounts`.
- Les routes core intégrées :
  - `GET /api/v1/core/health`
  - `GET /api/v1/core/version`
  - `GET /api/v1/core/architecture`
  - `GET /api/v1/core/sqlite/status`
  - `GET /api/v1/core/db/ping` si `sqliteRuntime` est fourni.
- L'isolation DB par couche via `createScopedDbAccess` et `CrossLayerWriteDeniedError`.
- L'adaptateur Hono officiel.
- Le helper `registerApiMounts` pour enregistrer des mounts par lot.

### Ce qui reste côté marque

- Les routes métier et leurs handlers `ApiMount`.
- Le choix des IDs de modules (`panier`, `dispatch`, `catalog`, etc.).
- La création du `SqliteRuntime` et l'injection de migrations brand.
- L'enregistrement des APIs plateforme concrètes (`platform-tasks`, `platform-mails`, `observability`, `automations`, etc.).
- La policy ACL plugin fournie via `authorizePluginAccess`.
- Les éventuelles routes Hono propres à la marque, servies en parallèle des espaces kernel (contrat de composition — fallthrough).

Le kit interdit explicitement `registerModuleApi("platform-*")`. Les APIs plateforme doivent être montées dans l'espace `/platform/<id>` pour recevoir la couche `core`.

## Installation / build

Dans le monorepo :

```bash
npm run build -w @creezio/api-kernel
npm run typecheck -w @creezio/api-kernel
```

Manifest package :

- `main`: `./dist-cjs/index.js`
- `module`: `./dist/index.js`
- `types`: `./dist/index.d.ts`
- export public unique : `@creezio/api-kernel`

Dépendances runtime :

- `@creezio/brand-config`
- `@creezio/platform-core`
- `hono`

Dev dependencies : `typescript`, `@types/node`.

## Configuration (env, configure*, bindings)

`api-kernel` ne lit pas directement l'environnement. Il se configure via `createApiKernel(options)` :

```ts
import { createApiKernel } from "@creezio/api-kernel";

const api = createApiKernel({
  brandId: "tempoflow",
  appVersion: "0.10.26",
  architectureVersion: "H2",
  sqliteRuntime,
  authorizePluginAccess: async ({ pluginId, method, subPath }) => {
    if (pluginId === "disabled") {
      return { allow: false, reason: "plugin_disabled", status: 403 };
    }
    return { allow: true };
  },
});
```

Options :

- `brandId` : exposé dans les routes core.
- `architectureVersion` : override optionnel ; défaut `ARCHITECTURE_VERSION` de `@creezio/platform-core`.
- `appVersion` : version affichée par `/core/version`, défaut `0.0.0`.
- `sqliteRuntime` : injecte `ctx.db` dans les mounts.
- `authorizePluginAccess` : garde ACL avant dispatch dans `/plugins/<id>`.

Binding Hono :

```ts
import { mountApiKernelOnHono } from "@creezio/api-kernel";

mountApiKernelOnHono(app, () => getBrandApiKernel(), {
  spaces: ["core", "platform", "modules", "plugins"],
  fallthroughOnNotFound: true,
});
```

Le getter lazy évite d'ouvrir SQLite au moment de l'import du module Hono.

## API publique (exports principaux avec exemples TS)

### Constantes de préfixe

```ts
import {
  API_CORE_PREFIX,
  API_MODULES_PREFIX,
  API_PLATFORM_PREFIX,
  API_PLUGINS_PREFIX,
  API_V1_PREFIX,
} from "@creezio/api-kernel";

API_V1_PREFIX;       // "/api/v1"
API_CORE_PREFIX;     // "/api/v1/core"
API_PLATFORM_PREFIX; // "/api/v1/platform"
API_MODULES_PREFIX;  // "/api/v1/modules"
API_PLUGINS_PREFIX;  // "/api/v1/plugins"
```

### Kernel nu

```ts
import {
  createApiKernel,
  registerApiMounts,
  type ApiMount,
} from "@creezio/api-kernel";

const catalogMount: ApiMount = {
  handle: async (ctx) => {
    if (ctx.req.method !== "GET") {
      return { status: 405, body: { ok: false, error: "method_not_allowed" } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        mountId: ctx.mountId,
        subPath: ctx.subPath,
        dbLayer: ctx.db?.layer,
      },
    };
  },
};

const api = createApiKernel({
  brandId: "demobrand",
  sqliteRuntime,
});

const tasksMount: ApiMount = {
  handle: () => ({ status: 200, body: { ok: true, domain: "tasks" } }),
};

registerApiMounts(api, {
  modules: [["catalog", catalogMount]],
  platform: [["platform-tasks", tasksMount]],
});

const res = await api.handle({
  method: "GET",
  path: "/api/v1/modules/catalog/items",
});
```

### Méthodes `ApiKernel`

```ts
const mailsMount: ApiMount = {
  handle: () => ({ status: 200, body: { ok: true, domain: "mails" } }),
};
const panierMount: ApiMount = {
  handle: () => ({ status: 200, body: { ok: true, domain: "panier" } }),
};
const pluginMount: ApiMount = {
  handle: () => ({ status: 200, body: { ok: true, domain: "plugin" } }),
};

api.registerPlatformApi("platform-mails", mailsMount);
api.registerModuleApi("panier", panierMount);
api.registerPluginApi("meteo", pluginMount);

api.unregisterPlatformApi("platform-mails");
api.unregisterModuleApi("panier");
api.unregisterPluginApi("meteo");

const mounts = api.listMounts();
```

IDs valides : regex `^[a-z][a-z0-9_-]{0,62}$`.

Interdit :

```ts
api.registerModuleApi("platform-tasks", tasksMount);
// throw: utiliser registerPlatformApi("platform-tasks", ...)
```

### Routes core intégrées

```ts
await api.handle({ method: "GET", path: "/api/v1/core/health" });
// { ok: true, space: "core", brandId, ts }

await api.handle({ method: "GET", path: "/api/v1/core/version" });
// { ok: true, version, architectureVersion, brandId }

await api.handle({ method: "GET", path: "/api/v1/core/architecture" });
// expose layout SQLite, espaces, isolation, mounts et status runtime partiel

await api.handle({ method: "GET", path: "/api/v1/core/sqlite/status" });
// 503 si sqliteRuntime absent
```

### Accès DB scopé

Quand `sqliteRuntime` est fourni, chaque mount reçoit `ctx.db` :

- mount `platform` → couche `core` ;
- mount `module` → couche `brand` ;
- mount `plugin` → couche `plugin/<id>`.

```ts
import type { ApiMount } from "@creezio/api-kernel";

const moduleMount: ApiMount = {
  handle: (ctx) => {
    ctx.db?.exec("CREATE TABLE IF NOT EXISTS brand_items (id TEXT);");

    // Refusé : un module brand ne peut pas lire/écrire core.
    ctx.db?.access({ kind: "core" }, "write");

    return { status: 200, body: { ok: true } };
  },
};
```

L'accès cross-layer depuis `brand` ou `plugin` lève `CrossLayerWriteDeniedError`, convertie en réponse 403 par le kernel :

```json
{
  "ok": false,
  "error": "cross_layer_write_denied"
}
```

Un mount `platform` (couche `core`) peut accéder aux couches brand/plugin pour les opérations d'administration kit.

### Helpers DB scope

```ts
import {
  CrossLayerWriteDeniedError,
  createScopedDbAccess,
  mountLayerRef,
} from "@creezio/api-kernel";

const own = mountLayerRef("plugin", "meteo");
// { kind: "plugin", pluginId: "meteo" }

const db = createScopedDbAccess(sqliteRuntime, own);
db.prepare("SELECT 1").get();

try {
  db.access({ kind: "core" }, "read");
} catch (err) {
  if (err instanceof CrossLayerWriteDeniedError) {
    console.error(err.from, err.to);
  }
}
```

### Adaptateur Hono

```ts
import {
  apiKernelToHonoHandler,
  mountApiKernelOnHono,
} from "@creezio/api-kernel";

// app est souvent new OpenAPIHono().basePath("/api/v1")
mountApiKernelOnHono(app, () => getBrandModuleApi(), {
  spaces: ["core", "platform", "modules", "plugins"],
  fallthroughOnNotFound: true,
});

// Usage bas niveau si besoin :
app.all("/core/*", apiKernelToHonoHandler(() => getBrandModuleApi()));
```

`fallthroughOnNotFound` vaut `true` par défaut. Les 404 kernel de type `not_found`, `platform_not_mounted`, `module_not_mounted`, `plugin_not_mounted` et `core_route_not_found` appellent `next()` pour laisser les routes Hono flat existantes répondre.

### Types framework-agnostic

```ts
import type {
  ApiAuthorizePluginAccessFn,
  ApiHandlerContext,
  ApiKernelOptions,
  ApiMountHandler,
  ApiRequest,
  ApiResponse,
  ApiSpace,
  MountedApiInfo,
} from "@creezio/api-kernel";
```

`ApiRequest.path` doit être un path absolu commençant par `/api/v1/...`; la query string est stripée par le kernel.

## Flux / fonctionnement

1. L'app crée un `SqliteRuntime` via `@creezio/platform-core` si elle veut l'isolation DB.
2. Elle crée le kernel avec `createApiKernel`.
3. Elle enregistre les mounts :
   - `registerPlatformApi` pour les domaines plateforme ;
   - `registerModuleApi` pour le métier marque ;
   - `registerPluginApi` pour les plugins installés.
4. Une requête arrive sur `/api/v1/...`.
5. `handle(req)` normalise le path et route vers core/platform/module/plugin.
6. Pour un mount :
   - le kernel valide le subpath ;
   - bloque les tentatives évidentes de cross-write (`__cross`, `core`, `..`) sur méthodes d'écriture si `allowCrossWrite` n'est pas `true` ;
   - injecte `ctx.db` si `sqliteRuntime` existe ;
   - appelle `mount.handle(ctx)`.
7. Les erreurs `CrossLayerWriteDeniedError` sont transformées en 403.
8. Pour `/plugins/<id>`, `authorizePluginAccess` est appelé avant le handler si fourni.

## Intégration marques (TempoFlow, Certivan, Fidu, DemoBrand)

### TempoFlow

- `brandId`: `tempoflow`.
- Les modules métier historiques (`panier`, `dispatch`, dossiers, etc.) doivent être montés sous `/api/v1/modules/<id>`.
- Les packages plateforme (`tasks`, `mails`, `observability`, `automations`) doivent être montés sous `/api/v1/platform/<id>`, pas comme modules.
- Les routes Hono propres à la marque peuvent rester en parallèle des espaces kernel (fallthrough).

### Certivan

- `brandId`: `certivan`.
- Même découpage : métier Certivan dans `/modules`, fonctionnalités kit dans `/platform`.
- Le bridge Hono peut être monté avec un getter lazy pour ne pas ouvrir SQLite à l'import.

### Fidu

- `brandId`: `fidu`.
- Fidu peut consommer les routes core et modules sans plugins/fleet actifs.
- Ne pas supposer que `/plugins/<id>` a des mounts si le runtime plugins est feature-off.
- Les API plateforme restent en couche `core` même si certains domaines sont absents.

### DemoBrand

- `brandId`: `demobrand`.
- Marque sandbox idéale pour tester la façade sans dette flat complexe.
- Exemple minimal :

```ts
const api = createApiKernel({ brandId: "demobrand", sqliteRuntime });
api.registerModuleApi("catalog", {
  handle: () => ({ status: 200, body: { ok: true } }),
});
```

## Dépendances @creezio/*

- `@creezio/platform-core`
  - `ARCHITECTURE_VERSION`
  - `SqliteRuntime`, `SqliteLayerRef`, `SqliteHandle`
  - runtime multi-DB consommé par l'isolation DB.
- `@creezio/brand-config`
  - déclaré comme dépendance du package ; le kernel expose `brandId` mais ne choisit pas lui-même le manifest.
- Consommateurs typiques :
  - packages plateforme (`tasks`, `mails`, `assistant`, `observability`, `automations`, etc.) qui exposent des `ApiMount`;
  - apps de marque Next/Hono ;
  - runtime Electron/brand qui crée le kernel côté serveur local.

## Voir aussi

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
