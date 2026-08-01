# TempoFlow

Application métier bootstrapée par `creezio new-app --from-prd`
(cœur achats générique).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `tempoflow3` |
| tagline | Prix fournisseurs, catalogue et commandes pour la restauration |
| vertical | `chr` |
| entities | fournisseurs, produits, prix, panier_lignes, commandes |
| sandbox | `true` |

## Tests

```bash
npm test
npm run metier:api
```

## Plateforme vs métier

- **OS** : `@creezio/*` (`createDesktopSessionStore`, boot, host-stack…).
- **Bootstrap factory** : CRUD générique depuis ProductModel — pas un clone produit.
- **Modules riches** : écrits dans ce repo à partir des mini-PRDs / brief, pas via templates TempoFlow.
