# @creezio/factory

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
