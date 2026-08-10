# @creezio/os-ui

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

- @creezio/shell-ui@0.7.0
- @creezio/mails@0.7.0

## 0.6.0

### Minor Changes

- d948fcc: feat(login): page /login split-screen 50/50 brand-configurable — nouveau `LoginPage` (@creezio/auth/ui) : panneau formulaire modernisé (labels associés, `role="alert"`, `aria-invalid`, focus accent, loading) + panneau brand (logo/initiale, nom produit, tagline, highlights, gradient/image configurables). Config marque via `ShellUiBrand.login` (prop `login` de `CreezioUiBoot`) — zéro hardcodé, défaut neutre élégant sans config. `configureShellUiBrand` devient no-op sans changement (comparaison par clé, `login` en profondeur) et notifie des abonnés : nouveau `subscribeShellUiBrand` + hook `useShellUiBrand` (@creezio/shell-ui/ui[/kit]) pour lire la brand au render sans flash du défaut — CreezioUiBoot configure désormais au render. Compat : `LoginForm` inchangé fonctionnellement (mêmes props/modes), la route OS /login et le template factory basculent sur `LoginPage` — aucune modif requise côté apps pour le nouveau design.

### Patch Changes

- Updated dependencies [d948fcc]
  - @creezio/shell-ui@0.6.0
  - @creezio/mails@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [0ff4ed2]
- Updated dependencies [d674c86]
  - @creezio/shell-ui@0.5.0
  - @creezio/mails@0.5.0
