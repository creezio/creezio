# @creezio/factory

## 0.3.1

### Patch Changes

- @creezio/brand-config@0.6.0
- @creezio/product-hub@0.6.0
- @creezio/brand-spec@0.6.0

## 0.3.0

### Minor Changes

- 142774b: Suppression définitive du vendoring : les artefacts générés par la factory ne référencent plus `vendor/creezio` — le proxy `creezio-cli.mjs` résout `CREEZIO_KIT_ROOT` → `node_modules/@creezio/factory` → chemin VPS, les wrappers desktop-tooling ne résolvent plus que via `node_modules`, et le test généré n'exclut plus de dossier `vendor`. Les gates de synchronisation de l'ère vendoring (O0, O5p, O9p, O10, O11, M1p, P0-intention) et la lib `intention-twins` sont retirées de la suite.

## 0.2.0

### Minor Changes

- 6f7e112: feat(interactive-demo) : collecteur de contributions démo par module — `DemoModuleContribution` + `collectInteractiveDemoDefaults()` (validation `validateDemoScenario`, dédup par id, ordre stable, erreurs agrégées explicites). Convention module étendue : champ optionnel `demo: { scenarios }` du `BrandModuleDef` (template `_template` + DOC-STANDARD-MODULE) et `collectDemoScenarios()` généré dans le registre `modules/index.ts` — le mount se câble en une ligne : `createInteractiveDemoMount({ defaults: collectDemoScenarios() })`. Dep serveur scaffoldée : `@creezio/interactive-demo` rejoint la clôture `@creezio` des apps marque.

### Patch Changes

- e23b259: feat(npm-deploy-tooling) : tooling de déploiement Docker en mode npm — le Dockerfile SoT (docker/server) installe les @creezio/\* depuis GitHub Packages via secret BuildKit CREEZIO_NPM_TOKEN (plus de COPY vendor ni symlinks, npm ci strict sur le lock racine workspace), dockerignore v4 sans exceptions vendor. Factory : les apps générées naissent npm (deps ^lockstep, .npmrc, workspaces racine, workflows ci+deploy seuls — kit-compat/vendor-update supprimés), ensure-server-lock.mjs valide les locks workspace, prepareBrandDistribution = locks npm. CLI server-docker : build/publish passent le secret BuildKit (CREEZIO_NPM_TOKEN requis) et ensureBrandStandalone ne matérialise plus de vendor. brand-config : FileSets asar résolus depuis node_modules (walk-up workspaces) au lieu de vendor/creezio.
- Updated dependencies [6f7e112]
- Updated dependencies [e23b259]
  - @creezio/brand-spec@0.5.0
  - @creezio/brand-config@0.5.0
  - @creezio/product-hub@0.5.0
