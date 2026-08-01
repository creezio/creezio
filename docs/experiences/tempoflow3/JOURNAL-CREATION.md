# Journal de création TempoFlow3

## Règle d’évaluation

TempoFlow3 prouve que **creezio + sa doc** suffisent pour créer une app
from scratch. Interdit : coller tempoflow2 ; s’appuyer sur un template kit
qui dump déjà tout le métier TempoFlow.

| Étape | Statut | Notes |
|-------|--------|-------|
| P8 — retrait `templates/chr` | ✅ | anti-triche |
| Phase A — factory native | ✅ | migrations + runtime + mounts SQL + harness |
| Phase B — reset TF3 sur kernel | ✅ | plus de sidecar JSON / `store.json` |
| Prompt 1 — bootstrap cœur générique | ✅ | 5 entités, CRUD factory |
| Prompt 2 — Fournisseurs | ✅ | archive + `?q=` + `?archived=` (mounts SQL) |
| Prompt 3 — Produits | ✅ | rattachement fournisseur + filtres |
| Prompt 4 — Prix | ✅ | historique inserts + promo |
| Prompt 5 — Panier | ✅ | totaux / sous-totaux / prérempli tarif |
| Prompt 6 — Commandes | ✅ | from-panier + statuts MVP |
| Phase C — Meili générique | ✅ | `BrandMeiliFeed` + `catalog_*` + smoke fake/fallback |
| Phase D — desktop kernel HTTP + Meili | ✅ | `listenBrandKernelHttp` + `maybeBootBrandMeili` + SPA search |
| Prompts 7+ — modules bonus | ⏳ | optimiser, stack, scan… un par un |

---

## Raisonnement Prompt 1

1. PRD = succès « fournisseurs → prix → panier → commande ».
2. Factory parse → ProductModel **5 entités** (pas 12 oracle).
3. Générateurs **natifs OS** → `brand-migrations` + `bootBrandKernel` + mounts `/api/v1/modules/*`.
4. Assert : aucun `optimiser/suggest` / `scan/start` / `templates/chr` / `metier-api.mjs` / `store.json`.
5. `npm test` smokes OS + parcours cœur verts.

## Raisonnement Prompts 2–6 (marque)

Sans lire tempoflow2. Sources : mini-PRDs + schéma généré (`archived_at`
présent pour fournisseurs/produits). Règles portées dans
`src/electron/brand-module-api.ts` (SQL sur `ctx.db`), pas dans un sidecar.

| Mini-PRD | Décision d’implémentation |
|----------|---------------------------|
| 01 Fournisseurs | Soft-archive `POST …/archive` ; liste `?archived=0\|1\|all` ; recherche `?q=` sur nom/contact/email. DELETE hard refusé (`use_archive`). |
| 02 Produits | Même archive ; filtre `?fournisseur_id=` ; nom obligatoire. |
| 03 Prix | Chaque POST = nouveau relevé (historique) ; filtres produit/fournisseur ; `?promo=1` ; champ `promo_fin` en SQL. |
| 04 Panier | GET renvoie `{ items, total_ht, by_fournisseur }` ; si `prix_unitaire` omis → dernier tarif connu. |
| 05 Commandes | `from-panier` fige les lignes, vide le panier du fournisseur ; PATCH statut ∈ `{brouillon,envoyee,recue}`. |

Fichiers marque (chemin natif) :

- `src/electron/brand-migrations.ts`
- `src/electron/brand-module-api.ts`
- `src/electron/brand-runtime.ts`
- `src/electron/main.ts` (`bootBrandKernel`, pas `spawnBrandMetierApi`)
- `scripts/brand-kernel-harness.mjs`
- `crm/src/brand/schema.sql`
- `resources/renderer/index.html`

## Preuve

```bash
# Clean-room from-prd (factory Phase A)
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force

# Smokes = même kernel + SQLite (CREEZIO_ROOT pour deps monorepo hors workspace)
cd apps/tempoflow3
CREEZIO_ROOT=$(pwd)/../.. NODE_PATH=$CREEZIO_ROOT/node_modules npm test

# Gates factory
node --test scripts/test-phase-factory-prd.mjs \
  scripts/test-phase-factory-prd-experience.mjs
```

Preuves d’absence sidecar : pas de `scripts/metier-api.mjs`, pas de
`store.json` sous le dataDir de smoke ; health `/api/v1/core/health` +
CRUD `/api/v1/modules/*` sur `brand.db`.
