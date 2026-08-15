# packages/factory — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs factory` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `bin/`

| Fichier | Rôle |
|---|---|
| [`bin/creezio.js`](../bin/creezio.js) | Binaire npm |

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/admin-repo.ts`](../src/admin-repo.ts) | Scaffold du repo ADMIN dédié `<brand>-admin` (app OS complète en mode admin : modules @creezio/admin, landing, compose) — layout 2 repos. |
| [`src/brand-cli.ts`](../src/brand-cli.ts) | CLI `creezio brand` — init / doctor / apply / smoke sur un `brand-spec/`. |
| [`src/brand-module-init.ts`](../src/brand-module-init.ts) | (à documenter) |
| [`src/cli.ts`](../src/cli.ts) | CLI `new-app`, `--from-prd` |
| [`src/github-repos.ts`](../src/github-repos.ts) | Création + push des 2 repos GitHub privés d'une marque (monorepo + `<brand>-admin`) ; token env `GITHUB_TOKEN`/`CREEZIO_GITHUB_TOKEN` ou `.github-token`, vendor + package-lock synchronisés AVANT push. |
| [`src/index.ts`](../src/index.ts) | Exports publics |
| [`src/kit-release.ts`](../src/kit-release.ts) | (à documenter) |
| [`src/minimal-png.ts`](../src/minimal-png.ts) | Icône placeholder |
| [`src/package-lock.ts`](../src/package-lock.ts) | Cohérence package.json ↔ package-lock (npm ci Docker) — régénération lock-only / install. |
| [`src/plugin-templates.ts`](../src/plugin-templates.ts) | Installation des templates de plugins kit (`templates/plugins/<id>/`) dans le répertoire plugins d'une app (`<userData>/plugins/<id>/` + `.enabled`). |
| [`src/prepare-brand-distribution.ts`](../src/prepare-brand-distribution.ts) | Vendor sync + locks après chaque scaffold (new-app / brand apply / push). |
| [`src/product-model.ts`](../src/product-model.ts) | `ProductModel`, parse PRD |
| [`src/scaffold-from-prd.ts`](../src/scaffold-from-prd.ts) | Artefacts métier / wiring |
| [`src/scaffold.ts`](../src/scaffold.ts) | Scaffold OS + branche PRD |
| [`src/server-docker-cli.ts`](../src/server-docker-cli.ts) | CLI `creezio server-docker` — create/start/stop/rm/logs/ls, build/up/down/proof, `publish` (+ rétention, `--release` = déclaration draft dans l'app admin), `admin up`, `agent up`, `enroll`. |
| [`src/server-docker-owner.ts`](../src/server-docker-owner.ts) | Politique `server-docker create` fail-closed owner : `CREEZIO_OWNER_EMAIL` / `_PASSWORD` requis sauf `CREEZIO_TUNNEL_LOCAL=1` ; first-run `POST /api/v1/os/setup` + vérif login ; jamais le mot de passe en log. |
| [`src/server-docker-registry.ts`](../src/server-docker-registry.ts) | Registre d'instances serveur Docker par marque — SoT `docker-data/servers.json` (image `creezio-server-<brandId>`, containers `<brandId>-server-<nom>`). |
| [`src/server-docker-tunnel.ts`](../src/server-docker-tunnel.ts) | Politique `server-docker create` fail-closed : contrat CF (`CREEZIO_CF_API_TOKEN` / `_ACCOUNT_ID` / `_ZONE_ID`) requis sauf `CREEZIO_TUNNEL_LOCAL=1` ; slug réservé → `<brand>-<slug>` ; secrets CF hors registre (`cf.env` 600). |
| [`src/write-app-file.ts`](../src/write-app-file.ts) | Écriture des fichiers d'app marque — respecte le marker `creezio:owned-by-brand` même avec `--force` (merge package.json, jamais de wipe du métier enrichi). |

## `src/generators/`

| Fichier | Rôle |
|---|---|
| [`src/generators/api.ts`](../src/generators/api.ts) | API métier HTTP |
| [`src/generators/brand-workflows.ts`](../src/generators/brand-workflows.ts) | (à documenter) |
| [`src/generators/index.ts`](../src/generators/index.ts) | Re-exports |
| [`src/generators/linux-e2e.ts`](../src/generators/linux-e2e.ts) | Artefacts pack Linux / E2E / env pour `--from-prd` (wrappers minces vers desktop-tooling, metier-base, `.env.example`). |
| [`src/generators/modules-registry.ts`](../src/generators/modules-registry.ts) | (à documenter) |
| [`src/generators/native-runtime.ts`](../src/generators/native-runtime.ts) | Générateurs du runtime natif OS d'une marque — SQLite + api-kernel (EntitySpec CRUD), pas de sidecar JSON. |
| [`src/generators/nav.ts`](../src/generators/nav.ts) | Nav shell-ui |
| [`src/generators/os-ui.ts`](../src/generators/os-ui.ts) | Catalogue des pages OS Next (SoT `@creezio/os-ui/routes`) — matérialisées sous `ui/app/(creezio-os)/` (gitignoré), plus versionnées dans la marque. |
| [`src/generators/schema.ts`](../src/generators/schema.ts) | SQL + schema TS brand |
| [`src/generators/server-docker-scripts.ts`](../src/generators/server-docker-scripts.ts) | Scripts npm `server-docker:*` + résolveur CLI kit générés dans chaque app (héritage du serveur Docker sans copie). |
| [`src/generators/tests.ts`](../src/generators/tests.ts) | Smokes générés |
| [`src/generators/ui.ts`](../src/generators/ui.ts) | Pages Next + SPA |
| [`src/generators/wiring.ts`](../src/generators/wiring.ts) | Twins paths/host-stack/boot |

## `templates/plugins/insights-assistant/`

| Fichier | Rôle |
|---|---|
| [`templates/plugins/insights-assistant/index.js`](../templates/plugins/insights-assistant/index.js) | Sidecar du template `insights-assistant` : découverte des modules via `/api/v1/core/architecture`, échantillonnage plafonné, synthèse LLM (`llm:use`), cache `data/plugin.sqlite`. Zéro métier marque. |

## `templates/plugins/insights-assistant/migrations/`

| Fichier | Rôle |
|---|---|
| [`templates/plugins/insights-assistant/migrations/001_init.sql`](../templates/plugins/insights-assistant/migrations/001_init.sql) | Migration initiale du cache de synthèses du plugin (appliquée par le sidecar, table `_plugin_migrations`). |
