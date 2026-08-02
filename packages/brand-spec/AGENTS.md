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
- `doctorBrandSpec` / `formatDoctorReport`
- `initBrandSpec`
- `resolveOnboardingDecl` / `toSetupWizardConfig`

## Tests

```bash
npm run build -w @creezio/brand-spec
node --test scripts/test-phase-brand-spec.mjs
```
