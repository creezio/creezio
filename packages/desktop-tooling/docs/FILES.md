# packages/desktop-tooling — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs desktop-tooling` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `scripts/`

| Fichier | Rôle |
|---|---|
| [`scripts/after-pack.cjs`](../scripts/after-pack.cjs) | (à documenter) |
| [`scripts/build-server.mjs`](../scripts/build-server.mjs) | (à documenter) |
| [`scripts/desktop-build-status.mjs`](../scripts/desktop-build-status.mjs) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`scripts/e2e-browser-parcours.mjs`](../scripts/e2e-browser-parcours.mjs) | (à documenter) |
| [`scripts/ensure-linux-icons.mjs`](../scripts/ensure-linux-icons.mjs) | (à documenter) |
| [`scripts/ensure-linux-native-modules.mjs`](../scripts/ensure-linux-native-modules.mjs) | (à documenter) |
| [`scripts/ensure-win-native-modules.mjs`](../scripts/ensure-win-native-modules.mjs) | (à documenter) |
| [`scripts/load-local-env.mjs`](../scripts/load-local-env.mjs) | (à documenter) |
| [`scripts/publish-desktop.sh`](../scripts/publish-desktop.sh) | (à documenter) |
| [`scripts/remote-build-win.sh`](../scripts/remote-build-win.sh) | (à documenter) |
| [`scripts/resolve-config.mjs`](../scripts/resolve-config.mjs) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`scripts/smoke-packaged-server.mjs`](../scripts/smoke-packaged-server.mjs) | (à documenter) |
| [`scripts/smoke-tunnel-catalog.mjs`](../scripts/smoke-tunnel-catalog.mjs) | (à documenter) |
| [`scripts/smoke-tunnel.mjs`](../scripts/smoke-tunnel.mjs) | (à documenter) |
| [`scripts/stage-win-bins.sh`](../scripts/stage-win-bins.sh) | (à documenter) |
| [`scripts/verify-pack-runtime.mjs`](../scripts/verify-pack-runtime.mjs) | (à documenter) |
| [`scripts/write-app-kind.mjs`](../scripts/write-app-kind.mjs) | (à documenter) |

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/desktop-build-status.ts`](../src/desktop-build-status.ts) | Agrège le statut build Windows d'une marque (hook JSON + feed + process). Port générique de `desktop-build-status.mjs` TF2 0.10.26. |
| [`src/fetch-feed.ts`](../src/fetch-feed.ts) | Lecture HTTP des feeds `latest.yml` (client + serveur) pour une marque. |
| [`src/index.ts`](../src/index.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`src/parse-latest-yml.ts`](../src/parse-latest-yml.ts) | Parse minimal d'un `latest.yml` electron-updater (generic provider). export type LatestYmlMeta = { version: string \| null; path: string \| null; releaseDate: string \| null; size: number \| null; sha512: string \| null; }; export function parseLatestYml(text: string \| null \| undefined): LatestYmlMeta { if (!text) { |
| [`src/resolve-publish-config.ts`](../src/resolve-publish-config.ts) | Résout la config publish / remote-build pour une marque + kind. Consommé par les scripts bash (JSON / export shell) et la console. |
