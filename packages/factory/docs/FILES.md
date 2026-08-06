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
| [`src/admin-repo.ts`](../src/admin-repo.ts) | (à documenter) |
| [`src/brand-cli.ts`](../src/brand-cli.ts) | (à documenter) |
| [`src/cli.ts`](../src/cli.ts) | CLI `new-app`, `--from-prd` |
| [`src/github-repos.ts`](../src/github-repos.ts) | (à documenter) |
| [`src/index.ts`](../src/index.ts) | Exports publics |
| [`src/minimal-png.ts`](../src/minimal-png.ts) | Icône placeholder |
| [`src/plugin-templates.ts`](../src/plugin-templates.ts) | (à documenter) |
| [`src/product-model.ts`](../src/product-model.ts) | `ProductModel`, parse PRD |
| [`src/scaffold-from-prd.ts`](../src/scaffold-from-prd.ts) | Artefacts métier / wiring |
| [`src/scaffold.ts`](../src/scaffold.ts) | Scaffold OS + branche PRD |
| [`src/server-docker-cli.ts`](../src/server-docker-cli.ts) | (à documenter) |
| [`src/server-docker-registry.ts`](../src/server-docker-registry.ts) | (à documenter) |
| [`src/vendor-sync.ts`](../src/vendor-sync.ts) | Sync vendor kit → marque avant push GitHub (clone autonome) |
| [`src/write-app-file.ts`](../src/write-app-file.ts) | (à documenter) |

## `src/generators/`

| Fichier | Rôle |
|---|---|
| [`src/generators/api.ts`](../src/generators/api.ts) | API métier HTTP |
| [`src/generators/index.ts`](../src/generators/index.ts) | Re-exports |
| [`src/generators/linux-e2e.ts`](../src/generators/linux-e2e.ts) | (à documenter) |
| [`src/generators/native-runtime.ts`](../src/generators/native-runtime.ts) | (à documenter) |
| [`src/generators/nav.ts`](../src/generators/nav.ts) | Nav shell-ui |
| [`src/generators/os-ui.ts`](../src/generators/os-ui.ts) | (à documenter) |
| [`src/generators/schema.ts`](../src/generators/schema.ts) | SQL + schema TS brand |
| [`src/generators/server-docker-scripts.ts`](../src/generators/server-docker-scripts.ts) | (à documenter) |
| [`src/generators/tests.ts`](../src/generators/tests.ts) | Smokes générés |
| [`src/generators/ui.ts`](../src/generators/ui.ts) | Pages Next + SPA |
| [`src/generators/wiring.ts`](../src/generators/wiring.ts) | Twins paths/host-stack/boot |

## `templates/plugins/insights-assistant/`

| Fichier | Rôle |
|---|---|
| [`templates/plugins/insights-assistant/index.js`](../templates/plugins/insights-assistant/index.js) | (à documenter) |

## `templates/plugins/insights-assistant/migrations/`

| Fichier | Rôle |
|---|---|
| [`templates/plugins/insights-assistant/migrations/001_init.sql`](../templates/plugins/insights-assistant/migrations/001_init.sql) | (à documenter) |
