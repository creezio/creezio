# Architecture Creezio — état courant

Creezio est un OS d'application métier : le kit (`packages/@creezio/*`)
fournit le socle complet, les marques n'apportent que leur métier (migrations,
`registerModuleApi`, feed catalogue, nav `brand.*`, BrandSpec). Une marque
consomme le kit par copie vendored (`crm/vendor/creezio`), jamais par
dépendance npm publique.

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
start/stop, logs. La config vit dans `{brandRoot}/docker-data/server-admin.json`
(`brandRoots[]`) ; `admin add-brand <racine>` ajoute une marque et recrée le
container. Auth Basic (`CREEZIO_ADMIN_PASS`).

## Surfaces UI de l'OS (`os-ui`)

`@creezio/os-ui` contient les pages Next « OS » (mails, tâches, setup, login,
admin, MCP…) que la factory **matérialise** dans l'app Next de chaque marque
sous forme de wrappers minces (hors périmètre git marque ou en wrappers
committés selon la marque). La marque ne réécrit jamais ces pages ; elle
n'ajoute que ses pages métier.

## Propagation kit → marques

1. Modifier le kit, `npm run build:packages`, gates vertes (`test:kit`).
2. Merge sur `main`.
3. Côté marque : `CREEZIO_KIT_ROOT=<kit> bash crm/scripts/electron/sync-creezio-vendor.sh`
   (copie `packages/*` construits vers `crm/vendor/creezio`).
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
