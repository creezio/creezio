# `@creezio/product-hub`

Product Hub / plugins natifs Creezio — lifecycle, ACL L3/L4, store `core.db`,
control-plane, **routes HTTP SoT**, provisioning n8n, fabrique conversationnelle,
UI admin.

## Montage HTTP marques (P09)

```ts
import {
  createPluginProductsRoutes,
  createPluginN8nProvisioning,
  createProductHubHost,
  productHubTokensFromManifest,
} from "@creezio/product-hub";

const host = createProductHubHost({
  requireStore,
  getStore,
  pluginsDir: () => process.env.MYBRAND_PLUGINS_DIR || "",
});

const n8n = createPluginN8nProvisioning({
  getDb: getProductHubBetterSqlite,
  tokens: productHubTokensFromManifest(myManifest),
  managedBy: "mybrand",
  modeLabel: "Tag dédié + registre MyBrand",
});

export const pluginProductsRoutes = createPluginProductsRoutes({
  host,
  store: requireStore,
  getActor: (c) => /* PluginAclActor depuis session / api key */,
  getSession: (c) => /* { sub } | null */,
  pluginsDir: () => process.env.MYBRAND_PLUGINS_DIR || "",
  documentsDir: () => resolvePluginDocumentsDir(),
  hermesContextDir: () => process.env.MYBRAND_HERMES_CONTEXT_DIR || null,
  apiUrlEnvHint: "$MYBRAND_API_URL",
  n8n,
  hermesCreateTask: hermesKanbanCreateTask, // injectable
  hermesSkills: ["mybrand-plugins"],
  openReadonlyPluginDb: (p) => openBetterSqliteReadonly(p),
  defaultOwnerOrgId: "org-mybrand",
});

// Auth outer reste côté marque :
api.use("/plugin-products", requireSessionOrApiKey);
api.use("/plugin-products/*", requireSessionOrApiKey);
api.route("/plugin-products", pluginProductsRoutes);
```

### Endpoints couverts

| Méthode | Chemin |
|---------|--------|
| GET | `/visible` |
| GET/POST | `/` |
| GET | `/:id` |
| POST | `/:id/transition` |
| POST | `/:id/prd` |
| POST | `/:id/clarifications` |
| POST | `/:id/clarifications/:clarificationId/answers` |
| POST | `/:id/prd/:revisionId/approve` |
| POST/PATCH | `/:id/tasks`, `/:id/tasks/:taskId` |
| POST | `/:id/tasks/:taskId/sync-hermes` |
| PATCH | `/:id/runtime-link` |
| POST/GET/DELETE | `/:id/documents…` |
| POST | `/:id/test-runs`, `/:id/human-qa` |
| GET | `/:id/data/tables…` |
| GET/POST | `/:id/n8n…` |
| POST | `/:id/archive` |

## Fabrique conversationnelle (P10)

```ts
import {
  createConversationalPluginFactory,
  createFsPluginScaffoldAdapters,
  createPluginFactoryRoutes,
} from "@creezio/product-hub";

const factory = createConversationalPluginFactory({
  store: requireStore(),
  ...createFsPluginScaffoldAdapters(pluginsDir()),
  installRuntime: async (pluginId, actor) => ({ dbOpened: false }),
});

api.route(
  "/plugin-factory",
  createPluginFactoryRoutes({
    factory,
    getActor,
    enabled: () => process.env.PRODUCT_HUB_FACTORY === "1",
  }),
);
```

Ne pas se contenter du prototype demobrand/console : shipper la conso dans
**≥1 marque** avec `features.plugins` on (TF ou CV).

## Fidu — `features.plugins=false`

Config optionnelle native (pas « plugins = métier Fidu ») :

- Manifest : `features.plugins: false` (`@creezio/brand-config` fidu)
- Pas de routes `/plugin-products` ni page `/admin/plugins`
- Store Product Hub + control-plane loopback peuvent rester montés
- Capacité kit native ; UI non forcée

## Extinction marques (cutover)

| Fichier local | Action |
|---------------|--------|
| `routes/plugin-products.ts` (~850 LOC) | → stub ≤40 LOC `createPluginProductsRoutes` |
| `lib/n8n-plugin-provisioning.ts` (~320 LOC) | → `createPluginN8nProvisioning` ou re-export |
| `lib/plugin-product-hub.ts` | garder shim host ≤40 LOC |
| `electron/plugin-hub-store.ts` | garder wiring bindings ≤40 LOC |
| Pages `admin/plugins` | rester sur `@creezio/product-hub/ui` |

Sync vendor : `CREEZIO_KIT_ROOT=… ROOT=crm bash scripts/sync-creezio-vendor.sh`
(ou wrapper marque `crm/scripts/electron/sync-creezio-vendor.sh`).

## UI Admin

```tsx
import { AdminPluginsList, AdminPluginDetail } from "@creezio/product-hub/ui";
```

## Vertical remaining

Voir `PRODUCT_HUB_VERTICAL_REMAINING` : plugin-git, plugin-data, accept-check,
test-runner, crm-key — hors scope P09 HTTP.
