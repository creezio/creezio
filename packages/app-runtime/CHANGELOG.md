# @creezio/app-runtime

## 0.9.1

### Patch Changes

- f825a95: fix(app-runtime): health « degraded » cosmétique au boot en mode sidecar M2 — l'étape « tunnel » appelait le provisioner (172.17.0.1, gateway docker0) injoignable depuis le réseau compose du stack et partait en timeout 30 s. En mode sidecar, la re-configuration provisioner devient best-effort en arrière-plan et l'étape valide l'état RÉEL du tunnel en sondant l'URL publique avec retry + backoff (opt-out : CREEZIO_TUNNEL_PUBLIC_PROBE=0).
  - @creezio/brand-config@0.9.1
  - @creezio/platform-core@0.9.1
  - @creezio/product-hub@0.9.1
  - @creezio/electron-shell@0.9.1
  - @creezio/api-kernel@0.9.1
  - @creezio/mcp-facade@0.9.1
  - @creezio/shell-ui@0.9.1
  - @creezio/auth@0.9.1
  - @creezio/access-control@0.9.1
  - @creezio/assistant@0.9.1
  - @creezio/tasks@0.9.1
  - @creezio/mails@0.9.1
  - @creezio/observability@0.9.1
  - @creezio/support@0.9.1
  - @creezio/integrations@0.9.1
  - @creezio/browser-host@0.9.1
  - @creezio/database@0.9.1

## 0.9.0

### Minor Changes

- a8bf57a: Polish UI démo + heartbeat desktop natif + lien secondaire login.

  - **Palette de recherche Ctrl+K** (`shell-ui`) : géométrie scopée au composant (classe dédiée `.creezio-search-palette`, spécificité renforcée dans `theme.css`) — la palette ne dépend plus des règles de modale génériques de la marque (cassée par un `[role="dialog"]` global côté app).
  - **Démo interactive** (`interactive-demo`) : la carte garde des dimensions compactes face aux règles globales « modales bornées au viewport » ; nouveau `launcher: "sidebar"` — le lanceur « Visite guidée » devient une entrée d'action de la sidebar kit (registre `registerSidebarActionsProvider` dans `shell-ui`), jamais affichée sur les pages publiques (/login). `launcher: "floating"` reste le défaut rétrocompatible.
  - **Heartbeat desktop natif** (`app-runtime`) : `POST /api/v1/desktop/heartbeat` répond 200 `{ ok: true, desktop }` dans la surface plateforme — les apps web sans bridge Electron ne subissent plus le 404 → fallthrough plane (bruit + faux états) ; quand un bridge est en ligne, `desktop: true` reflète le registre de présence réel.
  - **Login** (`auth` + `shell-ui`) : lien d'action secondaire configurable via `ShellUiBrand.login.secondaryLink` (`{ label, href }`, ex. inscription POS) — clé absente = rien ne s'affiche, aucun libellé hardcodé.

### Patch Changes

- Updated dependencies [a8bf57a]
  - @creezio/auth@0.9.0
  - @creezio/shell-ui@0.9.0
  - @creezio/access-control@0.9.0
  - @creezio/integrations@0.9.0
  - @creezio/mails@0.9.0
  - @creezio/tasks@0.9.0
  - @creezio/brand-config@0.9.0
  - @creezio/platform-core@0.9.0
  - @creezio/product-hub@0.9.0
  - @creezio/electron-shell@0.9.0
  - @creezio/api-kernel@0.9.0
  - @creezio/mcp-facade@0.9.0
  - @creezio/assistant@0.9.0
  - @creezio/observability@0.9.0
  - @creezio/support@0.9.0
  - @creezio/browser-host@0.9.0
  - @creezio/database@0.9.0

## 0.8.1

### Patch Changes

- @creezio/brand-config@0.8.1
- @creezio/platform-core@0.8.1
- @creezio/product-hub@0.8.1
- @creezio/electron-shell@0.8.1
- @creezio/api-kernel@0.8.1
- @creezio/mcp-facade@0.8.1
- @creezio/shell-ui@0.8.1
- @creezio/auth@0.8.1
- @creezio/access-control@0.8.1
- @creezio/assistant@0.8.1
- @creezio/tasks@0.8.1
- @creezio/mails@0.8.1
- @creezio/observability@0.8.1
- @creezio/support@0.8.1
- @creezio/integrations@0.8.1
- @creezio/browser-host@0.8.1
- @creezio/database@0.8.1

## 0.8.0

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

- Updated dependencies [848ec06]
  - @creezio/access-control@0.8.0
  - @creezio/auth@0.8.0
  - @creezio/shell-ui@0.8.0
  - @creezio/api-kernel@0.8.0
  - @creezio/platform-core@0.8.0
  - @creezio/integrations@0.8.0
  - @creezio/mails@0.8.0
  - @creezio/tasks@0.8.0
  - @creezio/mcp-facade@0.8.0
  - @creezio/observability@0.8.0
  - @creezio/support@0.8.0
  - @creezio/assistant@0.8.0
  - @creezio/browser-host@0.8.0
  - @creezio/database@0.8.0
  - @creezio/electron-shell@0.8.0
  - @creezio/product-hub@0.8.0
  - @creezio/brand-config@0.8.0

## 0.7.1

### Patch Changes

- @creezio/brand-config@0.7.1
- @creezio/platform-core@0.7.1
- @creezio/product-hub@0.7.1
- @creezio/electron-shell@0.7.1
- @creezio/api-kernel@0.7.1
- @creezio/mcp-facade@0.7.1
- @creezio/shell-ui@0.7.1
- @creezio/auth@0.7.1
- @creezio/assistant@0.7.1
- @creezio/tasks@0.7.1
- @creezio/mails@0.7.1
- @creezio/observability@0.7.1
- @creezio/support@0.7.1
- @creezio/integrations@0.7.1
- @creezio/browser-host@0.7.1
- @creezio/database@0.7.1

## 0.7.0

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

- Updated dependencies [adf6d46]
  - @creezio/electron-shell@0.7.0
  - @creezio/observability@0.7.0
  - @creezio/brand-config@0.7.0
  - @creezio/platform-core@0.7.0
  - @creezio/product-hub@0.7.0
  - @creezio/api-kernel@0.7.0
  - @creezio/mcp-facade@0.7.0
  - @creezio/shell-ui@0.7.0
  - @creezio/auth@0.7.0
  - @creezio/assistant@0.7.0
  - @creezio/tasks@0.7.0
  - @creezio/mails@0.7.0
  - @creezio/support@0.7.0
  - @creezio/integrations@0.7.0
  - @creezio/browser-host@0.7.0
  - @creezio/database@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [d948fcc]
  - @creezio/auth@0.6.0
  - @creezio/shell-ui@0.6.0
  - @creezio/integrations@0.6.0
  - @creezio/mails@0.6.0
  - @creezio/tasks@0.6.0
  - @creezio/brand-config@0.6.0
  - @creezio/platform-core@0.6.0
  - @creezio/product-hub@0.6.0
  - @creezio/electron-shell@0.6.0
  - @creezio/api-kernel@0.6.0
  - @creezio/mcp-facade@0.6.0
  - @creezio/assistant@0.6.0
  - @creezio/observability@0.6.0
  - @creezio/support@0.6.0
  - @creezio/browser-host@0.6.0
  - @creezio/database@0.6.0

## 0.5.0

### Minor Changes

- 8b4c876: Rôle métier marque en session : `configureAuth({ resolveBrandRole })` (callback déclaratif, db brand fournie par la surface plateforme) expose `brand_role` dans `GET /api/v1/auth/me` — la valeur suit la cible en impersonation — et `useSession().me.brandRole` côté UI. Jamais de throw (best effort → null) ; resolver absent = `brand_role: null` (rétrocompatible). Consommateur premier : `@creezio/interactive-demo` (scénarios par rôle via la prop `role` d'InteractiveDemoRoot).

### Patch Changes

- Updated dependencies [8b4c876]
- Updated dependencies [0ff4ed2]
- Updated dependencies [e23b259]
- Updated dependencies [d674c86]
  - @creezio/auth@0.5.0
  - @creezio/shell-ui@0.5.0
  - @creezio/brand-config@0.5.0
  - @creezio/assistant@0.5.0
  - @creezio/integrations@0.5.0
  - @creezio/observability@0.5.0
  - @creezio/platform-core@0.5.0
  - @creezio/support@0.5.0
  - @creezio/mails@0.5.0
  - @creezio/tasks@0.5.0
  - @creezio/product-hub@0.5.0
  - @creezio/electron-shell@0.5.0
  - @creezio/api-kernel@0.5.0
  - @creezio/mcp-facade@0.5.0
  - @creezio/browser-host@0.5.0
  - @creezio/database@0.5.0
