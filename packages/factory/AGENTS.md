# AGENTS.md — @creezio/factory

## Mission

Maintenir le CLI `creezio new-app` :

1. **Mode OS** (`--name/--id/--domain`) : squelette Client+Serveur générique,
   slot métier vide (sandbox technique).
2. **Mode produit** (`--from-prd <prd.md>`) : parser un brief non technique →
   `ProductModel` → générer schéma brand, API métier, pages UI, nav, wiring
   runtime et smokes **dans le dossier marque**.

Les générateurs vivent ici. Le métier généré **n’entre pas** dans
`@creezio/platform-core` (ADR `docs/ADR-factory-from-prd.md` +
`ADR-no-brand-domain-in-native-packages.md`).

## Ne pas faire

- Ne pas recycler des GUID, feeds ou tokens de production.
- Ne pas hardcoder le SQL TempoFlow dans un package natif — seulement via
  générateurs → fichiers marque.
- **Ne pas** versionner un clone métier TempoFlow sous `templates/` (SPA/API
  oracle, optimiser/scan…). Bootstrap = générateurs génériques + ProductModel
  cœur ; modules riches = agent + mini-PRDs dans la marque.
- Ne pas écraser des fichiers existants sans `--force`.
- Ne pas exiger des flags techniques si `--from-prd` suffit.
- Ne pas toucher `docs/FILES.md` sans demande dédiée.

## Points d'entrée

- `bin/creezio.js` : binaire npm.
- `src/cli.ts` : parsing (`--from-prd`, `--name`, …) et `new-app`.
- `src/product-model.ts` : `ProductModel`, `parseProductPrd`, `safeBrandId`.
- `src/scaffold.ts` : scaffold OS + branchement `productModel`.
- `src/scaffold-from-prd.ts` : artefacts métier + wiring.
- `src/generators/*` : schema, api, ui, nav, wiring, tests.
- `fixtures/prd-tempoflow-produit.md` : gold CHR.
- `src/index.ts` : exports publics.

## Modifier sans casser

- Toute nouvelle option CLI → `CliArgs`, `parseArgs`, `printHelp`, `NewAppOptions`.
- `safeBrandId` doit continuer à mapper `tempoflow` → `tempoflow3`.
- Les smokes générés (`test:metier-parcours`, `test:first-run-auth`) doivent
  rester exécutables sans binaire Electron.
- `--force` reste la seule voie d'écrasement.

## Tests/gates

```bash
npm run build -w @creezio/factory
node --test scripts/test-phase-factory-prd.mjs
node --test scripts/test-phase-factory-prd-experience.mjs
```

Smoke manuel :

```bash
node packages/factory/bin/creezio.js new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out /tmp/tempoflow3 --force
cd /tmp/tempoflow3 && npm run test:metier-parcours
```

## Liens

- `README.md`
- `docs/ADR-factory-from-prd.md`
- `docs/experiences/tempoflow3/PROMPT-PRODUIT.md`
- `docs/experiences/tempoflow3/PRD-PRODUIT.md`
