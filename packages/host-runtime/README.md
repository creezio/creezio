# @creezio/host-runtime

**Host runtime Node pur** du kit Creezio, extrait de
`@creezio/electron-shell` en P1.b (déménagement pur, zéro changement de
comportement runtime). C'est le socle qu'exécutent le desktop Electron ET
le serveur Docker headless — sans jamais importer Electron statiquement.

## Contenu

- `src/logger.ts` — journal main (`initLogger`, `log`, `logError`…).
- `src/load-electron.ts` — chargement dynamique lazy d'Electron
  (`loadElectron()`), unique porte d'entrée vers `require("electron")`.
- `src/server-launcher.ts` / `src/server-env.ts` — lancement Next marque.
- `src/brand-kernel-http.ts` — kernel HTTP marque (`listenBrandKernelHttp`).
- `src/brand-host-stack.ts` / `src/brand-host-runtime.ts` — stack host
  marque (Hermes, n8n, plugins, tunnel, Meili via `@creezio/search`).
- `src/hermes/` — launcher Hermes, clé CRM, seed skills, bootstrap runtime.
- `src/n8n/` — launcher n8n, API key, isolation agents.
- `src/plugins/` — host plugins complet (launcher, control-plane, git,
  data, accept-check, test-runner, bindings marque).
- `src/tunnel/` — cloudflared in-process + respawn.
- `src/sandbox/` — sandbox OS + embeds.
- `src/ai-workspace/` — workspace navigateur IA (manager, actions,
  screencast, profil).
- `src/node-runtime.ts`, `src/npm-cli.ts`, `src/ensure-kit-binaries.ts` —
  outillage Node/npm/binaires kit (Meili, cloudflared).
- `src/crash-reporter.ts`, `src/bridge-client.ts`, `src/contracts.ts`,
  `src/context.ts`, `src/safe-storage.ts`, `src/local-config.ts`,
  `src/feature-off-host.ts`, `src/factory-reset-runtime.ts`.

## Frontières

- Node pur — zéro import statique `electron` (gate
  `test-phase-host-no-electron`) ; valeurs Electron via `loadElectron()`.
- Dépend de `@creezio/search` (Meili), `@creezio/platform-core`,
  `@creezio/product-hub`, `@creezio/brand-config`, `@creezio/observability`,
  `@creezio/browser-host`. `@creezio/electron-shell` dépend de ce package —
  jamais l'inverse.
- Les binaires/vendor kit (`resources/vendor`, `resources/bin`) restent
  shippés par `@creezio/electron-shell` et résolus par
  `kitOsResourcesRoot()` (platform-core) — TODO P1.c : les déménager ici.

## Compat

`@creezio/electron-shell` ré-exporte toute cette surface avec `@deprecated`
— aucun import historique ne casse. Surface figée par la gate
`test-phase-electron-shell-frozen-exports` : tout nouveau symbole host
s'exporte d'ici.

## Liens

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
