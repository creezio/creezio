# @creezio/search

Sous-domaine **recherche Meili** du kit Creezio, extrait de
`@creezio/electron-shell` en P1.b (déménagement pur, zéro changement de
comportement runtime).

## Contenu

- `src/meili-launcher.ts` — démarrage du binaire Meili (`startMeili`),
  master key, healthcheck.
- `src/meili/` — le sous-domaine complet :
  - `feed.ts` — feed marque générique (`BrandMeiliFeed`,
    `configureMeiliBrandFeed`, `GENERIC_CATALOG_INDEXES`) ;
  - `generic-indexer.ts` — indexation pilotée par le feed
    (`runFeedIndexation`, `searchMeiliIndexes`) ;
  - `index-schema.ts` — schéma d'index versionné, fingerprint, tables SQL ;
  - `indexer.ts` — indexation historique (`runIndexation`) ;
  - `coherence.ts` / `coherence-db.ts` / `coherence-query.ts` — décision
    fail-closed `decideMeiliReady` (0.10.13/0.10.14) ;
  - `browse.ts` — browse paginé (`browseMeiliIndex`,
    `browseMeiliIndexOutcome`, `meiliFilterEq`).
- `src/brand-meili-boot.ts` — boot Meili marque (`maybeBootBrandMeili`) :
  Meili est un composant CORE fail-closed dès qu'un feed déclare ≥ 1 index
  (`MeiliRequiredError`, jamais de fallback SQL silencieux).

## Frontières

- Node pur — jamais d'import Electron (gate `test-phase-host-no-electron`).
- Aucun vocabulaire marque (gate `test-phase-no-brand-vocab`).
- Dépend uniquement de `@creezio/platform-core` et `@creezio/observability`.
- `@creezio/host-runtime` et `@creezio/electron-shell` dépendent de ce
  package (jamais l'inverse).

## Compat

`@creezio/electron-shell` (et son subpath `./meili`) ré-exporte toute cette
surface avec `@deprecated` — les imports historiques des marques et de la
factory continuent de fonctionner. Surface figée par la gate
`test-phase-electron-shell-frozen-exports` : tout nouveau symbole s'exporte
d'ici, pas via electron-shell.

## Liens

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
