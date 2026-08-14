# @creezio/desktop-tooling

## 0.9.3

### Patch Changes

- @creezio/brand-config@0.9.3

## 0.9.2

### Patch Changes

- @creezio/brand-config@0.9.2

## 0.9.1

### Patch Changes

- @creezio/brand-config@0.9.1

## 0.9.0

### Patch Changes

- @creezio/brand-config@0.9.0

## 0.8.1

### Patch Changes

- 1dfb6f4: e2e-browser-parcours : importCreezio hoist-safe reapplique (le correctif 0.7.1
  avait ete perdu avant commit). Prouve localement : MISSION=SUCCESS sur winhub.
  - @creezio/brand-config@0.8.1

## 0.8.0

### Patch Changes

- @creezio/brand-config@0.8.0

## 0.7.1

### Patch Changes

- 200476c: e2e-browser-parcours : résolution hoist-safe des packages @creezio (imports
  nus depuis le script publié — workspaces monorepo où tout est hoisté à la
  racine) + export du sous-chemin `./scripts/*` pour que les wrappers apps
  résolvent via `import.meta.resolve` (plus de sondage `server/node_modules`).
  - @creezio/brand-config@0.7.1

## 0.7.0

### Minor Changes

- b4b90a7: Quick wins audit de robustesse (Q1→Q9) :

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

### Patch Changes

- @creezio/brand-config@0.7.0

## 0.6.0

### Patch Changes

- @creezio/brand-config@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [e23b259]
  - @creezio/brand-config@0.5.0
