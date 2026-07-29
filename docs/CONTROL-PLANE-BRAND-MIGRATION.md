# Control-plane — checklist bascule marque (I4)

> Remplacer le `plugin-control-api.ts` local par le runtime kit unique.  
> **Ne pas exécuter** la bascule TF/Certivan/Fidu ici — phases I10 / I16 / I18.

## Chemin unique (gold demobrand)

```ts
import { startHostPluginControlPlane } from "@creezio/electron-shell";
import {
  createPluginControlPlaneAclFromStore,
  createSqliteProductHubStore,
  buildPluginAclActorHeaders,
} from "@creezio/product-hub";

const hub = createSqliteProductHubStore({ coreDbPath: runtime.paths.core });

const plane = await startHostPluginControlPlane({
  ctx,
  pluginsHost,
  productHubStore: hub,
  acl: createPluginControlPlaneAclFromStore({
    store: hub,
    onInstalled: (id, actor) => {
      /* openPlugin + mounts marque */
    },
    onUninstalled: (id) => {
      /* closePlugin / uninstall marque */
    },
  }),
  adapters: {
    /* override git / scaffold riche si besoin */
  },
});
```

Sandbox demobrand : `sandbox.controlPlaneAcl()` + `sandbox.actorHeaders(actor)`.

## Checklist par marque

| # | Étape | TF | Certivan | Fidu |
|---|-------|----|----------|------|
| 1 | Vendor sync inclut `product-hub` + `electron-shell` (I0/I3) | ✅ I9 | ✅ I15 | ☐ I17 |
| 2 | Brancher `createSqliteProductHubStore` (ou store existant) | ✅ I10 | ✅ I15/I16 | ☐ |
| 3 | Remplacer HTTP local par `startHostPluginControlPlane` | ✅ I10 (façade `createPluginControlPlaneHandler`) | ✅ I16 | ☐ I18 |
| 4 | Passer `acl: createPluginControlPlaneAclFromStore(...)` | ✅ I10 | ✅ I16 | ☐ I18 |
| 5 | Headers actor `buildPluginAclActorHeaders` / `x-creezio-org-id` | ✅ I10 | ✅ I16 | ☐ |
| 6 | Garder adapters verticaux (git, accept-check, grants CRM) | ✅ I10 | ✅ I16 | ☐ |
| 7 | Tests deny cross-org + owner install OK | ✅ I10 | ✅ I16 | ☐ |
| 8 | Retirer `plugin-control-api.ts` mort après verts | ✅ I10 (aminci → kit + extras) | ✅ I16 (aminci) | ☐ |

## Sans `acl` (rétrocompat)

`startHostPluginControlPlane` **sans** `acl` = Bearer-only (Phase E).  
Comportement actuel TempoFlow tant que I10 non fait — **volontaire**.

## Gaps TF observés (I4 audit)

| Local TF | Kit équivalent |
|----------|----------------|
| `plugin-control-api.ts` (~775 L) HTTP Bearer | `startHostPluginControlPlane` |
| Tokens `TEMPOFLOW_PLUG_*` | `productHubTokensFromManifest` + `ensurePluginControlToken` |
| Pas d'ACL org | H5 `acl` + `decidePluginAccess` |
| Git / accept-check / CRM key | **Rester adapters** marque |

## Interdit

- Republish pour « tester » le control-plane (voir [REPUBLISH-POLICY.md](REPUBLISH-POLICY.md))
- Dupliquer `decidePluginAccess` dans la marque
