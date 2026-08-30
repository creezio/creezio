# AGENTS.md — @creezio/brand-spec

## Mission

Contrat déclaratif **BrandSpec** : identité marque + modules + besoins
plateforme (YAML). SoT pour l'agent créateur ; le runtime reste dans
`@creezio/app-runtime` / electron-shell.

## Ne pas faire

- Pas de code métier CHR / SQL TempoFlow ici.
- Pas de launchers OS ou sidecars JSON.
- Pas de questionnaire utilisateur final (domaine marque) dans ce package.

## API

- `loadBrandSpec` / `resolveBrandSpecDir`
- `doctorBrandSpec` / `formatDoctorReport` — helpers modules ignorés ;
  démo pauvre = warn ; pin < 0.10.1 (Winhub 0.9.2) : démo absente = warn
- Contrat ops 0.10.6+ (pin ≥ 0.10.6 = error, sinon warn) :
  - `MODULE_OP_MISSING` — `apiMounts` sans `operations[]` non vide
  - `MODULE_OP_UNCATALOGUED` — `extraRoutes` hors `operations[]`
  - `MODULE_OP_MCP_OVERLAP` — `mcpTools()` collision de nom avec une op
  - `MODULE_MCP_TOOLS_DEPRECATED` — `mcpTools()` restant **sans** collision
    (**error** depuis 0.10.8 — `mcpTools` n'existe plus, SoT = `operations[]`)
- Contrat de module importé du kit P2.c / H9 (pin ≥ 0.16.0 = error, sinon
  warn — ADR `docs/adr/ADR-p2c-module-contract.md`) :
  - `MODULE_TYPES_DIVERGENT` — `modules/types.ts` redéclare localement
    `BrandModuleDef`/`BrandNavItem`/`BrandMeiliIndex` (attendu : ré-export
    `@creezio/app-runtime`, codemod `scripts/codemods/H9/`)
  - `MODULE_PERMISSION_MISSING` — apiMount manuscrit sans `permission` ni
    `accessJustification` (règle d'or n°7, audit F3.4)
  - `MODULE_PERMISSION_UNQUALIFIED` — **warn** : `accessJustification:
    "à qualifier"` (dette posée par le codemod H9, jamais une permission
    inventée)
- `initBrandSpec`
- `resolveOnboardingDecl` / `toSetupWizardConfig`

## Tests

```bash
npm run build -w @creezio/brand-spec
node --test scripts/test-phase-brand-spec.mjs
```
