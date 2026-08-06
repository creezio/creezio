# @creezio/factory — inventaire fichier par fichier

> Chemins relatifs à `packages/factory/`.

| Fichier | Rôle |
|---|---|
| [`bin/creezio.js`](../bin/creezio.js) | Binaire npm |
| [`src/cli.ts`](../src/cli.ts) | CLI `new-app`, `--from-prd` |
| [`src/product-model.ts`](../src/product-model.ts) | `ProductModel`, parse PRD |
| [`src/scaffold.ts`](../src/scaffold.ts) | Scaffold OS + branche PRD |
| [`src/scaffold-from-prd.ts`](../src/scaffold-from-prd.ts) | Artefacts métier / wiring |
| [`src/generators/schema.ts`](../src/generators/schema.ts) | SQL + schema TS brand |
| [`src/generators/api.ts`](../src/generators/api.ts) | API métier HTTP |
| [`src/generators/ui.ts`](../src/generators/ui.ts) | Pages Next + SPA |
| [`src/generators/nav.ts`](../src/generators/nav.ts) | Nav shell-ui |
| [`src/generators/wiring.ts`](../src/generators/wiring.ts) | Twins paths/host-stack/boot |
| [`src/generators/tests.ts`](../src/generators/tests.ts) | Smokes générés |
| [`src/generators/index.ts`](../src/generators/index.ts) | Re-exports |
| [`src/minimal-png.ts`](../src/minimal-png.ts) | Icône placeholder |
| [`src/vendor-sync.ts`](../src/vendor-sync.ts) | Sync vendor kit → marque avant push GitHub (clone autonome) |
| [`src/index.ts`](../src/index.ts) | Exports publics |
| [`fixtures/prd-tempoflow-produit.md`](../fixtures/prd-tempoflow-produit.md) | Gold PRD CHR |
| [`fixtures/prd-tempoflow-produit.expected.json`](../fixtures/prd-tempoflow-produit.expected.json) | Expected model |
