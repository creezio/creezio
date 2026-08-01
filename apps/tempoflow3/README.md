# TempoFlow

Application métier générée par `creezio new-app --from-prd` (vertical CHR complet).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `tempoflow3` |
| tagline | Prix fournisseurs, catalogue et commandes pour la restauration |
| vertical | `chr` |
| entities | fournisseurs, produits, prix, panier_lignes, commandes, stack_items, releves, scan_sessions, marketplaces, secteurs, agregateurs, data_mappings |
| sandbox | `true` |

## Tests

```bash
npm test
npm run metier:api
```

UI interactive : `resources/renderer/index.html` (SPA métier).  
Pages Next : `ui/app/**` (listent l'API brand).  
Desktop smoke profile (sans GUI) : `npm run test:desktop-smoke-profile`.

## Plateforme

Le générique (auth, fenêtres, MAJ, assistant…) vient de `@creezio/*`.
Le métier vit **dans ce repo**.
