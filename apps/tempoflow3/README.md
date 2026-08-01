# TempoFlow

Marque métier sur **OS Creezio** (`creezio new-app --from-prd`).

## Architecture

| Couche | Technologie |
|--------|-------------|
| OS | `@creezio/api-kernel` + `createSqliteRuntime` + session desktop |
| Métier | schema brand + mounts `/api/v1/modules/*` |
| Smoke | `scripts/brand-kernel-harness.mjs` (même kernel, sans Electron) |

**Interdit** : sidecar `metier-api.mjs` / `store.json` comme source de vérité.

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `tempoflow3` |
| entities | fournisseurs, produits, prix, panier_lignes, commandes |
| vertical | `chr` |

## Tests

```bash
npm test
npm run metier:api   # harness kernel natif
```
