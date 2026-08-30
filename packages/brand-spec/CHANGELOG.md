# @creezio/brand-spec

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

### Minor Changes

- 17c82b1: P1.c — H7 : neutralisation des contrats au vocabulaire marque (ARCHITECTURE_VERSION H6 → H7).

  Breaking contrôlé avec **dual-read une version** (politique de dépréciation —
  voir `docs/adr/ADR-h7-neutralize-brand-contracts.md`) :

  - **search** : `countTables`/`CatalogSqlCounts` génériques (`Record<string, …>`),
    `countKey` libre par index ; alias `sites`→`fournisseurs` normalisé par
    `fingerprintCountKey` (une version) ; `createChrCatalogMeiliFeed`,
    `expectedMeiliCounts`, `countGedSql` dépréciés (retrait au prochain bump).
    Meili reste fail-closed à l'identique.
  - **host-runtime** : env bridge Hermes dérivé du manifest (`envKey`) ; dual-read
    `TEMPOFLOW_*`, `TF2_HERMES_REMOTE_KEY` et fichiers `~/.tempoflow-*` legacy
    avec warnings bruyants ; `clearTempoflowGeneratedWebuiPassword` déprécié
    (alias de `clearGeneratedWebuiPassword`).
  - **brand-spec** : `vertical?: string` (libre), `feedPreset?: string` (id du
    registre de presets factory ; valeur legacy `<vertical>-catalog` normalisée).
  - **observability** : plus de fallbacks `CERTIVAN_/FIDU_FLEET_STATE_DIR` —
    lecture générique de `${envPrefix}_FLEET_STATE_DIR` dérivé du manifest.
  - **propagation** : canaux data-driven (`listUpdateChannels`,
    `configureBrandChannels`, `brandPrChannelId`) ; `UPDATE_CHANNELS` déprécié
    (snapshot) ; plus de noms de marque ni chemins absolus dans les types.
  - **factory** : registre de presets de feed Meili
    (`registerMeiliFeedPreset`/`getMeiliFeedPreset`) — preset catalogue CHR
    inliné dans le code marque généré.

  Migration marque : codemod idempotent `scripts/codemods/H7/h7-neutralize-brand-contracts.mjs`
  (`ROOT=<clone marque> node …`).

## 0.11.0

## 0.10.15

### Patch Changes

- 0391870: P1.a — invariants d'architecture gravés en gates. brand-spec : le doctor rapporte `CREEZIO_MANIFEST_MISALIGNED` (error fail-closed) quand une dep `@creezio/*` a des specs divergentes entre les manifests d'une app marque (racine/server/server/ui/client — incident réel login 0.6.0, règle d'or docs/PROPAGATION.md). electron-shell : suppression des 2 derniers imports statiques d'`electron` dans `src/host/browser-tabs` (chrome-ua, browser-tab-manager) au profit de `loadElectron()` — `src/host/**` reste chargeable en Node pur (gate `test-phase-host-no-electron`).

## 0.10.14

## 0.10.13

### Patch Changes

- e07d2cf: Meili = composant CORE fail-closed (décision plateforme 2026-08-28) :

  - `maybeBootBrandMeili` : feed avec ≥ 1 index + binaire absent / start KO =
    **throw `MeiliRequiredError`** (échec de boot explicite, comme une DB
    absente). Échappatoire unique `CREEZIO_ALLOW_NO_MEILI=1` (dev/tests
    hors-browse, warning bruyant). Plus de `engine:"sql-fallback"` par défaut.
  - Entity-list (`createEntityApiMount`) : entité indexée + Meili KO =
    **503 `{error:"meili_unavailable"}`** (ou `engine:"indexing"` pendant
    l'indexation initiale) — zéro LIKE SQL de secours sur le catalogue. SQL
    reste légitime hors index (entité non indexée, filtre hors index visible,
    `?ids=`, archives).
  - Nouveau `browseMeiliIndexOutcome` (api-kernel + electron-shell/meili) :
    issue discriminée `ok / empty_index / index_missing / filter_rejected /
unavailable / unconfigured` ; `browseMeiliIndex` conservé (compat `null`).
  - Doctor brand-spec : `MODULE_MEILI_MISSING` fail-closed (0.10.13+) — chaque
    module métier avec entité listable déclare `meiliIndexes` (schéma data +
    index) ou `horsIndexJustification` explicite.
  - `startBrandDesktop` propage `MeiliRequiredError` (plus de swallow).

## 0.10.12

## 0.10.11

## 0.10.10

## 0.10.9

### Patch Changes

- 4cd6614: `creezio brand create` is the only way to birth a brand (no notes, no `server/crm/`, no `demo-app`). Doctor fails closed on stub specs and leftover notes so an agent cannot scaffold a notes/demo app.

  Terminer / Quitter retire le curseur singleton du DOM (`#creezio-demo-cursor` + `data-creezio-demo-ui`) au lieu de le laisser en opacity 0.

  `server-docker create --profile prod` forwarde aussi `CREEZIO_FLEET_BACKEND_URL` et `CREEZIO_FLEET_BACKEND_BASIC`.

## 0.10.8

### Patch Changes

- a2fea46: **feat — `mcpTools` retiré ; `MODULE_MCP_TOOLS_DEPRECATED` = error.**

  `BrandModuleDef.mcpTools` n'existe plus. SoT = `operations[]` → tools MCP générés (`listOperations()`). Plus de merge legacy (`mergeGeneratedAndLegacy` / `warnLegacyModuleMcpTools`). Doctor fail-closed : un `mcpTools()` restant = error. Le hook apps `discoverModuleTools` reste (extras / JWT), sans documenter de tools manuscrits.

## 0.10.7

### Patch Changes

- 55b1cd5: **feat — catalogue `listOperations()` + tools MCP générés + doctor ops non vides.**

  `api.listOperations()` alimente `/admin/api` (plus seulement la surface Hono). Les tools `module.<mountId>.<op.id>` sont générés depuis ce catalogue (handler = requête HTTP synthétique). Doctor fail-closed : `MODULE_OP_MISSING` si `apiMounts` sans `operations[]` **non vide** (pin ≥ 0.10.6) ; EntitySpec seul = OK (CRUD auto) ; `mcpTools` restant = `MODULE_MCP_TOOLS_DEPRECATED` (warn). Mounts kit/OS hors `modules/*.ts` non scannés.

## 0.10.6

### Patch Changes

- 1c7ec66: **feat — SoT unique : une opération de module = HTTP + /admin/api + tool MCP.**

  `ModuleOperation` sur `ApiMount` / EntitySpec (CRUD auto). Le kit collecte puis génère les tools `module.<mountId>.<op.id>` (handler = requête HTTP synthétique). Catalogue `/admin/api` = ops kernel, plus seulement la surface Hono admin. `mcpTools()` déprécié (doctor error si recouvrement). Doctor fail-closed `MODULE_OP_MISSING` / `MODULE_OP_UNCATALOGUED` depuis 0.10.6. Enable MCP = policies sur tools générés (`mcpPublishDefault`, `roles`).

## 0.10.5

## 0.10.4

### Patch Changes

- 03046ff: **doctor — helpers ignorés ; démo pauvre / pin < 0.10.1 = warn.**

  `creezio brand doctor` ne traite plus `_lib`, `shared.ts`, `mcp-shared.ts`, `meili-shared.ts`, `index.ts`, `types.ts` comme des modules (plus de `MODULE_DEMO_MISSING` sur l'assemblage). Une démo trop pauvre (pas d'`autoStart`, steps trop courts) émet `MODULE_DEMO_THIN` en **warn**, pas fail-closed. Un pin kit < 0.10.1 (ex. Winhub encore en 0.9.2) : démo absente = warn — le CLI reste celui de `CREEZIO_KIT_ROOT`.

## 0.10.3

## 0.10.2

## 0.10.1

### Patch Changes

- 595c5fb: **Fail-closed — démo interactive native obligatoire** (plus optionnelle).

  Une app `--from-prd` / `create-brand` sort avec `createInteractiveDemoMount`, `interactiveDemoMigrations`, CSS + dep UI. `CreezioUiBoot` monte `InteractiveDemoRoot` (lanceur sidebar) : le chrome marque ne peut plus l'oublier. `brand module init` pose un stub `demo.scenarios` jouable (`genericOsTourScenario` + tour module). Gates : `test-phase-create-brand` assert les 4 branchements ; doctor / `test:modules` exigent ≥ 1 scénario par module. `server-docker create` (après setup owner) : `GET /api/v1/modules/interactive-demo/scenarios` ≥ 1, sinon échec — sauté si owner skip (`CREEZIO_TUNNEL_LOCAL=1` sans creds). Id `os-tour` partagé (premier gagne). Seed données métier = marque.

## 0.10.0

## 0.9.4

## 0.9.3

### Patch Changes

- d26f5db: Convention OS home = /dashboard, appliquée fail-closed par la factory et les gabarits de spec. `renderNextHomePage` redirige TOUJOURS vers `/dashboard` (plus de fallback `model.pages[0]` — vécu foove2 : `redirect("/notes")` résiduel et pas de page /dashboard alors que le workspace kit canonise tout href `/` → `/dashboard`), avec commentaire généré explicite (home réelle = `app/dashboard/page.tsx`). `ensureDashboardPage` garantit une page `/dashboard` dans TOUTE app générée (modèle générique et repo admin compris) ; `defaultWorkspaceHome` retourne toujours `/dashboard` ; le template dashboard dérive ses compteurs des entités réelles du spec (plus de labels CHR en dur). Gabarits brand-spec (interview.md / prd.md) : section « Conventions OS non négociables » (home /dashboard, `/` = pure redirection factory, nav accueil → /dashboard, routes OS + /site/\* réservées) — une interview générée ne peut plus proposer « accueil à / ».

## 0.9.2

## 0.9.1

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.1

## 0.7.0

## 0.6.0

## 0.5.0

### Minor Changes

- 6f7e112: feat(interactive-demo) : collecteur de contributions démo par module — `DemoModuleContribution` + `collectInteractiveDemoDefaults()` (validation `validateDemoScenario`, dédup par id, ordre stable, erreurs agrégées explicites). Convention module étendue : champ optionnel `demo: { scenarios }` du `BrandModuleDef` (template `_template` + DOC-STANDARD-MODULE) et `collectDemoScenarios()` généré dans le registre `modules/index.ts` — le mount se câble en une ligne : `createInteractiveDemoMount({ defaults: collectDemoScenarios() })`. Dep serveur scaffoldée : `@creezio/interactive-demo` rejoint la clôture `@creezio` des apps marque.
