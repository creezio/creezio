# @creezio/factory

## 0.5.6

### Patch Changes

- d26f5db: Convention OS home = /dashboard, appliquée fail-closed par la factory et les gabarits de spec. `renderNextHomePage` redirige TOUJOURS vers `/dashboard` (plus de fallback `model.pages[0]` — vécu foove2 : `redirect("/notes")` résiduel et pas de page /dashboard alors que le workspace kit canonise tout href `/` → `/dashboard`), avec commentaire généré explicite (home réelle = `app/dashboard/page.tsx`). `ensureDashboardPage` garantit une page `/dashboard` dans TOUTE app générée (modèle générique et repo admin compris) ; `defaultWorkspaceHome` retourne toujours `/dashboard` ; le template dashboard dérive ses compteurs des entités réelles du spec (plus de labels CHR en dur). Gabarits brand-spec (interview.md / prd.md) : section « Conventions OS non négociables » (home /dashboard, `/` = pure redirection factory, nav accueil → /dashboard, routes OS + /site/\* réservées) — une interview générée ne peut plus proposer « accueil à / ».
- 83a1913: Templates factory : les scripts/feeds générés substituent les entités RÉELLES du ProductModel — `test-metier-parcours.mjs` testait un hardcode `notes` (404 sur une app sans ce module — vécu foove2-admin), le feed Meili générique indexait la table `notes` (absente du schema généré), et `test-meili-config.mjs` résolvait `meili-launcher.js`/`generic-indexer.js` par sondage d'un chemin monorepo kit inexistant dans une app npm (helper `electronShellDist` node_modules-first, porté de winhub). Fixture Meili générique : INSERT dans la table de la première entité du spec.
- Updated dependencies [d26f5db]
  - @creezio/brand-spec@0.9.3
  - @creezio/brand-config@0.9.3
  - @creezio/product-hub@0.9.3

## 0.5.5

### Patch Changes

- cfd5c31: Factory : les DEUX repos d'une marque naissent avec leurs `package-lock.json` — `maybePushBrandRepos` ne préparait les locks que du monorepo marque, le repo admin `<brand>-admin` était poussé sans aucun lock (vécu foove2-admin, 2026-08-13) ; échec explicite si un lock n'est pas produit. Tout scaffold (marque ET admin) génère aussi `.cursor/environment.json` (`npm install --no-audit --no-fund`) pour les cloud agents Cursor.

## 0.5.4

### Patch Changes

- 8c0ae0f: Dockerfile serveur : `ELECTRON_SKIP_BINARY_DOWNLOAD=1` dans le stage `deps` (electron atterrit dans l arbre prod via le lockfile malgre --omit=dev ; son postinstall telecharge ~100 Mo sur le CDN GitHub, flaky sous charge — echec de build vecu sur tempoflow 2026-08-12) + retries npm (`NPM_CONFIG_FETCH_RETRIES=5` etc.) dans les stages d install (reset TLS transitoire). Builds in-image deterministes, identiques sur tous les hotes.

## 0.5.3

### Patch Changes

- b13449f: server-docker : build 100% in-image — le stage `brand-build` du Dockerfile kit produit `build/electron` (tsc) et `ui/.next/standalone` (materialize + next build) ; `ensureUiBuild`/`ensureElectronBuild` hôte supprimés du chemin standard (`build`/`create`/`publish`/`up`). node/npm de l'hôte ne produisent plus aucun artefact d'image : même résultat sur tous les serveurs.

  Fix template tailwind factory (`renderUiTailwindConfig`) : suppression des globs `../../node_modules/@creezio/*` — le symlink workspace racine `@creezio/app-<brand>` → `server/` y matchait et Tailwind scannait `server/ui/node_modules` + `.next` (~900 Mo, ~20k fichiers → compile Next 30 s → 17 min+, hang tempoflow3-admin). Scan local `./node_modules/@creezio/*` uniquement (server/ui = projet npm indépendant, deps jamais hoistées).

  dockerignore v5 : sources `server/` + `server/ui` dans le contexte ; `**/node_modules`, `**/.next`, `build/` hôte exclus.

## 0.5.2

### Patch Changes

- @creezio/brand-config@0.9.0
- @creezio/product-hub@0.9.0
- @creezio/brand-spec@0.9.0

## 0.5.1

### Patch Changes

- f2baaf8: migrate-stack : provisioner resolu depuis l env de l instance (registre) avant
  le .env de marque — ce dernier peut viser un endpoint public legacy qui ignore
  serviceHost (ingress reste sur 127.0.0.1, 502 post-migration resto-lyon).
  - @creezio/brand-config@0.8.1
  - @creezio/product-hub@0.8.1
  - @creezio/brand-spec@0.8.1

## 0.5.0

### Minor Changes

- 848ec06: Module natif `@creezio/access-control` : visibilité modules/sidebar par rôle,
  administrable en UI.

  - **Nouveau package** : rôles déclaratifs marque (config) + overrides
    allow/deny en DB (`access_role_overrides`, `access_user_roles`,
    `access_audit_log` sur core.db), résolution dynamique `resolvePermissions`
    (cache 30 s invalidé aux écritures), API `/api/v1/access/*` gardée par
    `platform.access.manage`, UI admin « Rôles & accès » (matrice, comptes,
    journal).
  - - **platform-core** : manifeste `kit-packages.json` (liste officielle des
      packages publiés, généré au build, gate de fraîcheur) — les gates
      deps-integrity des apps le lisent au lieu de listes en dur.
  - **auth** : adaptateur `resolveEffectivePermissions` — `/me` et les JWT
    mintés (login, impersonation) embarquent les permissions résolues
    dynamiquement quand la marque configure access-control.
  - **shell-ui** : `CoreNavItem.permission` / `SidebarNavItem.permission` +
    filtrage des entrées primaires de sidebar (même logique que l'admin) ;
    entrée admin native « Rôles & accès ».
  - **api-kernel** : `ApiMount.permission` + hook `authorizeModuleAccess` —
    le kernel refuse l'appel API (401/403), pas seulement l'affichage.
  - **app-runtime** : montage du module sur la surface plateforme (store
    core.db, routes, injection auth) + garde kernel câblée (session, owner,
    machine keys bordure).
  - **factory / os-ui** : nouvelle marque générée = page `/admin/access`,
    entrée de nav avec permission, deps et transpilePackages à jour.

### Patch Changes

- eee10b4: migrate-stack : provisioner resolu depuis l env de l instance (registre) avant
  le .env de marque — ce dernier peut viser un endpoint public legacy qui ignore
  serviceHost (ingress reste sur 127.0.0.1, 502 post-migration resto-lyon).
  - @creezio/product-hub@0.8.0
  - @creezio/brand-config@0.8.0
  - @creezio/brand-spec@0.8.0

## 0.4.0

### Minor Changes

- adf6d46: **M2 — 1 instance serveur = 1 stack compose autonome (app + cloudflared sidecar).**

  - `server-docker create` génère par défaut un stack compose par instance :
    port interne fixe 18791, port hôte loopback auto (`127.0.0.1::18791`,
    `--host-port N` pour un fixe), sidecar cloudflared (token dans
    `tunnel.env` chmod 600), zéro port public. `--no-stack` = legacy.
  - `server-docker migrate-stack <nom>` : bascule une instance legacy en
    douceur — backup /data obligatoire, ingress tunnel repointé
    `http://app:18791` (provisioner `serviceHost`), rollback legacy auto si KO.
  - Kernel : mode sidecar (`CREEZIO_TUNNEL_SIDECAR=1`) — config tunnel seedée
    par env (`CREEZIO_TUNNEL_TOKEN/_HOSTNAME/_ID`), ingress via provisioner
    avec `serviceHost`, `startCloudflared` no-op (le sidecar tourne déjà).
  - Provisioner : `/reserve` et `/configure` acceptent `serviceHost` (défaut
    127.0.0.1 — rétrocompatible), persisté dans le state du slug.
  - `update` stack-aware (server-lib) : compose régénéré avec la nouvelle
    image, `compose up -d`, registre réaligné sur le port hôte réattribué.
  - start/stop/rm/logs/ls stack-aware ; SoT renderer partagée
    (`fleet-collector/instance-stack.mjs`) entre CLI factory et server-lib.
  - dev-stack (Q1) matérialise les pages OS avant `next dev` (le hook predev
    de server/ui est contourné par le spawn direct — Q5 appliqué au dev).

- b4b90a7: Quick wins audit de robustesse (Q1→Q9) :

  - **Q1/Q6** — dev-stack standard dans `@creezio/app-runtime/scripts/dev-stack.mjs`
    (`dev`/`stop`/`status`/`setup` : kernel + Next dev, détection de ports, .env,
    PID files `.creezio/`, kill par process group) ; les apps l'exposent via le
    proxy factory `scripts/creezio-dev.mjs` — zéro copie divergente.
  - **Q2** — `port-guard.mjs` partagé (`@creezio/desktop-tooling`) : port
    explicitement demandé et occupé = erreur actionnable avec PID
    (« npm run stop ou METIER_PORT=0 ») dans le harness e2e et le dev-stack.
  - **Q4** — `engines: node >=22.5` partout (node:sqlite l'exige) + `.nvmrc`.
  - **Q5** — garde anti-stale `materialize` : marker versionné
    `.materialized-from-os-ui` + mode `--check` (erreur claire si les pages
    matérialisées divergent de la version installée).
  - **Q8** — sémantique unique : `CREEZIO_KIT_ROOT` = clone du kit,
    `CREEZIO_APP_ROOT` = clone de l'app (`CREEZIO_ROOT` conservé en fallback
    legacy partout).
  - **Q9** — `npm run clean` cross-platform (`scripts/clean.mjs`, fini rm -rf).

### Patch Changes

- @creezio/brand-config@0.7.0
- @creezio/product-hub@0.7.0
- @creezio/brand-spec@0.7.0

## 0.3.1

### Patch Changes

- @creezio/brand-config@0.6.0
- @creezio/product-hub@0.6.0
- @creezio/brand-spec@0.6.0

## 0.3.0

### Minor Changes

- 142774b: Suppression définitive du vendoring : les artefacts générés par la factory ne référencent plus `vendor/creezio` — le proxy `creezio-cli.mjs` résout `CREEZIO_KIT_ROOT` → `node_modules/@creezio/factory` → chemin VPS, les wrappers desktop-tooling ne résolvent plus que via `node_modules`, et le test généré n'exclut plus de dossier `vendor`. Les gates de synchronisation de l'ère vendoring (O0, O5p, O9p, O10, O11, M1p, P0-intention) et la lib `intention-twins` sont retirées de la suite.

## 0.2.0

### Minor Changes

- 6f7e112: feat(interactive-demo) : collecteur de contributions démo par module — `DemoModuleContribution` + `collectInteractiveDemoDefaults()` (validation `validateDemoScenario`, dédup par id, ordre stable, erreurs agrégées explicites). Convention module étendue : champ optionnel `demo: { scenarios }` du `BrandModuleDef` (template `_template` + DOC-STANDARD-MODULE) et `collectDemoScenarios()` généré dans le registre `modules/index.ts` — le mount se câble en une ligne : `createInteractiveDemoMount({ defaults: collectDemoScenarios() })`. Dep serveur scaffoldée : `@creezio/interactive-demo` rejoint la clôture `@creezio` des apps marque.

### Patch Changes

- e23b259: feat(npm-deploy-tooling) : tooling de déploiement Docker en mode npm — le Dockerfile SoT (docker/server) installe les @creezio/\* depuis GitHub Packages via secret BuildKit CREEZIO_NPM_TOKEN (plus de COPY vendor ni symlinks, npm ci strict sur le lock racine workspace), dockerignore v4 sans exceptions vendor. Factory : les apps générées naissent npm (deps ^lockstep, .npmrc, workspaces racine, workflows ci+deploy seuls — kit-compat/vendor-update supprimés), ensure-server-lock.mjs valide les locks workspace, prepareBrandDistribution = locks npm. CLI server-docker : build/publish passent le secret BuildKit (CREEZIO_NPM_TOKEN requis) et ensureBrandStandalone ne matérialise plus de vendor. brand-config : FileSets asar résolus depuis node_modules (walk-up workspaces) au lieu de vendor/creezio.
- Updated dependencies [6f7e112]
- Updated dependencies [e23b259]
  - @creezio/brand-spec@0.5.0
  - @creezio/brand-config@0.5.0
  - @creezio/product-hub@0.5.0
