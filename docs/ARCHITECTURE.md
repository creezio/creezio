# Architecture Creezio — état courant

Creezio est un OS d'application métier : le kit (`packages/@creezio/*`)
fournit le socle complet, les marques n'apportent que leur métier (migrations,
`registerModuleApi`, feed catalogue, nav `brand.*`, BrandSpec). Une marque
consomme le kit en **packages npm versionnés** (`@creezio/*` publiés sur
GitHub Packages, registry privé de l'org — voir
[NPM-DISTRIBUTION.md](./NPM-DISTRIBUTION.md)).

## Layout marque — 2 repos (LA norme)

Chaque marque générée par la factory = **2 repos GitHub privés** :

### 1. Monorepo marque (`<brand>`) — client + server

```text
<marque>/
├── brand-spec/     # SoT marque
├── server/         # livrable principal : métier src/electron, ui/ Next,
│                   # harness, scripts, cible du Dockerfile serveur
├── client/         # desktop thin remote-only : main client-only (sans
│                   # brand-migrations/brand-module-api), pack, feeds/GUID
├── docker-data/    # runtime gitignoré (registre servers.json, volumes)
└── package.json    # orchestrateur racine (scripts délégués aux livrables)
```

**Pas de `admin/` dans le monorepo marque.**

### 2. Repo admin dédié (`<brand>-admin`) — privé, jamais public

L'app admin de la marque (l'OS qui gère l'entreprise de la marque : flotte,
support, prospection, billing… — voir
[adr/ADR-admin-app-os.md](./adr/ADR-admin-app-os.md)) + la config flotte
versionnée SANS secrets (`server-admin.json`, `fleet-hosts.json`,
`docker-compose.admin.yml`) ; runtime avec secrets sous `docker-data/`
(gitignoré). Exemple prod : `creezio/tempoflow3-admin`.

Le layout plat historique et le `admin/` embarqué restent détectés par le
tooling (server-docker, resolvers de sonde) mais ne sont plus générés.

## Les 4 modes de déploiement

Le même code marque se déploie en quatre modes ; le choix se fait au boot,
pas à la compilation.

### 1. Desktop Electron complet

`startBrandDesktop(config)` (`@creezio/app-runtime`) orchestre tout :
manifest, logger, crash-reporter (early writer inclus), data layout packagé
(`{installDir}/data/`), SQLite multi-fichier, embeds locaux (Hermes, n8n,
Meilisearch), updater, tray, splash, plugins host, fenêtre CRM. La marque
fournit un `main.ts` mince qui appelle la façade.

### 2. Serveur Docker headless

`creezio server-docker create --brand-root <racine> --name server-N`
(`@creezio/factory`) construit une image depuis `docker/server/Dockerfile`
(prérequis marque : `npm run build:runtime` + build UI Next standalone) et
lance un container par instance. Le kernel harness
(`startBrandKernelHarness`) boote l'OS sans Electron : API `/api/v1`, CRM
web, embeds. Données par instance dans `docker-data/servers/server-N`.

**Modèle standard (M2) — 1 instance = 1 stack compose autonome.** Chaque
instance est un projet compose (`docker-data/stacks/<nom>/compose.yml`,
généré) contenant TOUT : l'app (port **interne fixe 18791** dans le réseau
du stack) + le tunnel **cloudflared en sidecar** (token dans `tunnel.env`
chmod 600, ingress `http://app:18791` par nom de service). Le port hôte est
indifférent : publié sur `127.0.0.1` en attribution auto pour le
debug/healthcheck, jamais exposé publiquement — l'accès utilisateur passe
obligatoirement par Cloudflare. Le kernel ne spawn plus cloudflared
(`CREEZIO_TUNNEL_SIDECAR=1` : config seedée par env, ingress repointé via le
provisioner avec `serviceHost=app`). Les instances legacy `docker run` se
basculent par `creezio server-docker migrate-stack <nom>` (backup /data
obligatoire, rollback automatique si KO). Détails opérationnels :
`docker/server/README.md`.

### 3. Client desktop « thin » (remote-only)

Le même binaire desktop, configuré avec `defaultServerUrl` (profil de
connexion), n'embarque pas les services locaux : il s'attache à un serveur
(mode 2) et sert de coquille native (fenêtre, onglets navigateur, bridge
desktop). Voir `docker/server/REMOTE-ACCESS.md`.

### 4. Sidecar navigateur IA

`@creezio/browser-host` lance un Chromium piloté par CDP pour les sessions
web des agents IA : profils persistants par utilisateur IA (`0700`),
screencast, driver `external_*` **partagé** avec les onglets Electron
(`shared-driver.ts`). En desktop, les onglets externes vivent dans Electron ;
en serveur, le sidecar Chromium rend le même service (wiring
`wire-brand-browser-sidecar.ts`, activation `--browser`). Proxy sortant
optionnel via `CREEZIO_BROWSER_PROXY` (limite connue : IP datacenter souvent
détectée — voir le README du package).

## Boot : progress et statut

Le splash desktop et le boot serveur partagent le même modèle
(`SplashViewModel`) :

- Desktop : splash Electron classique.
- Serveur : `boot-progress.ts` (`@creezio/app-runtime`) expose la progression
  en JSON via `GET /api/v1/os/boot-status` (early-listen : l'endpoint répond
  avant la fin du boot), en JSONL sur stdout (`docker logs`) et dans le
  journal ops. Les étapes sont une liste **ouverte** (un sidecar peut
  enregistrer la sienne).

Santé : `GET /healthz` + `boot-status` sont les deux sondes utilisées par les
scripts et par l'admin.

## Admin multi-serveurs

`creezio server-docker admin up` lance une console web
(`docker/server-admin`, servie par
`packages/observability/fleet-collector/server-admin.mjs`, Node pur) qui
pilote plusieurs serveurs Docker de plusieurs marques : état, boot-status,
start/stop, logs. La config versionnable (SANS secrets : `port`, `user`,
`brandRoots[]`) vit à la racine du **repo admin dédié** (`--admin-root`,
ex. `/opt/docker/tempoflow-admin/server-admin.json`) ; la config runtime
(avec `pass`) reste dans `{adminRoot}/docker-data/server-admin.json`
(gitignoré). `admin add-brand <racine>` ajoute une marque et recrée le
container. Auth Basic (`CREEZIO_ADMIN_PASS`). Le chemin legacy
`{brandRoot}/admin/server-admin.json` reste lu (dual-read) mais n'est plus
généré. Ce backend reste la **SoT des gestes Docker** ; l'app admin de
marque (repo `<brand>-admin`) le consomme via son module « Flotte »
(`@creezio/admin`, proxy `/api/v1/modules/fleet/*`) — voir
[adr/ADR-admin-app-os.md](./adr/ADR-admin-app-os.md).

## Flotte : registre central + updates en pull

Trois briques, toutes câblées en prod TF3 :

1. **Registre central** (`fleet-registry`, `@creezio/admin`) : la table
   `admin_fleet_servers` (brand.db de l'app admin) est une vue matérialisée
   de la flotte — alimentée par l'**auto-inscription** des serveurs au boot
   (`POST register` + heartbeat ~90 s, `@creezio/app-runtime
   fleet-heartbeat`), un poller de fond et le sync manuel. Les JSON
   (`servers.json`, `fleet-hosts.json`) restent la SoT des gestes.
2. **Registre d'images pull-only** : ingress `registry.{zone}` → proxy
   `/v2/*` du backend admin (GET/HEAD seulement, auth `hostId:agentToken`) ;
   le push reste loopback (`creezio server-docker publish`).
3. **Releases en pull** (`fleet-releases`) : `publish --release` déclare la
   release ; les agents hôtes (`docker/host-agent`) pollent, prennent un
   slot, appliquent via leur `updateServer` local (backup/rollback) et
   rapportent. Rollout draft → rolling (canary/vagues) → done,
   kill-switch `paused`/`aborted`, hold/pin/canal par serveur, auto-pause
   sur échecs. Décision « images Docker, jamais git-pull client » :
   [adr/ADR-fleet-updates-docker-images.md](./adr/ADR-fleet-updates-docker-images.md).

Gestes opérateur : skill
[creezio-fleet-ops](../.cursor/skills/creezio-fleet-ops/SKILL.md)
(index humain : [RUNBOOK-FLOTTE.md](./RUNBOOK-FLOTTE.md)).

## Surfaces UI de l'OS (`os-ui`)

`@creezio/os-ui` contient les pages Next « OS » (mails, tâches, setup, login,
admin, MCP…) que la factory **matérialise** dans l'app Next de chaque marque
sous forme de wrappers minces (hors périmètre git marque ou en wrappers
committés selon la marque). La marque ne réécrit jamais ces pages ; elle
n'ajoute que ses pages métier.

## Plugins & assistant (Hermes)

- **Plugins** : sidecars Node isolés (manifest + permissions + DB propre),
  proxifiés sous `/api/v1/plugins/<id>/*` et exposés en MCP
  `plugin.<id>.*` avec ACL Product Hub fail-closed. Seed des plugins
  embarqués marque au boot ; kill-switch `CREEZIO_PLUGINS=0`. Guide :
  [agents/CREATE-PLUGIN.md](./agents/CREATE-PLUGIN.md).
- **Hermes cerveau unique** : l'agent Hermes embarqué parle au CRM via le
  endpoint `/mcp` du plane OS (pont JSON-RPC 2.0 stateless) avec une clé
  service mappée owner ; il délègue les « mains » au task runner
  (`create_ai_task`) et aux verbes workspace (`workspace.*`,
  `platform.ask_human`) — allowlist `*_WEB_ALLOWED_HOSTS` appliquée en UX
  (runner) et au niveau exécution (hosts). SoT :
  `@creezio/app-runtime` (`hermes-mcp-host-tools`), `@creezio/tasks`,
  `@creezio/platform-core` (`web-allowlist`).

## Manifeste des packages publiés (`kit-packages.json`)

`packages/platform-core/kit-packages.json` liste les packages `@creezio/*`
publiés (généré par `scripts/generate-kit-packages.mjs` à chaque build,
fraîcheur garantie par la gate `test-phase-kit-packages-manifest`). Les apps
le lisent via `node_modules/@creezio/platform-core/kit-packages.json` (gate
deps-integrity) — plus de liste en dur à maintenir dans chaque app.

## Contrôle d'accès (`@creezio/access-control`)

Visibilité des modules et de la sidebar **par rôle**, administrable en UI
(sans redéploiement) :

- **Rôles déclaratifs** — la marque déclare `roles` (id, label,
  `defaultPermissions`) et le catalogue `permissionGroups` via
  `configureAccessControl` au boot. C'est la seule part « config ».
- **Overrides en DB** (core.db) — `access_role_overrides`
  (`role, permission, effect allow|deny, updated_by, updated_at`) :
  un `deny` retire une permission du défaut, un `allow` en ajoute une.
  `access_user_roles` = assignation rôle ↔ compte (sauf si la marque a sa
  source de vérité métier via les adaptateurs `getUserRole`/`setUserRole`).
  `access_audit_log` = qui a changé quoi, quand.
- **Résolution dynamique** — `resolvePermissions(userId, brandRole)` =
  défauts du rôle + overrides, cache mémoire 30 s invalidé à chaque
  écriture. Consommée par `/api/v1/auth/me`, par les JWT mintés (login,
  impersonation) et par la garde API kernel.
- **Garde API** — un mount peut déclarer `permission` (`ApiMount`) ; le
  kernel vérifie via `authorizeModuleAccess` (401 sans session, 403 sans
  la permission) — la sidebar n'est plus la seule frontière.
- **UI native** — écran « Rôles & accès » (`/admin/access`, entrée de nav
  admin filtrée par la permission `platform.access.manage`) : matrice
  rôles × permissions groupées par module, gestion des rôles des comptes,
  journal d'audit. Le rôle owner est figé (tous les accès, toujours).

Sans `configureAccessControl` au boot marque, le module est inerte :
comportement historique (permissions figées) inchangé.

## Propagation kit → marques

1. Modifier le kit, `npm run build:packages`, gates vertes (`test:kit`).
2. Merge sur `main`.
3. Côté marque : `npm update "@creezio/*"` après publication npm
   (packages `@creezio/*` sur GitHub Packages — `docs/NPM-DISTRIBUTION.md`).
4. Adapter le wiring marque si l'API publique change ; gates marque.

`@creezio/propagation` outille l'impact (`npm run kit:impact`), les bumps
semver (`npm run kit:version`) et le registre des canaux marque.

## Garde-fous

- **Pas de domaine marque dans le kit** —
  [ADR-no-brand-domain-in-native-packages](./adr/ADR-no-brand-domain-in-native-packages.md).
- **Isolation DB** `core` / `brand` / `plugin/<id>` — accès cross-layer refusés
  (api-kernel, mcp-facade).
- **Gates** : `npm run test:kit` doit rester 100 % vert sans repos externes ;
  la matrice des suites est dans [../scripts/README.md](../scripts/README.md).

Historique de construction (phases, plans, cutovers) : [archive/](./archive/).
