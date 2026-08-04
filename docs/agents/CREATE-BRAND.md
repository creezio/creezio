# CREATE-BRAND — interview agent → BrandSpec → app

Guide pour un **agent créateur** qui crée une marque Creezio sans écrire
d'orchestration OS.

## Flux

```text
Interview (questionnaire) → brand-spec/ → creezio brand doctor
                                      → creezio brand apply
                                      → creezio brand smoke
                                      → startBrandDesktop (runtime)
```

## 1. Interview (remplir BrandSpec)

Questions minimales (voir `interview.schema.json`) :

1. Nom produit / brandId / domaine
2. Tagline + utilisateurs cibles
3. Entités cœur + champs
4. Flux métier principal (étapes)
5. Besoins plateforme : Meili / MCP / chat / onboarding
6. Modules bonus (mini-PRDs sous `modules/<id>/prd.md`)

Ne **jamais** demander à l'agent d'implémenter des launchers Meili/n8n/Hermes
dans la marque.

## 2. Commandes

```bash
creezio brand init --id acme --name Acme --domain acme.local --vertical generic
# → apps/acme/brand-spec/

# Après remplissage product.md + modules/
creezio brand doctor --spec apps/acme/brand-spec
creezio brand apply --spec apps/acme/brand-spec --out apps/acme --force
creezio brand smoke --app apps/acme
```

## 3. Contrat runtime marque

`main.ts` doit rester une **déclaration** :

```ts
import { startBrandDesktop } from "@creezio/app-runtime";
// manifest + bootBrandKernel + meiliFeed + navItems
await startBrandDesktop({ … });
```

Si un besoin OS manque → **gap kit** (`@creezio/app-runtime` /
`electron-shell`), pas de copie dans la marque.

## 4. Anti-triche

| Interdit | Pourquoi |
|----------|----------|
| Templates CHR riches dans factory | Contourne la sonde |
| Sidecar `metier-api.mjs` / `store.json` | Hors contrat SQLite |
| Jumeau `listenBrandKernelHttp` dans main | Contourne la façade |
| UIDs Meili `tf2_*` | Legacy marque prod |

## 4b. Fichiers métier protégés (`owned-by-brand`)

Après enrichissement manuel (bonus API, UI interactive, migrations riches),
protéger contre `creezio brand apply --force` :

1. **Sources TS/TSX/MD** — première ligne / en-tête :
   `/** creezio:owned-by-brand */`
2. **`package.json`** — `"creezio": { "ownedByBrand": true, … }`  
   → apply **merge** (conserve `creezio.*` + scripts métier, met à jour le shell deps).

Sans marker, `--force` réécrit le fichier avec le template factory (stubs).
Gate : `node --test scripts/test-os-owned-by-brand.mjs`.

Reset clean-room TF3 : `node scripts/reset-tempoflow3.mjs` (backup + apply + build).

## 5. Sonde TempoFlow3

Référence vivante : le repo marque `tempoflow3` (frère du kit —
`brand-spec/` à sa racine) + gates kit
`scripts/test-phase-brand-spec.mjs` / `test-phase-app-runtime.mjs`.
