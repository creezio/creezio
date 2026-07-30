# @creezio/desktop-tooling — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/desktop-tooling/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`scripts/desktop-build-status.mjs`](../scripts/desktop-build-status.mjs) | 57 | — |
| [`scripts/resolve-config.mjs`](../scripts/resolve-config.mjs) | 32 | — |
| [`src/desktop-build-status.ts`](../src/desktop-build-status.ts) | 471 | `CollectDesktopBuildStatusOptions`, `collectDesktopBuildStatus`, `collectDesktopBuildStatusFromArgv` |
| [`src/fetch-feed.ts`](../src/fetch-feed.ts) | 106 | `FeedSnapshot`, `BrandFeedsSnapshot`, `fetchFeedSnapshot`, `fetchBrandFeeds`, `fetchAllBrandFeeds` |
| [`src/index.ts`](../src/index.ts) | 27 | `parseBrandArg`, `parseKindArg`, `resolvePublishConfig`, `toShellExports`, `parseLatestYml`, `fetchAllBrandFeeds`, `fetchBrandFeeds`, `fetchFeedSnapshot` |
| [`src/parse-latest-yml.ts`](../src/parse-latest-yml.ts) | 35 | `LatestYmlMeta`, `parseLatestYml` |
| [`src/resolve-publish-config.ts`](../src/resolve-publish-config.ts) | 234 | `ResolvedPublishConfig`, `ResolvePublishConfigOptions`, `resolvePublishConfig`, `toShellExports`, `parseBrandArg`, `parseKindArg` |

---

## Détail par fichier

### `scripts/desktop-build-status.mjs`

- **Lignes** : 57

_(pas de cartouche JSDoc en tête — voir le code)_

### `scripts/resolve-config.mjs`

- **Lignes** : 32

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/desktop-build-status.ts`

- **Lignes** : 471
- **Exports** : `CollectDesktopBuildStatusOptions`, `collectDesktopBuildStatus`, `collectDesktopBuildStatusFromArgv`

Agrège le statut build Windows d'une marque (hook JSON + feed + process).
Port générique de `desktop-build-status.mjs` TF2 0.10.26.

### `src/fetch-feed.ts`

- **Lignes** : 106
- **Exports** : `FeedSnapshot`, `BrandFeedsSnapshot`, `fetchFeedSnapshot`, `fetchBrandFeeds`, `fetchAllBrandFeeds`

Lecture HTTP des feeds `latest.yml` (client + serveur) pour une marque.

### `src/index.ts`

- **Lignes** : 27
- **Exports** : `parseBrandArg`, `parseKindArg`, `resolvePublishConfig`, `toShellExports`, `parseLatestYml`, `fetchAllBrandFeeds`, `fetchBrandFeeds`, `fetchFeedSnapshot`, `collectDesktopBuildStatus`, `collectDesktopBuildStatusFromArgv`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/parse-latest-yml.ts`

- **Lignes** : 35
- **Exports** : `LatestYmlMeta`, `parseLatestYml`

Parse minimal d'un `latest.yml` electron-updater (generic provider). 

export type LatestYmlMeta = {
  version: string | null;
  path: string | null;
  releaseDate: string | null;
  size: number | null;
  sha512: string | null;
};

export function parseLatestYml(text: string | null | undefined): LatestYmlMeta {
  if (!text) {

### `src/resolve-publish-config.ts`

- **Lignes** : 234
- **Exports** : `ResolvedPublishConfig`, `ResolvePublishConfigOptions`, `resolvePublishConfig`, `toShellExports`, `parseBrandArg`, `parseKindArg`

Résout la config publish / remote-build pour une marque + kind.
Consommé par les scripts bash (JSON / export shell) et la console.

