# AGENTS — `scripts/`

## Mission

Garantir que le kit reste cohérent : packages présents, cutovers documentés,
pas de régression de frontières kit/marque, sync vendor possible.

## Ne pas faire

- Affaiblir une gate pour faire passer un commit sans corriger la cause.
- Déplacer un gate vers une marque : les gates kit restent ici.
- Hardcoder `/opt/docker/...` sans fallback (voir `scripts/lib/brand-roots.mjs`).
- Générer des artefacts marque depuis ces scripts (sauf dry-run impact).

## Points d’entrée

| Fichier | Usage |
|---------|--------|
| `build-cjs.mjs` | Dual package CJS post-`tsc` |
| `kit-version.mjs` | Bump semver package + CHANGELOG |
| `propagation-impact.mjs` | Impact d’un bump sur marques |
| `sync-creezio-vendor.sh` | Canon sync → `vendor/creezio` marques |
| `lib/brand-roots.mjs` | Résolution chemins brands + kit |
| `lib/intention-twins.mjs` | Scanner jumeaux intention (P0) |
| `test-phase-*.mjs` | Gates — une phase / un contrat |

## Modifier une gate

1. Lire la `PHASE-*.md` / doc associée.
2. Adapter l’assert **et** le code/doc SoT, pas seulement l’assert.
3. Lancer `node --test scripts/test-phase-<x>.mjs` puis `npm test`.

## Config / chemins

Les gates marques peuvent pointer vers `/opt/docker/<brand>` ou
`/agent/repos/<brand>` via `brand-roots.mjs`. Sur agents cloud, un symlink
`/opt/docker/creezio → repo` est souvent requis pour le sync.

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
- [../AGENTS.md](../AGENTS.md)
