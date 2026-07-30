# @creezio/api-kernel — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/api-kernel/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/db-scope.ts`](../src/db-scope.ts) | 133 | `CrossLayerWriteDeniedError`, `DbAccessMode`, `ScopedDbAccess`, `createScopedDbAccess`, `mountLayerRef` |
| [`src/hono.ts`](../src/hono.ts) | 219 | `HonoLike`, `ApiKernelHonoSpace`, `MountApiKernelOnHonoOptions`, `applyApiResponse`, `ApiKernelLike`, `ApiKernelResolver`, `apiKernelToHonoHandler`, `mountApiKernelOnHono` |
| [`src/index.ts`](../src/index.ts) | 53 | `CrossLayerWriteDeniedError`, `createScopedDbAccess`, `mountLayerRef`, `API_CORE_PREFIX`, `API_MODULES_PREFIX`, `API_PLATFORM_PREFIX`, `API_PLUGINS_PREFIX`, `API_V1_PREFIX` |
| [`src/kernel.ts`](../src/kernel.ts) | 384 | `API_V1_PREFIX`, `API_CORE_PREFIX`, `API_PLATFORM_PREFIX`, `API_MODULES_PREFIX`, `API_PLUGINS_PREFIX`, `ApiKernel`, `createApiKernel` |
| [`src/register.ts`](../src/register.ts) | 57 | `registerBrandModuleApis`, `ApiMountEntry`, `RegisterApiMountsInput`, `registerApiMounts` |
| [`src/types.ts`](../src/types.ts) | 106 | `ApiSpace`, `ApiRequest`, `ApiPluginAccessDecision`, `ApiAuthorizePluginAccessFn`, `ApiResponse`, `ApiHandlerContext`, `ApiMountHandler`, `ApiMount` |

---

## Détail par fichier

### `src/db-scope.ts`

- **Lignes** : 133
- **Exports** : `CrossLayerWriteDeniedError`, `DbAccessMode`, `ScopedDbAccess`, `createScopedDbAccess`, `mountLayerRef`

Accès DB scopé par couche (H2.2) — deny-by-default cross-layer write.
Un mount module (brand) ou plugin ne reçoit qu'un handle sur sa couche.
Platform → couche core. Toute tentative d'écriture core depuis brand/plugin
→ CrossLayerWriteDeniedError.

### `src/hono.ts`

- **Lignes** : 219
- **Exports** : `HonoLike`, `ApiKernelHonoSpace`, `MountApiKernelOnHonoOptions`, `applyApiResponse`, `ApiKernelLike`, `ApiKernelResolver`, `apiKernelToHonoHandler`, `mountApiKernelOnHono`

Adaptateur Hono officiel — délègue les espaces façade au kernel.
Usage typique (app marque avec `.basePath("/api/v1")`) :
```ts
import { mountApiKernelOnHono } from "@creezio/api-kernel";
import { getBrandModuleApi } from "@/lib/brand-module-api";
mountApiKernelOnHono(api, getBrandModuleApi(), {
  spaces: ["core", "platform", "modules", "plugins"],
});
// Routes flat Hono (/tasks, /panier, /auth…) restent en parallèle (dette cutover).
```

### `src/index.ts`

- **Lignes** : 53
- **Exports** : `CrossLayerWriteDeniedError`, `createScopedDbAccess`, `mountLayerRef`, `API_CORE_PREFIX`, `API_MODULES_PREFIX`, `API_PLATFORM_PREFIX`, `API_PLUGINS_PREFIX`, `API_V1_PREFIX`, `createApiKernel`, `registerApiMounts`, `apiKernelToHonoHandler`, `applyApiResponse`, `mountApiKernelOnHono`

@creezio/api-kernel — façade HTTP unique (Phase H1.1 / isolation H2 / P17).

### `src/kernel.ts`

- **Lignes** : 384
- **Exports** : `API_V1_PREFIX`, `API_CORE_PREFIX`, `API_PLATFORM_PREFIX`, `API_MODULES_PREFIX`, `API_PLUGINS_PREFIX`, `ApiKernel`, `createApiKernel`

Façade API Creezio — registre + routes cœur + deny-by-default cross-write.
H2 : ScopedDbAccess injecté quand `sqliteRuntime` est fourni.
P17 : espaces core / platform / modules / plugins.

### `src/register.ts`

- **Lignes** : 57
- **Exports** : `registerBrandModuleApis`, `ApiMountEntry`, `RegisterApiMountsInput`, `registerApiMounts`

Helpers DX — enregistrement batch de mounts + factory marque documentée.
Pattern recommandé (Electron + Next, une seule SoT) :
```ts
// modules/register-brand-api.ts
export function registerBrandModuleApis(api: ApiKernel): void {
  registerApiMounts(api, {
    modules: [
      ["panier", createPanierMount()],
      ["dispatch", createDispatchMount()],
    ],
  });
}
// brand-runtime.ts + brand-module-api.ts
const api = createApiKernel({ brandId, sqliteRuntime });
registerBrandModuleApis(api);
registerApiMounts(api, {
  platform: [
    ["platform-tasks", createTasksApiMount(tasks)],
    ["platf

### `src/types.ts`

- **Lignes** : 106
- **Exports** : `ApiSpace`, `ApiRequest`, `ApiPluginAccessDecision`, `ApiAuthorizePluginAccessFn`, `ApiResponse`, `ApiHandlerContext`, `ApiMountHandler`, `ApiMount`, `ApiKernelOptions`, `MountedApiInfo`

Contrats HTTP façade Creezio — indépendants d'Express/Fastify/Next.

