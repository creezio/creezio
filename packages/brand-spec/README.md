# @creezio/brand-spec

Contrat déclaratif **BrandSpec** : identité de marque + modules + besoins
plateforme, décrits en YAML dans le dossier `brand-spec/` d'un repo marque.
C'est la source of truth de l'agent créateur de marque ; le runtime OS reste
dans `@creezio/app-runtime` / `@creezio/electron-shell`.

## API (câblée en prod via le CLI `creezio brand`)

| Export | Rôle |
|--------|------|
| `loadBrandSpec` / `resolveBrandSpecDir` | Charge et résout un dossier `brand-spec/` |
| `doctorBrandSpec` / `formatDoctorReport` | Diagnostic (`creezio brand doctor --spec brand-spec`) — helpers modules ignorés ; démo pauvre = warn ; pin < 0.10.1 (Winhub 0.9.2) : démo absente = warn ; `MODULE_MEILI_TABLE_UNKNOWN` si `meiliIndexes.table` n'existe dans aucune migration de l'app (résolution cross-module + `fromprd_brand_*` ; échappatoire `tableProvisionedBy`) |
| `initBrandSpec` | Scaffold d'un dossier `brand-spec/` neuf |
| `resolveOnboardingDecl` / `toSetupWizardConfig` | Déclaration onboarding → config wizard |

## Usage

```bash
# Depuis un repo marque (ex. /opt/docker/tempoflow3)
creezio brand doctor --spec brand-spec
creezio brand apply  --spec brand-spec
```

## Tests

```bash
cd /opt/docker/creezio
npm run build -w @creezio/brand-spec
node --test scripts/test-phase-brand-spec.mjs
```

## Liens

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
- [../../docs/agents/CREATE-BRAND.md](../../docs/agents/CREATE-BRAND.md)
