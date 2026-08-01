# Modules BrandSpec (apply-modules)

Généré: 2026-08-01T21:21:06.519Z

## Modules déclarés
- `commandes` ← modules/commandes/prd.md
- `dashboard` ← modules/dashboard/prd.md
- `fournisseurs` ← modules/fournisseurs/prd.md
- `marketplaces` ← modules/marketplaces/prd.md
- `optimiser` ← modules/optimiser/prd.md
- `panier` ← modules/panier/prd.md
- `prix` ← modules/prix/prd.md
- `produits` ← modules/produits/prd.md
- `releves` ← modules/releves/prd.md
- `scan` ← modules/scan/prd.md
- `stack` ← modules/stack/prd.md

## Fichiers protégés owned-by-brand (non écrasés)
- `src/electron/brand-bonus-api.ts`
- `src/electron/brand-module-api.ts`
- `src/electron/brand-migrations.ts`
- `src/electron/vertical-slot.ts`
- `package.json`

## Suite manuelle / P1
- Enrichir `brand-bonus-api.ts` pour chaque module sans marker factory
- Pages UI sous `ui/app/<module>/` avec `/** creezio:owned-by-brand */`
- Ne jamais wipe avec `brand apply --force` sans markers
