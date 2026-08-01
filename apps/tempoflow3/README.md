# TempoFlow

Application métier générée par `creezio new-app --from-prd`.

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `tempoflow3` |
| tagline | Application métier TempoFlow |
| entities | fournisseurs, produits, prix, panier_lignes, commandes |
| flow | Commander chez un fournisseur |
| sandbox | `true` |

## Parcours smoke

```bash
npm run test:metier-parcours
npm run test:first-run-auth
```

API métier locale :

```bash
npm run metier:api
# → http://127.0.0.1:18791
```

## Structure clé

- `product-model.json` — modèle issu du PRD
- `crm/src/brand/schema.ts` + `schema.sql` — schéma marque
- `scripts/metier-api.mjs` — API HTTP métier
- `ui/app/` — pages App Router
- `src/lib/` — wiring générique (paths, host-stack, boot…)
- `src/electron/` — desktop (`installBrandDesktopRuntime`)
- `resources/renderer/index.html` — UI SPA métier

## Plateforme

Le générique (auth, fenêtres, MAJ, assistant…) vient de `@creezio/*`.
Le métier (fournisseurs, produits, prix, panier_lignes, commandes) vit **dans ce repo**.
