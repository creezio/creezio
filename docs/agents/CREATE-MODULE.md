# CREATE-MODULE — créer un module métier de marque

Guide pour ajouter un module métier dans un **repo marque** (jamais dans le
kit). Un module = **unité de travail autonome** au sens du standard
[DOC-STANDARD-MODULE.md](../DOC-STANDARD-MODULE.md) : dossier spec 4 fichiers
+ un fichier de wiring + ses pages UI + sa gate. Référence vivante : le repo
`tempoflow3` (`server/src/electron/modules/`).

## 0. Scaffolder l'unité de travail

```bash
creezio brand module init <id> --app <racine-du-repo-marque>
```

Pose :

- `brand-spec/modules/<id>/` — `prd.md`, `interview.md`, `TODO.md`,
  `CHANGELOG.md` (templates à remplir — le PRD et l'interview sont la SoT,
  voir le standard) ;
- `server/src/electron/modules/<id>.ts` — stub `BrandModuleDef` ;
- `server/scripts/test-module-<id>.mjs` — stub de gate (structurel, à
  enrichir en preuves HTTP) ;
- la ligne d'import + l'entrée dans le registre `modules/index.ts`
  (marqueurs `<creezio:module-imports>` / `<creezio:module-registry>`).

**Avant d'implémenter** : remplir `prd.md` + `interview.md` (décisions
d'architecture), poser les tâches dans `TODO.md`, puis claim
(`[todo]` → `[in-progress]` + `- claim: <agent> <date>` dans le même commit
que la première modif).

## Où va quoi — registre de modules

Tout le wiring d'un module vit dans **son** fichier
`server/src/electron/modules/<id>.ts`, qui exporte un `BrandModuleDef` :

| Élément | Champ du `BrandModuleDef` |
|---|---|
| Migrations `brand.db` | `migrations()` — IDs `mod_<id>_00N_<slug>` |
| Entités CRUD | `entitySpecs` (moteur kit `createEntityApiMount`) |
| Mounts API manuscrits | `apiMounts` |
| Nav métier | `navItems` (avec `order`) |
| Tools MCP métier | `mcpTools(api)` |
| Index Meili | `meiliIndexes` |

Les fichiers d'assemblage (`brand-module-api.ts`, `brand-migrations.ts`,
`vertical-slot.ts`, `brand-mcp-tools.ts`, `meili-feed.ts`) sont de simples
**consommateurs du registre** `modules/index.ts` — ne pas y remettre du
wiring de module. Le registre est partagé : un agent module n'y touche que
**sa** ligne d'import (tout autre changement = tâche sérialisée séparée).

## 1. Migration `brand.db`

Dans `migrations()` du module — IDs stables `mod_<id>_00N_<slug>`
(`[a-z0-9][a-z0-9_.-]*`), **jamais renuméroter/renommer une migration
appliquée**, quel que soit son préfixe (`fromprd_brand_0XX` compris).
Migrations cross-module interdites (une colonne sur la table d'un autre
module = tâche dans le module propriétaire). Colonnes implicites attendues
par le moteur CRUD : `id`, `created_at`, `updated_at` (+ `archived_at` si
archivable).

## 2. API — CRUD générique d'abord

Pour une entité CRUD standard, **ne pas écrire de handler** : déclarer un
`EntitySpec` et laisser le moteur kit générer les routes
(`createEntityApiMount`, `@creezio/api-kernel/entity-mount` — câblé prod
TF3, gate `test-phase-api-entity-mount`) :

```ts
import type { EntitySpec } from "@creezio/api-kernel";
import type { BrandModuleDef } from "./types.js";

const ENTITY_SPECS: Record<string, EntitySpec> = {
  clients: {
    table: "clients",
    archivable: true,
    columns: [
      { name: "nom", required: true, searchable: true },
      { name: "statut", enum: ["actif", "inactif"], filterable: true },
    ],
    hooks: { beforeCreate(row, ctx) { /* métier */ } },
    extraRoutes: async (ctx) => monSousCheminMetier(ctx), // routes hors CRUD
  },
};

export const clientsModule: BrandModuleDef = {
  id: "clients",
  entitySpecs: ENTITY_SPECS,
  navItems: [{ id: "brand.clients", label: "Clients", href: "/clients", group: "brand", order: 120 }],
  migrations: () => [{ id: "mod_clients_001_init", sql: `…` }],
};
```

Routes générées : `GET /` (liste `q`/filtres/`limit`/`offset`), `POST /`,
`GET|PATCH|DELETE /:id`, `POST /:id/archive`. Le métier va dans les
`hooks` (`beforeCreate`, `beforeUpdate`, `afterRead`, `afterList`) et
`extraRoutes`. Un mount manuscrit (`apiMounts: { id: { dbLayer: "brand",
handle } }`) reste possible pour les flux non-CRUD (à justifier dans
l'interview).

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
défaut) reste marque, la décision/audit est kit. Chaque tool est documenté
dans l'interview (§5 : readOnly/destructive, requiredScope, rôles).

## 4. UI, feed + nav — kit graphique imposé

- **UI** : pages sous `server/ui/app/<route>/page.tsx`, composées
  **exclusivement** de composants du kit graphique
  ([DOC-STANDARD-UI.md](../DOC-STANDARD-UI.md)) — pas de lib UI tierce, pas
  de CSS module sauvage, pas de fork des primitives. Chaque page liste ses
  composants dans l'interview (§4).
- Nav : `navItems` du module (permissions `nav.*` déclarées via
  `configureAuth` — sans quoi la sidebar owner est amputée).
- Meili : `meiliIndexes` du module (UIDs `catalog_*` imposés par le kit,
  jamais d'UIDs `tf2_*`, réservés).

## 5. Gates métier

Chaque module a sa gate dans le `npm test` de la marque (TF3 : 15 gates,
reprise `npm run test:fast -- --from <gate>`). Une gate de module prouve :
migration appliquée, CRUD via HTTP, cas métier des hooks, tools MCP
répondants. Le stub `test-module-<id>.mjs` posé par `module init` ne
vérifie que la structure — l'enrichir. La gate kit `test-phase-module-docs`
vérifie en plus le contrat des 4 fichiers spec.

## Périmètre de fichiers (multi-agents)

Un agent module ne modifie que : son dossier spec `modules/<id>/`, son
wiring `modules/<id>.ts`, ses pages UI, sa gate, et **sa ligne** du registre
`modules/index.ts`. Tout fichier partagé = tâche séparée sérialisée.
Branche : `module/<id>/<tache>`. Détails :
[DOC-STANDARD-MODULE.md](../DOC-STANDARD-MODULE.md).

## Checklist finale

- [ ] `prd.md` + `interview.md` remplis (SoT), TODO claimé, CHANGELOG à jour
- [ ] Migration `mod_<id>_00N_<slug>` (id stable) dans `migrations()` du module
- [ ] `EntitySpec` (ou mount manuscrit justifié) dans le `BrandModuleDef`
- [ ] Tools MCP via `registerGuardedMcpTool` / façade + policies seedées
- [ ] Nav + permissions `configureAuth`, feed Meili si recherché
- [ ] Pages UI 100 % kit graphique (DOC-STANDARD-UI.md)
- [ ] Gate métier ajoutée au `npm test` marque et verte
- [ ] Pas de glue OS ni fetch maison vers `/api/v1/os/*` / `/api/v1/platform/*`
      dans `ui/app` (contrat AGENTS marque)
