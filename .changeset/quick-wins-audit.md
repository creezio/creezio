---
"@creezio/app-runtime": minor
"@creezio/desktop-tooling": minor
"@creezio/os-ui": minor
"@creezio/factory": minor
---

Quick wins audit de robustesse (Q1→Q9) :

- **Q1/Q6** — dev-stack standard dans `@creezio/app-runtime/scripts/dev-stack.mjs`
  (`dev`/`stop`/`status`/`setup` : kernel + Next dev, détection de ports, .env,
  PID files `.creezio/`, kill par process group) ; les apps l'exposent via le
  proxy factory `scripts/creezio-dev.mjs` — zéro copie divergente.
- **Q2** — `port-guard.mjs` partagé (`@creezio/desktop-tooling`) : port
  explicitement demandé et occupé = erreur actionnable avec PID
  (« npm run stop ou METIER_PORT=0 ») dans le harness e2e et le dev-stack.
- **Q4** — `engines: node >=22.5` partout (node:sqlite l'exige) + `.nvmrc`.
- **Q5** — garde anti-stale `materialize` : marker versionné
  `.materialized-from-os-ui` + mode `--check` (erreur claire si les pages
  matérialisées divergent de la version installée).
- **Q8** — sémantique unique : `CREEZIO_KIT_ROOT` = clone du kit,
  `CREEZIO_APP_ROOT` = clone de l'app (`CREEZIO_ROOT` conservé en fallback
  legacy partout).
- **Q9** — `npm run clean` cross-platform (`scripts/clean.mjs`, fini rm -rf).