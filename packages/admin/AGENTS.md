# AGENTS — @creezio/admin

Modules natifs des **apps admin de marque** (mode admin — ADR
[docs/adr/ADR-admin-app-os.md](../../docs/adr/ADR-admin-app-os.md)).

- L'app admin est une app Creezio complète (même OS, `startBrandKernelHarness`)
  — ce package n'est PAS un runtime alternatif.
- `registerAdminModules(api)` monte `fleet`, `fleet-registry`, `prospects`,
  `roadmap`, `support`, `billing-*` sous `/api/v1/modules/*`.
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
- Zéro domaine marque ici : naming (« restaurants »…) = config app admin.
- UI : `@creezio/admin/ui` (TS brut compilé par l'app Next consommatrice).
- Migrations : `adminMigrations()` à passer en `brandMigrations` de l'app admin.

## Ne pas faire

- Recréer une logique docker/flotte ici (SoT = fleet-collector).
- Exposer le Basic backend flotte au client (le proxy est server-side).
- Coupler au métier d'une marque.
