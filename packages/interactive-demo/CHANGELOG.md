# @creezio/interactive-demo

## 0.9.4

### Patch Changes

- @creezio/platform-core@0.9.4
- @creezio/api-kernel@0.9.4
- @creezio/shell-ui@0.9.4

## 0.9.3

### Patch Changes

- @creezio/platform-core@0.9.3
- @creezio/api-kernel@0.9.3
- @creezio/shell-ui@0.9.3

## 0.9.2

### Patch Changes

- @creezio/platform-core@0.9.2
- @creezio/api-kernel@0.9.2
- @creezio/shell-ui@0.9.2

## 0.9.1

### Patch Changes

- @creezio/platform-core@0.9.1
- @creezio/api-kernel@0.9.1
- @creezio/shell-ui@0.9.1

## 0.9.0

### Minor Changes

- a8bf57a: Polish UI démo + heartbeat desktop natif + lien secondaire login.

  - **Palette de recherche Ctrl+K** (`shell-ui`) : géométrie scopée au composant (classe dédiée `.creezio-search-palette`, spécificité renforcée dans `theme.css`) — la palette ne dépend plus des règles de modale génériques de la marque (cassée par un `[role="dialog"]` global côté app).
  - **Démo interactive** (`interactive-demo`) : la carte garde des dimensions compactes face aux règles globales « modales bornées au viewport » ; nouveau `launcher: "sidebar"` — le lanceur « Visite guidée » devient une entrée d'action de la sidebar kit (registre `registerSidebarActionsProvider` dans `shell-ui`), jamais affichée sur les pages publiques (/login). `launcher: "floating"` reste le défaut rétrocompatible.
  - **Heartbeat desktop natif** (`app-runtime`) : `POST /api/v1/desktop/heartbeat` répond 200 `{ ok: true, desktop }` dans la surface plateforme — les apps web sans bridge Electron ne subissent plus le 404 → fallthrough plane (bruit + faux états) ; quand un bridge est en ligne, `desktop: true` reflète le registre de présence réel.
  - **Login** (`auth` + `shell-ui`) : lien d'action secondaire configurable via `ShellUiBrand.login.secondaryLink` (`{ label, href }`, ex. inscription POS) — clé absente = rien ne s'affiche, aucun libellé hardcodé.

### Patch Changes

- Updated dependencies [a8bf57a]
  - @creezio/shell-ui@0.9.0
  - @creezio/platform-core@0.9.0
  - @creezio/api-kernel@0.9.0

## 0.8.1

### Patch Changes

- @creezio/platform-core@0.8.1
- @creezio/api-kernel@0.8.1
- @creezio/shell-ui@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [848ec06]
  - @creezio/shell-ui@0.8.0
  - @creezio/api-kernel@0.8.0
  - @creezio/platform-core@0.8.0

## 0.7.1

### Patch Changes

- @creezio/platform-core@0.7.1
- @creezio/api-kernel@0.7.1
- @creezio/shell-ui@0.7.1

## 0.7.0

### Patch Changes

- @creezio/platform-core@0.7.0
- @creezio/api-kernel@0.7.0
- @creezio/shell-ui@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [d948fcc]
  - @creezio/shell-ui@0.6.0
  - @creezio/platform-core@0.6.0
  - @creezio/api-kernel@0.6.0

## 0.5.0

### Minor Changes

- 6f7e112: feat(interactive-demo) : collecteur de contributions démo par module — `DemoModuleContribution` + `collectInteractiveDemoDefaults()` (validation `validateDemoScenario`, dédup par id, ordre stable, erreurs agrégées explicites). Convention module étendue : champ optionnel `demo: { scenarios }` du `BrandModuleDef` (template `_template` + DOC-STANDARD-MODULE) et `collectDemoScenarios()` généré dans le registre `modules/index.ts` — le mount se câble en une ligne : `createInteractiveDemoMount({ defaults: collectDemoScenarios() })`. Dep serveur scaffoldée : `@creezio/interactive-demo` rejoint la clôture `@creezio` des apps marque.

### Patch Changes

- Updated dependencies [0ff4ed2]
- Updated dependencies [d674c86]
  - @creezio/shell-ui@0.5.0
  - @creezio/platform-core@0.5.0
  - @creezio/api-kernel@0.5.0
