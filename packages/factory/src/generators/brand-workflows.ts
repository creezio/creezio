/**
 * Workflows GitHub CI/CD scaffoldés pour chaque marque Creezio (mode npm).
 *
 * Contrat flotte (même filet pour TOUTES les apps Creezio) :
 *   - `ci.yml` — anti-régression sur chaque push/PR (GitHub-hosted) :
 *     install workspaces (lock racine SoT), build backend, gates complètes
 *     (`npm test`, dont les gates module colocalisées), build UI ;
 *   - `deploy.yml` — CD : ne part que sur CI verte de main (workflow_run),
 *     runner self-hosted du serveur de la marque.
 *
 * Distribution npm (docs/NPM-DISTRIBUTION.md du kit) : les deps @creezio/*
 * sont des packages publiés sur GitHub Packages. Plus de vendor pinné →
 * plus de kit-compat.yml / vendor-update.yml / test-vendor-integrity :
 * l'intégrité est garantie par `npm ci` (lockfile commité + registre), la
 * fraîcheur kit par un bump de version (`npm update "@creezio/*"`).
 *
 * Auth registre : le .npmrc commité référence ${CREEZIO_NPM_TOKEN} ; la CI
 * l'alimente via le secret repo CREEZIO_NPM_TOKEN (PAT read:packages org
 * creezio — `gh secret set CREEZIO_NPM_TOKEN -R <owner/marque>`).
 *
 * Les tests NATIFS Creezio restent dans le repo kit : la CI de marque ne
 * prouve que le métier (gates colocalisées) et l'intégration (gates
 * transversales).
 */

export type BrandWorkflowsOptions = {
  brandId: string;
  /** Labels du runner self-hosted (défaut : [self-hosted, fluxpro]). */
  runnerLabels?: string[];
};

function labels(opts: BrandWorkflowsOptions): string {
  return `[${(opts.runnerLabels ?? ["self-hosted", "fluxpro"]).join(", ")}]`;
}

export function renderBrandCiWorkflow(opts: BrandWorkflowsOptions): string {
  return `# CI ${opts.brandId} — anti-régression sur chaque push/PR (contrat flotte
# Creezio : les tests natifs vivent dans le repo kit ; ici, gates métier
# colocalisées + intégration). Deps @creezio/* = packages npm versionnés
# (GitHub Packages) — installation standard workspaces racine, zéro vendor.
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    env:
      AUTH_DISABLED: "1"
      CREEZIO_NATIVE_WARM: "0"
      CREEZIO_ROOT: \${{ github.workspace }}
      # Secret repo (PAT read:packages sur l'org creezio) — consommé par le
      # .npmrc commité (jamais de token en clair dans le repo).
      # Poser le secret : gh secret set CREEZIO_NPM_TOKEN -R <owner/marque>.
      CREEZIO_NPM_TOKEN: \${{ secrets.CREEZIO_NPM_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Install serveur (workspace racine, registre @creezio)
        run: npm ci

      - name: Install UI (projet npm indépendant — standalone self-contained)
        run: npm ci --prefix server/ui

      - name: Build backend
        run: npm run build:runtime --prefix server

      - name: Gates complètes (transversales + modules colocalisés)
        run: npm test --prefix server

      - name: Build front (Next)
        run: npm run build:ui --prefix server
`;
}

export function renderBrandDeployWorkflow(
  opts: BrandWorkflowsOptions,
): string {
  return `# CD ${opts.brandId} — ne part que sur CI verte de main (workflow_run).
# À adapter à l'infra de la marque (server-docker publish + update
# --backup, healthcheck domaine). Requiert le runner self-hosted du SERVEUR
# DE LA MARQUE (chaque app a son serveur + son runner — installer via
# docs/CONTRIBUTING-BRANDS.md du kit). Le token registre npm passe en
# secret BuildKit au build (creezio server-docker publish le transmet —
# exporter CREEZIO_NPM_TOKEN sur le runner, PAT read:packages).
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-${opts.brandId}
  cancel-in-progress: false

jobs:
  deploy:
    if: >-
      github.event_name == 'workflow_dispatch' ||
      github.event.workflow_run.conclusion == 'success'
    runs-on: ${labels(opts)}
    timeout-minutes: 30
    steps:
      - name: Déployer (adapter : server-docker publish + update --backup)
        run: |
          echo "::warning::deploy non câblé pour ${opts.brandId} — adapter deploy.yml (voir tempoflow3)"
`;
}

/** Les fichiers CI/CD d'une marque : chemin relatif racine → contenu. */
export function renderBrandWorkflowFiles(
  opts: BrandWorkflowsOptions,
): Record<string, string> {
  return {
    ".github/workflows/ci.yml": renderBrandCiWorkflow(opts),
    ".github/workflows/deploy.yml": renderBrandDeployWorkflow(opts),
  };
}
