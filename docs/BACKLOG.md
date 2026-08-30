# BACKLOG — dettes restantes assumées

Liste unique et honnête des dettes connues du kit. Une dette listée ici est
**assumée** : pas de contournement caché dans le code, pas d'assert de gate
affaibli pour la masquer. (Backlogs d'époque : `docs/archive/BACKLOG-*.md`.)

## Produit / distribution

- **Validation packagée Windows réelle** : la chaîne updater / preload
  onglets / NSIS est couverte par gates statiques (`after-pack`, `test:kit`),
  mais aucun E2E sur machine Windows n'est exécuté — machine requise.
- **Widevine/DRM** : les onglets externes (Electron) et le navigateur IA
  (Chromium serveur) ne lisent pas les contenus DRM.
- **Rotation du token feed `dl-e660352…`** : décision utilisateur — on ne
  touche ni la rotation ni la sortie du code pour l'instant.
- **Licence** : repos privés, pas de fichier LICENSE (décision utilisateur).

## Desktop

- **Compat desktop héritée gelée (P2.a)** :
  `electron-shell/src/desktop/legacy-brand-compat.ts` porte les défauts
  legacy des clients desktop non migrés sur `startBrandDesktop` (env
  `TEMPOFLOW_*`, `tf2fid`, `preload-app.js`, alias `ensureTempoflowNode`).
  Périmètre gelé fail-closed (gate `test-phase-legacy-desktop-frozen`).
  **Retrait au bump `ARCHITECTURE_VERSION` H10** : codemod de migration des
  clients legacy vers des deps explicites, puis suppression du module + de
  sa gate (ADR `docs/adr/ADR-p2a-desktop-legacy-freeze.md`). Note P2.c : le
  bump H9 (contrat de module importé, `ADR-p2c-module-contract.md`) n'a PAS
  embarqué ce retrait — non trivial (périmètre hashé + codemod clients
  legacy dédié), reporté volontairement.

## Navigateur IA (`browser-host`)

- **Proxy résidentiel** : `CREEZIO_BROWSER_PROXY` est plombé jusqu'à
  `--proxy-server=`, mais une IP datacenter (VPS/cloud) reste détectée par
  beaucoup de sites ; aucune offre proxy résidentiel n'est incluse.
- **Chiffrement au repos des profils** : les profils Chromium (cookies,
  sessions) sont en clair sur disque (créés `0700`). Le chiffrement volume
  (LUKS/fscrypt) est à la charge de l'hébergeur — non fourni par le kit.
  Voir « Modèle de menace » dans `packages/browser-host/README.md`.

## Tests / environnement

- **`test:brands` sur ce VPS** : l'oracle `tempoflow2` local est en état
  pré-cutover (pas de `crm/vendor/creezio`) et `certivan-app`/`fidu` sont
  absents — les gates marques historiques skippent (raison affichée). Les
  exécuter sur un poste avec les repos marque d'époque synchronisés.
- **`test:env`** : `test-os-cold-warm` (réseau embeds + ~4 Go /tmp),
  `test-phase-factory-prd*` (npm install d'une app générée, binaire Electron
  téléchargeable) et `test-phase-factory-docker-parity` (app neuve factory →
  image Docker, preuve d'héritage parité TF2) sont opt-in
  (`CREEZIO_COLD_WARM=1` / `CREEZIO_FACTORY_PRD=1` / `CREEZIO_FACTORY_DOCKER=1`).
  Les gates factory-prd échouent aujourd'hui hors ligne car l'app générée n'a
  pas de `node_modules` (types `electron` introuvables au `tsc`) — piste :
  lien vers le `node_modules` du kit ou install dédiée dans la gate.

## Flotte multi-VPS

- **GHCR non branché** : le flux versionné (`server-docker publish` → pull →
  update) est prouvé sur un registry local `registry:2` (`127.0.0.1:5000`,
  image ~3,7 Go impraticable en push GHCR depuis ce VPS). Bascule GHCR =
  `CREEZIO_REGISTRY=ghcr.io/creezio` + `CREEZIO_REGISTRY_AUTH` (token PAT) —
  le code est agnostique, seul l'E2E GHCR manque.
- **Ingress agent porté par le tunnel d'un serveur** : `agent.{slug}` passe
  par le cloudflared du container serveur `{slug}` — pendant l'update de CE
  serveur, l'agent est injoignable de l'extérieur (le poll `update-status`
  de l'admin tolère les trous et se resynchronise). Piste propre : tunnel
  dédié agent par VPS (slug hôte réservé) au lieu de réutiliser celui d'un
  serveur applicatif.
- **Suivi update en mémoire** : la Map `update-status` de l'agent (et de
  l'admin local) ne survit pas à un restart de l'agent pendant un update —
  l'update lui-même va au bout (process docker), seul le suivi est perdu.
- **Registry local sans GC** : la suppression de tags (`0.2.2-broken`…)
  demande l'API delete + `registry garbage-collect` — documenté, pas
  automatisé.
- **Automatiser les règles UFW dans les procédures compose/enrôlement
  (`creezio server-docker`)** : la règle « tout port hôte consommé depuis
  les conteneurs (18800 backend flotte, 18810 host-agent) autorisé depuis
  `172.16.0.0/12`, pas seulement docker0 » est aujourd'hui doc-only (skill
  fleet-ops §6/§9, `RUNBOOK-FLOTTE.md`) — incident du 10–30/08 (migration
  stacks compose : 18810 resté scoped `172.17.0.0/16`, host-agent droppé
  20 jours). Candidat gate/automatisation.
- ~~**admin.tempoflow.fr via NPM + cert Origin**~~ **retiré** :
  `configure-admin-npm.sh` exit 1. Public admin+lp = tunnel in-process.
- ~~**Mounts modules sans session HTTP (plateforme-wide)**~~ **fait** (garde
  `assertModuleMountSession` dans `listenBrandOsHttp`, allowlist
  webhook/register/heartbeat/releases/landing public ; gate
  `test-phase-module-mount-session.mjs`). Adoption / preuve côté marques :
  tâche TF3 DASH-5 (`tempoflow3/brand-spec/modules/dashboard/TODO.md`) —
  `npm update "@creezio/*"` après publication npm du kit.

## Admin app OS (ADR-admin-app-os) — suites

- ~~`@creezio/support` côté serveur marque~~ **fait** : package
  `@creezio/support` (mount natif `platform-support` via app-runtime, page OS
  `/support`, routes agent/backend `…/servers/:b/:n/support[/*]`, sync pull +
  réponse admin dans `@creezio/admin`).
- ~~Billing Stripe (webhook)~~ **fait** : endpoint signé
  `/api/v1/modules/billing-webhook/stripe` → projections `admin_billing_*`
  (journal `admin_billing_events`).
- ~~UI billing dédiée~~ **fait** : `BillingAdminClient` (`@creezio/admin/ui`),
  page `/billing` — stats MRR/actifs/impayées, clients + abonnement (montant,
  statut, prochaine échéance `periode_fin`), factures, événements Stripe,
  rapprochement client ↔ serveur. API `GET /api/v1/modules/billing/overview`.
- ~~Réconciliation active `STRIPE_API_KEY`~~ **fait** :
  `POST /api/v1/modules/billing/reconcile` (bouton « Resynchroniser Stripe »)
  relit l'API Stripe (customers/subscriptions/invoices, pagination) et
  resynchronise les projections — gate `test-phase-admin-billing.mjs`
  (webhook signé, overview, reconcile contre mock : facture manquée
  rattrapée). Clé par marque en `.env` gitignoré (skill §5c).
- ~~Factory : repo admin en app OS complète~~ **fait** : `scaffoldAdminApp`
  (modules natifs flotte/support/prospects kanban/roadmap/billing) — gate
  `test-phase-factory-two-repos.mjs`.
- ~~Prospection kanban drag & drop~~ **fait** : `ProspectsKanbanClient`
  (`@creezio/admin/ui`, DnD HTML5 natif, PATCH colonne/position).
- ~~Fleet natif TS~~ **fait autrement (P2.b, 0.15.0)** : backend flotte porté
  en TS strict dans le NOUVEAU package `@creezio/fleet` (pas dans
  `@creezio/admin` : l'agent hôte doit rester Node pur sans tirer admin/UI —
  décision sur graphe de deps, voir `packages/fleet/AGENTS.md`). Les `.mjs`
  de fleet-collector = wrappers compat `[deprecated]` une version. Reste
  ouvert : supprimer le hop HTTP interne admin app → server-admin en faisant
  dépendre `@creezio/admin` de `@creezio/fleet` (imports directs) — le
  backend HTTP reste pour les host-agents.
- **Retrait wrappers fleet-collector (0.16)** : supprimer les 7 wrappers
  `.mjs` de `packages/observability/fleet-collector/` + le bin
  `creezio-server-admin`, repointer le CLI factory
  (`importInstanceStack`, imports server-lib) directement sur
  `packages/fleet/dist`, et passer `FLEET_PROTOCOL_ACCEPT_MISSING=false`
  au prochain bump de protocole (politique F4.4d).
- **Rôles/permissions mode admin** : rôles dédiés (community manager,
  comptable…) sur le système de comptes kit — aujourd'hui multi-comptes
  standard sans permissions par module.

## Contrat de module (P2.c — suites)

- **Sources assistant + contenu onboarding dans `BrandModuleDef`** (2ᵉ volet
  F3.4) : les déclarations de sources assistant et le contenu onboarding
  des modules restent câblés hors descripteur (fichiers dédiés marque) —
  intégration au contrat kit à faire dans une phase dédiée (trop gros pour
  P2.c, qui a livré le contrat importé + `permission`/`accessJustification`
  par mount). ADR `docs/adr/ADR-p2c-module-contract.md`.
- **Cohérence `meiliIndexes.table` ↔ migrations** : vérifier au doctor que
  la table d'un index Meili déclaré existe dans une migration — non trivial
  textuellement (tables créées par un autre module d'import ou par les
  migrations historiques `fromprd_brand_*` → faux positifs) ; nécessite une
  résolution cross-module du plan de données.
- **Qualifier les `accessJustification: "à qualifier"` TF3** : le codemod
  H9 pose la dette explicite sur les mounts manuscrits sans `permission` —
  chaque module TF3 doit qualifier sa permission réelle (`nav.*`) ou
  justifier la route publique (doctor warn `MODULE_PERMISSION_UNQUALIFIED`
  en attendant).

## Documentation

- ~~`@creezio/brand-spec` sans `README.md` / `docs/FILES.md`~~ **fait** :
  trio complet, couvert par la gate `test-phase-docs-freshness`
  (standard : `docs/DOC-STANDARD.md`).
- **Rôles `(à documenter)` dans les FILES.md** : la gate de fraîcheur garantit
  l'exhaustivité des inventaires, pas la qualité des rôles — les entrées
  marquées `(à documenter)` (surtout `scripts/`, `factory`, `desktop-tooling`)
  se remplissent au fil des chantiers (régénération = colonne préservée).
- **Liens internes des docs archivées** : les documents de
  `docs/archive/` gardent leurs liens d'époque (certains pointent vers des
  emplacements déplacés) — assumé, l'archive est un journal.

## Images serveur

- **`electron` (wrapper npm) + `electron-shell` dans l'arbre des images
  serveur** : les images Docker headless embarquent encore le wrapper npm
  `electron` et le package `electron-shell` (dépendances transitives de
  l'arbre `npm ci -w server`), alors que le runtime serveur est Node pur.
  Coupe prévue : déplacer `resources/vendor` (binaires Meili/cloudflared,
  vendor hermes-agent) d'`electron-shell` vers `host-runtime`, puis exclure
  electron/electron-shell du contexte serveur (TODO tracé dans
  `docker/server/Dockerfile` + gate `test-phase-server-docker`).

## Divers

- **`appliedLimit` dans `RunSqlResult`** (`packages/assistant/src/runtime/run-sql.ts`) :
  champ dupliqué de `limit`, conservé pour compat des clients existants
  (payloads run-sql déjà consommés par les marques) — à retirer lors d'un
  prochain bump majeur de l'API assistant.
- **`packages/observability/fleet-collector/configure-fleet-npm.sh`** et les
  manifests `brand-config` contiennent l'IP du collector fleet historique
  (`104.168.10.36`) — c'est de la config fonctionnelle (tf2-fleet-collector
  en prod), pas une fuite doc ; à paramétrer proprement le jour où le
  collector bouge.
