# AGENTS.md — @creezio/factory

## Mission

Maintenir le CLI `creezio` :

1. **Mode OS** (`new-app --name/--id/--domain`) : squelette Client+Serveur,
   slot métier vide (sandbox technique).
2. **Mode produit** (`new-app --from-prd <prd.md>`) : brief → `ProductModel` →
   artefacts métier + **main mince** (`startBrandDesktop`).
3. **BrandSpec** (`brand init|doctor|apply|smoke`) : SoT déclarative agent →
   apply via scaffold (ADR `docs/adr/ADR-brand-spec-app-runtime.md`).

Les générateurs vivent ici. Le métier généré **n’entre pas** dans
`@creezio/platform-core` (ADR `docs/adr/ADR-factory-from-prd.md` +
`ADR-no-brand-domain-in-native-packages.md`).
L’orchestration OS vit dans `@creezio/app-runtime` — **ne pas** la régénérer
en jumeau dans `main.ts`.

## Ne pas faire

- Ne pas recycler des GUID, feeds ou tokens de production.
- Ne pas hardcoder le SQL TempoFlow dans un package natif — seulement via
  générateurs → fichiers marque.
- **Ne pas** versionner un clone métier TempoFlow sous `templates/`.
- **Ne pas** générer un sidecar JSON (`metier-api.mjs` / `store.json`) comme
  SoT métier. Chemin nominal = `createSqliteRuntime` + `createApiKernel` +
  mounts `/api/v1/modules/*` + harness `brand-kernel-harness.mjs`.
- **Ne pas** hardcoder des UIDs Meili `tf2_*` dans le feed marque : générer
  `meili-feed.ts` avec `catalog_*` + `configureMeiliBrandFeed`.
- Desktop from-prd : `startBrandDesktop` / `startBrandKernelHarness`
  (`@creezio/app-runtime`) — pas le monolithe `installBrandDesktopRuntime`.
- Ne pas écraser des fichiers existants sans `--force`.
- Ne pas exiger des flags techniques si `--from-prd` suffit.
- `docs/FILES.md` est maintenu via `node scripts/generate-files-md.mjs factory` (gate `test-phase-docs-freshness`) — la colonne Rôle s'édite à la main, ne pas inventer d'autre format.

## Points d'entrée

- `bin/creezio.js` : binaire npm.
- `src/cli.ts` : `new-app` + dispatch `brand` / `server-docker`.
- `src/server-docker-cli.ts` : serveurs marque headless (`docker/server`).
- `src/brand-cli.ts` : BrandSpec init/doctor/apply/smoke.
- `src/product-model.ts` : `ProductModel`, `parseProductPrd`, `safeBrandId`.
- `src/scaffold.ts` / `scaffold-from-prd.ts` : artefacts.
- `src/generators/*` : schema, api, ui, **os-ui** (réf. + layout métier-only), nav, wiring, tests.
- Pages OS (`/mails`, `/taches`, `/setup`…) vivent dans **`@creezio/os-ui`** ;
  matérialisées sous `ui/app/(creezio-os)/` (gitignoré). **Interdit** de les
  versionner dans `ui/app/` d'une marque.
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
node --test scripts/test-phase-os-ui-scaffold.mjs
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
- `docs/adr/ADR-factory-from-prd.md`
- `docs/experiences/tempoflow3/PROMPT-PRODUIT.md`
- `docs/experiences/tempoflow3/PRD-PRODUIT.md`
