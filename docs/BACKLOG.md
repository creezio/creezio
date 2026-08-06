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
  absents — les 55 gates marques skippent (raison affichée). Les exécuter
  sur un poste avec les repos marque synchronisés.
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
- **admin.tempoflow.fr en cert Origin Cloudflare** (pas Let's Encrypt) via
  `docker/server-admin/configure-admin-npm.sh` — valide tant que le domaine
  est proxifié Cloudflare (orange cloud).

## Admin app OS (ADR-admin-app-os) — suites

- **`@creezio/support` côté serveur marque** : table `support_tickets` +
  page OS `/support` (restaurateur) + route host-agent
  `/agent/api/support/*` + sync pull du module admin `support` (aujourd'hui :
  admin-side prêt — mount `support` + ingest + UI `/tickets` dans l'app
  admin ; le flux E2E serveur marque → admin reste à câbler).
- **Billing Stripe** : modèle posé (`admin_billing_*`, rapprochement
  client ↔ serveur ↔ abonnement, mounts `billing-*`) — brancher Stripe
  (webhooks → projection locale) derrière la config marque + UI dédiée
  (aujourd'hui : page Clients générée = fiche client/plan/rattachement).
- **Factory : générer le repo admin en app OS complète** : `scaffoldAdminRepo`
  génère aujourd'hui le repo config flotte (server-admin.json…) ; cible =
  scaffolder aussi l'app admin (server/ + modules @creezio/admin + pages),
  sur le modèle appliqué à `creezio/tempoflow-admin`.
- **Fleet natif TS** : porter la logique `server-lib.mjs`/`admin-docker.mjs`
  dans `@creezio/admin` pour supprimer le hop HTTP interne (le backend
  flotte HTTP reste pour les host-agents).
- **Prospection kanban drag & drop** : la page Prospects générée est une
  table CRUD ; le kanban colonne (`colonne`/`position`) est prévu dans le
  schéma — UI kanban à écrire dans `@creezio/admin/ui`.

## Documentation

- **`@creezio/brand-spec`** : pas encore de `README.md` / `docs/FILES.md`
  (AGENTS.md existe) — voir `docs/PACKAGES.md`.
- **Liens internes des docs archivées** : les documents de
  `docs/archive/` gardent leurs liens d'époque (certains pointent vers des
  emplacements déplacés) — assumé, l'archive est un journal.

## Divers

- **`packages/observability/fleet-collector/configure-fleet-npm.sh`** et les
  manifests `brand-config` contiennent l'IP du collector fleet historique
  (`104.168.10.36`) — c'est de la config fonctionnelle (tf2-fleet-collector
  en prod), pas une fuite doc ; à paramétrer proprement le jour où le
  collector bouge.
