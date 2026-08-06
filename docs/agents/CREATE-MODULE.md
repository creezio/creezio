# CREATE-MODULE — créer un module métier de marque

Guide pour ajouter un module métier dans un **repo marque** (jamais dans le
kit). Un module = migrations `brand.db` + mount API + (optionnel) tools MCP,
feed Meili, entrée de nav. Référence vivante : le repo `tempoflow3`
(`server/src/electron/brand-module-api.ts`).

## Où va quoi

| Élément | Fichier marque (convention TF3) |
|---|---|
| Migrations `brand.db` | `server/src/electron/brand-migrations.ts` |
| Mounts API métier | `server/src/electron/brand-module-api.ts` |
| Tools MCP métier | `server/src/electron/brand-mcp-tools.ts` + `server/ui/server/mcp/tool-registry.ts` |
| Nav métier | `server/src/electron/vertical-slot.ts` (`navItems` de `startBrandDesktop`) |
| Feed Meili | `server/src/electron/meili-feed.ts` |
| Pages UI métier | `server/ui/app/<route>/page.tsx` (prime sur les wrappers os-ui) |

## 1. Migration `brand.db`

Ajouter le SQL dans `brandMigrations()` — IDs stables
(`[a-z0-9][a-z0-9_.-]*`), jamais renommer une migration appliquée. Colonnes
implicites attendues par le moteur CRUD : `id`, `created_at`, `updated_at`
(+ `archived_at` si archivable).

## 2. Mount API — CRUD générique d'abord

Pour une entité CRUD standard, **ne pas écrire de handler** : déclarer un
`EntitySpec` et laisser le moteur kit générer les routes
(`createEntityApiMount`, `@creezio/api-kernel/entity-mount` — câblé prod
TF3, gate `test-phase-api-entity-mount`) :

```ts
import { registerEntityMounts, type EntitySpec } from "@creezio/api-kernel";

const ENTITY_SPECS: Record<string, EntitySpec> = {
  clients: {
    table: "clients",
    archivable: true,
    columns: [
      { name: "nom", required: true, searchable: true },
      { name: "statut", enum: ["actif", "inactif"], filterable: true },
    ],
    hooks: { beforeCreate(row, ctx) { /* métier */ } },
    extraRoutes: async (ctx) => monSousCheminMetier(ctx), // fallback
  },
};

export function registerBrandModuleApi(api: ApiKernel): void {
  registerEntityMounts(api, ENTITY_SPECS); // → /api/v1/modules/clients/*
}
```

Routes générées : `GET /` (liste `q`/filtres/`limit`/`offset`), `POST /`,
`GET|PATCH|DELETE /:id`, `POST /:id/archive`. Le métier va dans les
`hooks` (`beforeCreate`, `beforeUpdate`, `afterRead`, `afterList`) et
`extraRoutes`. Un mount manuscrit (`api.registerModuleApi(id, { dbLayer:
"brand", handle })`) reste possible pour les flux non-CRUD.

L'isolation DB est portée par le kernel : un module est en couche `brand`,
tout accès `core`/`plugin` est refusé (`cross_layer_write_denied`).

## 3. Tools MCP + policies

Déclarer les tools métier sous le namespace `module.<owner>.*` (façade) ou
via le serveur MCP SDK de la marque. L'enforcement policies/audit est
**délégué au kit** (`@creezio/mcp-facade/admin/tool-policy-guard`, câblé
prod TF3) :

```ts
import { registerGuardedMcpTool } from "@creezio/mcp-facade";

registerGuardedMcpTool(server, ctx, {
  name: "mon_tool",
  requiredScope: "crm:read",
  annotations: { readOnlyHint: true, destructiveHint: false,
                 idempotentHint: true, openWorldHint: false },
}, config, handler, {
  resolveRole: (userId) => getUserById(userId)?.role,
  scopeAllows: (c, def) => apiKeyAllowsMethod(c.scopes, def.requiredScope),
});
```

Les policies vivent dans la table `mcp_tool_policies` (page `/admin/mcp`) ;
`seedMcpToolPolicies` pose les défauts. Ne pas réimplémenter
l'enforcement côté marque : le registre métier (catégories, rôles par
défaut) reste marque, la décision/audit est kit.

## 4. Feed + nav

- Nav : ajouter l'entrée dans le `verticalSlot` (permissions `nav.*`
  déclarées via `configureAuth` — sans quoi la sidebar owner est amputée).
- Meili : étendre le `BrandMeiliIndexSpec` du feed marque (UIDs `catalog_*`
  imposés par le kit, jamais d'UIDs legacy `tf2_*`).

## 5. Gates métier

Chaque module a sa gate dans le `npm test` de la marque (TF3 : 15 gates,
reprise `npm run test:fast -- --from <gate>`). Une gate de module prouve :
migration appliquée, CRUD via HTTP, cas métier des hooks, tools MCP
répondants.

## Checklist finale

- [ ] Migration `brand.db` avec ID stable
- [ ] `EntitySpec` (ou mount manuscrit justifié) enregistré dans
      `registerBrandModuleApi`
- [ ] Tools MCP via `registerGuardedMcpTool` / façade + policies seedées
- [ ] Nav + permissions `configureAuth`, feed Meili si recherché
- [ ] Gate métier ajoutée au `npm test` marque et verte
- [ ] Pas de glue OS ni fetch maison vers `/api/v1/os/*` / `/api/v1/platform/*`
      dans `ui/app` (contrat AGENTS marque)
