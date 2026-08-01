# Preuve reset → BrandSpec apply → métier → proof:hard

Date : 2026-08-01

## Commandes

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
# → BrandSpec OK (11 modules)

creezio brand apply --spec apps/tempoflow3/brand-spec --out apps/tempoflow3 --force
# → scaffold OS P&P (main = startBrandDesktop + desktopShell runtime)

# Re-couche métier post-apply (bonus API, migrations riches, UI interactive)
# depuis brand-spec/modules + développement marque — pas de vendor OS dans la marque.
```

## Résultat

- `main.ts` mince (~34 lignes), façade `@creezio/app-runtime`, `CREEZIO_DESKTOP_SHELL`
- **Aucun** `resources/vendor` marque ; electron-builder injecte kit vendor+bin
- Métier bonus + UI interactive restaurés / enrichis (détails fournisseurs/skus/marketplaces, optimiser commande, MCP, server-cockpit)
- `npm run proof:hard` → **54/54 SUCCESS**

## Enchaînement agent attendu

1. `brand doctor`
2. `brand apply` (scaffold OS + cœur)
3. Développer métier depuis `brand-spec/modules/*` + mini-PRDs
4. `npm run build:ui` + `proof:hard`
5. Corriger bloqueurs **kit** si OS manquant (pas jumeau marque)
