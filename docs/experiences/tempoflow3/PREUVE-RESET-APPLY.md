# Preuve reset → BrandSpec apply → main mince

Date : 2026-08-01

## Commande

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
# → BrandSpec OK (11 modules)

creezio brand apply --spec apps/tempoflow3/brand-spec --out /tmp/tf3-reset-proof --force
# → 51 files, main = startBrandDesktop uniquement
```

## Résultat

- `main.ts` mince (~30 lignes), façade `@creezio/app-runtime`
- **Aucun** `host-stack.ts` / `brand-runtime.ts` généré
- BrandSpec recopié dans l’app
- Cœur 5 entités from-prd ; modules bonus = développement agent post-apply
  (mini-PRDs / brand-spec/modules/*) — c’est le workflow voulu

## Enchaînement agent attendu

1. `brand doctor`
2. `brand apply` (scaffold OS + cœur)
3. Développer métier depuis `brand-spec/modules/*` + mini-PRDs
4. `npm run build:ui` + `proof:hard`
5. Corriger bloqueurs **kit** si OS manquant (pas jumeau marque)
