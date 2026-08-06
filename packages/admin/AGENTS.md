# AGENTS — @creezio/admin

Modules natifs des **apps admin de marque** (mode admin — ADR
[docs/adr/ADR-admin-app-os.md](../../docs/adr/ADR-admin-app-os.md)).

- L'app admin est une app Creezio complète (même OS, `startBrandKernelHarness`)
  — ce package n'est PAS un runtime alternatif.
- `registerAdminModules(api)` monte `fleet`, `fleet-registry`,
  `fleet-releases`, `prospects`, `roadmap`, `support`, `billing-*` sous
  `/api/v1/modules/*`.
- `fleet` = proxy vers le backend flotte (`server-admin.mjs`, Basic interne
  via `CREEZIO_FLEET_BACKEND_URL` / `CREEZIO_FLEET_BACKEND_BASIC`) — la
  logique flotte reste dans `packages/observability/fleet-collector`.
- `fleet-registry` = DB centrale de la flotte (`admin_fleet_servers` /
  `admin_fleet_events`, migration `admin_004`) — VUE matérialisée : les JSON
  (`servers.json`, `fleet-hosts.json`) restent la SoT des gestes Docker.
  Alimentée par `POST sync` (backfill), le poller de fond
  (`startFleetRegistryPoller`, 60-120 s) et l'auto-inscription des serveurs
  (`POST register` Bearer `CREEZIO_FLEET_REGISTER_SECRET`, `POST heartbeat`
  Bearer serverKey hashé ; accessToken chiffré AES-GCM via
  `@creezio/integrations`). Statut `online` DÉRIVÉ de
  `last_heartbeat_at`/`last_polled_at` (< 3× intervalle), jamais stocké.
  Gate : `scripts/test-phase-admin-fleet-registry.mjs`.
- `fleet-releases` = updates en PULL (F5, migration `admin_005` :
  `admin_fleet_releases` / `admin_fleet_update_reports` /
  `admin_fleet_download_slots`). Les agents hôtes POLLENT
  (`GET next?hostId=` Bearer `hostId:agentToken`, vérifié via le backend
  `POST /admin/api/hosts/verify` + cache), prennent un slot de téléchargement
  (sémaphore, lease TTL 15 min), appliquent l'update via leur `updateServer`
  local (backup/recreate/rollback) puis POSTent un `report`
  (done|failed|rolled_back, upsert par release+serveur). Directives :
  release `rolling` ∧ channel ∧ ¬hold ∧ pin prioritaire ∧ vague
  (`hash(server_id) mod 100 < wave_pct` — bucket STABLE par serveur).
  Pull par digest si la release en a un ; comparaison « à jour » digest-aware
  (`fleetImageMatchesTarget`). CRUD releases + `PUT servers/<id>/rollout`
  (pin/hold/channel) côté session admin. `publish --release` déclare la
  release (draft). Gate : `scripts/test-phase-fleet-releases.mjs`.
- Rollout piloté (F6) : cycle draft → `rolling` (canary `wave_pct`) →
  promotion (vagues MONOTONES : un serveur servi le reste) → `done` ;
  `paused` (kill-switch doux) / `aborted` (kill-switch définitif) — toute
  sortie de `rolling` RÉVOQUE les leases de téléchargement, les agents
  cessent au poll suivant. Garde-fou `autoPauseFleetReleases` : ≥ N échecs
  (`failed`+`rolled_back`, défaut 2, env `CREEZIO_FLEET_AUTO_PAUSE_FAILURES`)
  → auto-pause + événement `release_auto_paused`. Janitor
  `POST maintenance` (purge leases expirées + auto-pause) appelé par
  `startFleetRegistryPoller` à chaque cycle (opt-out
  `releasesMaintenance:false`). UI `/flotte` : section « Releases » +
  hold/pin/canal par serveur. Gate : `scripts/test-phase-fleet-rollout.mjs`.
- Zéro domaine marque ici : naming (« restaurants »…) = config app admin.
- UI : `@creezio/admin/ui` (TS brut compilé par l'app Next consommatrice).
- Migrations : `adminMigrations()` à passer en `brandMigrations` de l'app admin.

## Ne pas faire

- Recréer une logique docker/flotte ici (SoT = fleet-collector).
- Exposer le Basic backend flotte au client (le proxy est server-side).
- Coupler au métier d'une marque.
