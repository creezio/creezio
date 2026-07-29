# `@creezio/api-kernel`

Façade HTTP unique : routes **cœur** (`/api/v1/core/*`) + registre de montage
modules marque / plugins. **Zéro** route métier TempoFlow dans le kit.

## Préfixe domaine

Un seul préfixe documenté : **`/api/v1`**.

| Espace | Préfixe | Qui monte |
|--------|---------|-----------|
| Cœur | `/api/v1/core/*` | kit (health, version, architecture) |
| Modules | `/api/v1/modules/<id>/*` | repo marque via `registerModuleApi` |
| Plugins | `/api/v1/plugins/<id>/*` | Product Hub / install via `registerPluginApi` |

Cross-write deny-by-default : un handler monté ne peut pas écrire hors de son
espace sans `allowCrossWrite` explicite (refus 403).

## Isolation DB (H2.2)

Si `sqliteRuntime` est fourni, chaque mount reçoit `ctx.db` (`ScopedDbAccess`)
limité à sa couche (`module` → brand, `plugin` → `plugin/<id>`). Toute
tentative `db.access({ kind: "core" }, "write")` depuis brand/plugin → **403**
`cross_layer_write_denied`.

## Usage

```ts
import { createApiKernel } from "@creezio/api-kernel";
import { createSqliteRuntime } from "@creezio/platform-core";

const runtime = createSqliteRuntime({ ctx });
const api = createApiKernel({ brandId: "demobrand", sqliteRuntime: runtime });
api.registerModuleApi("catalog", {
  handle: async (ctx) => ({ status: 200, body: { layer: ctx.db?.layer } }),
});
const res = await api.handle({ method: "GET", path: "/api/v1/core/health" });
```
