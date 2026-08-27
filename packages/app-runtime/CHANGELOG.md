# @creezio/app-runtime

## 0.10.10

### Patch Changes

- 53695b5: OAuth MCP : réutiliser la session CRM (cookie / Bearer) et authentifier via le login kit, plus seulement le compte desktop local.
- Updated dependencies [4ecd205]
- Updated dependencies [53695b5]
- Updated dependencies [4ecd205]
  - @creezio/platform-core@0.10.10
  - @creezio/mcp-facade@0.10.10
  - @creezio/electron-shell@0.10.10
  - @creezio/brand-config@0.10.10
  - @creezio/product-hub@0.10.10
  - @creezio/api-kernel@0.10.10
  - @creezio/shell-ui@0.10.10
  - @creezio/auth@0.10.10
  - @creezio/access-control@0.10.10
  - @creezio/assistant@0.10.10
  - @creezio/tasks@0.10.10
  - @creezio/mails@0.10.10
  - @creezio/observability@0.10.10
  - @creezio/support@0.10.10
  - @creezio/integrations@0.10.10
  - @creezio/browser-host@0.10.10
  - @creezio/database@0.10.10

## 0.10.9

### Patch Changes

- @creezio/brand-config@0.10.9
- @creezio/platform-core@0.10.9
- @creezio/product-hub@0.10.9
- @creezio/electron-shell@0.10.9
- @creezio/api-kernel@0.10.9
- @creezio/mcp-facade@0.10.9
- @creezio/shell-ui@0.10.9
- @creezio/auth@0.10.9
- @creezio/access-control@0.10.9
- @creezio/assistant@0.10.9
- @creezio/tasks@0.10.9
- @creezio/mails@0.10.9
- @creezio/observability@0.10.9
- @creezio/support@0.10.9
- @creezio/integrations@0.10.9
- @creezio/browser-host@0.10.9
- @creezio/database@0.10.9

## 0.10.8

### Patch Changes

- a2fea46: **feat — `mcpTools` retiré ; `MODULE_MCP_TOOLS_DEPRECATED` = error.**

  `BrandModuleDef.mcpTools` n'existe plus. SoT = `operations[]` → tools MCP générés (`listOperations()`). Plus de merge legacy (`mergeGeneratedAndLegacy` / `warnLegacyModuleMcpTools`). Doctor fail-closed : un `mcpTools()` restant = error. Le hook apps `discoverModuleTools` reste (extras / JWT), sans documenter de tools manuscrits.

- Updated dependencies [a2fea46]
  - @creezio/mcp-facade@0.10.8
  - @creezio/api-kernel@0.10.8
  - @creezio/brand-config@0.10.8
  - @creezio/platform-core@0.10.8
  - @creezio/product-hub@0.10.8
  - @creezio/electron-shell@0.10.8
  - @creezio/shell-ui@0.10.8
  - @creezio/auth@0.10.8
  - @creezio/access-control@0.10.8
  - @creezio/assistant@0.10.8
  - @creezio/tasks@0.10.8
  - @creezio/mails@0.10.8
  - @creezio/observability@0.10.8
  - @creezio/support@0.10.8
  - @creezio/integrations@0.10.8
  - @creezio/browser-host@0.10.8
  - @creezio/database@0.10.8

## 0.10.7

### Patch Changes

- 55b1cd5: **feat — catalogue `listOperations()` + tools MCP générés + doctor ops non vides.**

  `api.listOperations()` alimente `/admin/api` (plus seulement la surface Hono). Les tools `module.<mountId>.<op.id>` sont générés depuis ce catalogue (handler = requête HTTP synthétique). Doctor fail-closed : `MODULE_OP_MISSING` si `apiMounts` sans `operations[]` **non vide** (pin ≥ 0.10.6) ; EntitySpec seul = OK (CRUD auto) ; `mcpTools` restant = `MODULE_MCP_TOOLS_DEPRECATED` (warn). Mounts kit/OS hors `modules/*.ts` non scannés.

- Updated dependencies [55b1cd5]
  - @creezio/api-kernel@0.10.7
  - @creezio/mcp-facade@0.10.7
  - @creezio/observability@0.10.7
  - @creezio/brand-config@0.10.7
  - @creezio/platform-core@0.10.7
  - @creezio/product-hub@0.10.7
  - @creezio/electron-shell@0.10.7
  - @creezio/shell-ui@0.10.7
  - @creezio/auth@0.10.7
  - @creezio/access-control@0.10.7
  - @creezio/assistant@0.10.7
  - @creezio/tasks@0.10.7
  - @creezio/mails@0.10.7
  - @creezio/support@0.10.7
  - @creezio/integrations@0.10.7
  - @creezio/browser-host@0.10.7
  - @creezio/database@0.10.7

## 0.10.6

### Patch Changes

- 1c7ec66: **feat — SoT unique : une opération de module = HTTP + /admin/api + tool MCP.**

  `ModuleOperation` sur `ApiMount` / EntitySpec (CRUD auto). Le kit collecte puis génère les tools `module.<mountId>.<op.id>` (handler = requête HTTP synthétique). Catalogue `/admin/api` = ops kernel, plus seulement la surface Hono admin. `mcpTools()` déprécié (doctor error si recouvrement). Doctor fail-closed `MODULE_OP_MISSING` / `MODULE_OP_UNCATALOGUED` depuis 0.10.6. Enable MCP = policies sur tools générés (`mcpPublishDefault`, `roles`).

- Updated dependencies [1c7ec66]
  - @creezio/api-kernel@0.10.6
  - @creezio/mcp-facade@0.10.6
  - @creezio/observability@0.10.6
  - @creezio/brand-config@0.10.6
  - @creezio/platform-core@0.10.6
  - @creezio/product-hub@0.10.6
  - @creezio/electron-shell@0.10.6
  - @creezio/shell-ui@0.10.6
  - @creezio/auth@0.10.6
  - @creezio/access-control@0.10.6
  - @creezio/assistant@0.10.6
  - @creezio/tasks@0.10.6
  - @creezio/mails@0.10.6
  - @creezio/support@0.10.6
  - @creezio/integrations@0.10.6
  - @creezio/browser-host@0.10.6
  - @creezio/database@0.10.6

## 0.10.5

### Patch Changes

- Updated dependencies [6bce6a8]
  - @creezio/observability@0.10.5
  - @creezio/brand-config@0.10.5
  - @creezio/platform-core@0.10.5
  - @creezio/product-hub@0.10.5
  - @creezio/electron-shell@0.10.5
  - @creezio/api-kernel@0.10.5
  - @creezio/mcp-facade@0.10.5
  - @creezio/shell-ui@0.10.5
  - @creezio/auth@0.10.5
  - @creezio/access-control@0.10.5
  - @creezio/assistant@0.10.5
  - @creezio/tasks@0.10.5
  - @creezio/mails@0.10.5
  - @creezio/support@0.10.5
  - @creezio/integrations@0.10.5
  - @creezio/browser-host@0.10.5
  - @creezio/database@0.10.5

## 0.10.4

### Patch Changes

- @creezio/brand-config@0.10.4
- @creezio/platform-core@0.10.4
- @creezio/product-hub@0.10.4
- @creezio/electron-shell@0.10.4
- @creezio/api-kernel@0.10.4
- @creezio/mcp-facade@0.10.4
- @creezio/shell-ui@0.10.4
- @creezio/auth@0.10.4
- @creezio/access-control@0.10.4
- @creezio/assistant@0.10.4
- @creezio/tasks@0.10.4
- @creezio/mails@0.10.4
- @creezio/observability@0.10.4
- @creezio/support@0.10.4
- @creezio/integrations@0.10.4
- @creezio/browser-host@0.10.4
- @creezio/database@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies [5f8a383]
  - @creezio/observability@0.10.3
  - @creezio/brand-config@0.10.3
  - @creezio/platform-core@0.10.3
  - @creezio/product-hub@0.10.3
  - @creezio/electron-shell@0.10.3
  - @creezio/api-kernel@0.10.3
  - @creezio/mcp-facade@0.10.3
  - @creezio/shell-ui@0.10.3
  - @creezio/auth@0.10.3
  - @creezio/access-control@0.10.3
  - @creezio/assistant@0.10.3
  - @creezio/tasks@0.10.3
  - @creezio/mails@0.10.3
  - @creezio/support@0.10.3
  - @creezio/integrations@0.10.3
  - @creezio/browser-host@0.10.3
  - @creezio/database@0.10.3

## 0.10.2

### Patch Changes

- 0748020: **fix(tunnel) — superviseur cloudflared in-process (respawn borné).**

  Si le process QUIC meurt, le kernel logguait `cloudflared exit` et ne le relançait pas → hostname public **525** alors que localhost restait 200 (recette / demo / admin, 15-16/08). `startCloudflared` respawn maintenant avec backoff (1 s → 30 s, 8 essais consécutifs, compteur remis à zéro après 60 s d'uptime sain). `stopCloudflared` / `forgetTunnel` annulent le timer. Le respawn **réutilise** le token et l'id persistés — aucun POST `cfd_tunnel` (pas de nouvel id). Fail-closed #84/#86/#87 inchangé. Prend effet au prochain bump/rebuild ; pas de redéploiement live dans ce tour.

- Updated dependencies [0748020]
  - @creezio/electron-shell@0.10.2
  - @creezio/brand-config@0.10.2
  - @creezio/platform-core@0.10.2
  - @creezio/product-hub@0.10.2
  - @creezio/api-kernel@0.10.2
  - @creezio/mcp-facade@0.10.2
  - @creezio/shell-ui@0.10.2
  - @creezio/auth@0.10.2
  - @creezio/access-control@0.10.2
  - @creezio/assistant@0.10.2
  - @creezio/tasks@0.10.2
  - @creezio/mails@0.10.2
  - @creezio/observability@0.10.2
  - @creezio/support@0.10.2
  - @creezio/integrations@0.10.2
  - @creezio/browser-host@0.10.2
  - @creezio/database@0.10.2

## 0.10.1

### Patch Changes

- @creezio/brand-config@0.10.1
- @creezio/platform-core@0.10.1
- @creezio/product-hub@0.10.1
- @creezio/electron-shell@0.10.1
- @creezio/api-kernel@0.10.1
- @creezio/mcp-facade@0.10.1
- @creezio/shell-ui@0.10.1
- @creezio/auth@0.10.1
- @creezio/access-control@0.10.1
- @creezio/assistant@0.10.1
- @creezio/tasks@0.10.1
- @creezio/mails@0.10.1
- @creezio/observability@0.10.1
- @creezio/support@0.10.1
- @creezio/integrations@0.10.1
- @creezio/browser-host@0.10.1
- @creezio/database@0.10.1

## 0.10.0

### Minor Changes

- 96464bc: **BREAKING — Tunnel Cloudflare auto-provisionné par l'instance (fin du provisioner VPS et du sidecar cloudflared).**

  Le conteneur Docker crée, configure et sert son tunnel Cloudflare lui-même au boot via l'API CF (client `tunnel-cf-client` de `@creezio/platform-core`, Node pur, zéro dépendance) : GET du tunnel persisté dans `/data` → 404/token absent → recréation idempotente (le CNAME suit le nouvel id), PUT ingress (`http://127.0.0.1:18791` + services + hostnames supplémentaires multi-domaines sur le même tunnel), upsert DNS idempotent, cloudflared spawné **in-process** (binaire pinné `2026.7.3` dans l'image), sonde publique en arrière-plan non fatale.

  - **Contrat d'env** : `CREEZIO_CF_API_TOKEN` / `CREEZIO_CF_ACCOUNT_ID` / `CREEZIO_CF_ZONE_ID` (requis), `CREEZIO_CF_ZONE_NAME` / `CREEZIO_CF_UNIVERSAL_SSL` / `CREEZIO_TUNNEL_SLUG` / `CREEZIO_DOMAIN` (optionnels) — livrés au conteneur via `cf.env` (chmod 600) généré par `server-docker create`. `CREEZIO_TUNNEL_PROVISION_URL` / `_TOKEN` et `resolveTunnelProvision` sont **supprimés** (pas de fallback).
  - **Compose généré** : plus de service `cloudflared` sidecar ; `tunnel.env` → `cf.env` (600) ; secrets applicatifs isolés dans `secrets.env` (600) — aucun secret dans `environment:`.
  - **Nommage des hostnames de services** : `CREEZIO_CF_UNIVERSAL_SSL` truthy → nested (`n8n.{slug}.{zone}`) ; défaut **flat** (`n8n-{slug}.{zone}`). Remplace `CREEZIO_TUNNEL_FLAT_HOSTS`.
  - **CLI** : `create` est **fail-closed** (héritage #84/#86) : sans `CREEZIO_CF_*` (sauf `CREEZIO_TUNNEL_LOCAL=1`) **ou** sans owner VPS, échec actionnable — plus de loopback silencieux. Le contrat CF part dans `cf.env` (verify du token, aucun `/reserve`, aucun secret dans le registre). `rm` déprovisionne via l'API CF directe (DNS + tunnel) ; `enroll` gère l'ingress `agent[-.]{slug}` via le client CF ; `migrate-stack` bascule sidecar/legacy → in-container. Les instances live déjà up ne sont pas migrées par ce merge.
  - **Supprimé** : `docker/tunnel-provisioner/` entier (service, lib, docs).

  Migration des instances existantes : `creezio server-docker migrate-stack <nom> --brand-root …` avec le contrat `CREEZIO_CF_*` dans l'env (voir docs/RUNBOOK-AGENTS.md §7.3).

### Patch Changes

- Updated dependencies [96464bc]
  - @creezio/platform-core@0.10.0
  - @creezio/electron-shell@0.10.0
  - @creezio/observability@0.10.0
  - @creezio/api-kernel@0.10.0
  - @creezio/assistant@0.10.0
  - @creezio/auth@0.10.0
  - @creezio/browser-host@0.10.0
  - @creezio/database@0.10.0
  - @creezio/integrations@0.10.0
  - @creezio/mails@0.10.0
  - @creezio/mcp-facade@0.10.0
  - @creezio/product-hub@0.10.0
  - @creezio/tasks@0.10.0
  - @creezio/brand-config@0.10.0
  - @creezio/shell-ui@0.10.0
  - @creezio/access-control@0.10.0
  - @creezio/support@0.10.0

## 0.9.4

### Patch Changes

- 0c62242: `/api/v1/admin/*` (MCP, database, analytics, endpoints, request-logs) exige une session à la bordure HTTP — 401 sans cookie/Bearer. Health, login, setup et OAuth MCP restent publics. Ferme la surface admin ouverte en prod (foove2#78).
  - @creezio/brand-config@0.9.4
  - @creezio/platform-core@0.9.4
  - @creezio/product-hub@0.9.4
  - @creezio/electron-shell@0.9.4
  - @creezio/api-kernel@0.9.4
  - @creezio/mcp-facade@0.9.4
  - @creezio/shell-ui@0.9.4
  - @creezio/auth@0.9.4
  - @creezio/access-control@0.9.4
  - @creezio/assistant@0.9.4
  - @creezio/tasks@0.9.4
  - @creezio/mails@0.9.4
  - @creezio/observability@0.9.4
  - @creezio/support@0.9.4
  - @creezio/integrations@0.9.4
  - @creezio/browser-host@0.9.4
  - @creezio/database@0.9.4

## 0.9.3

### Patch Changes

- @creezio/brand-config@0.9.3
- @creezio/platform-core@0.9.3
- @creezio/product-hub@0.9.3
- @creezio/electron-shell@0.9.3
- @creezio/api-kernel@0.9.3
- @creezio/mcp-facade@0.9.3
- @creezio/shell-ui@0.9.3
- @creezio/auth@0.9.3
- @creezio/access-control@0.9.3
- @creezio/assistant@0.9.3
- @creezio/tasks@0.9.3
- @creezio/mails@0.9.3
- @creezio/observability@0.9.3
- @creezio/support@0.9.3
- @creezio/integrations@0.9.3
- @creezio/browser-host@0.9.3
- @creezio/database@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies [10b5198]
  - @creezio/observability@0.9.2
  - @creezio/brand-config@0.9.2
  - @creezio/platform-core@0.9.2
  - @creezio/product-hub@0.9.2
  - @creezio/electron-shell@0.9.2
  - @creezio/api-kernel@0.9.2
  - @creezio/mcp-facade@0.9.2
  - @creezio/shell-ui@0.9.2
  - @creezio/auth@0.9.2
  - @creezio/access-control@0.9.2
  - @creezio/assistant@0.9.2
  - @creezio/tasks@0.9.2
  - @creezio/mails@0.9.2
  - @creezio/support@0.9.2
  - @creezio/integrations@0.9.2
  - @creezio/browser-host@0.9.2
  - @creezio/database@0.9.2

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
