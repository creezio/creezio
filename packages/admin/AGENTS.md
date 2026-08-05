# AGENTS — @creezio/admin

Modules natifs des **apps admin de marque** (mode admin — ADR
[docs/adr/ADR-admin-app-os.md](../../docs/adr/ADR-admin-app-os.md)).

- L'app admin est une app Creezio complète (même OS, `startBrandKernelHarness`)
  — ce package n'est PAS un runtime alternatif.
- `registerAdminModules(api)` monte `fleet`, `prospects`, `roadmap`,
  `support`, `billing-*` sous `/api/v1/modules/*`.
- `fleet` = proxy vers le backend flotte (`server-admin.mjs`, Basic interne
  via `CREEZIO_FLEET_BACKEND_URL` / `CREEZIO_FLEET_BACKEND_BASIC`) — la
  logique flotte reste dans `packages/observability/fleet-collector`.
- Zéro domaine marque ici : naming (« restaurants »…) = config app admin.
- UI : `@creezio/admin/ui` (TS brut compilé par l'app Next consommatrice).
- Migrations : `adminMigrations()` à passer en `brandMigrations` de l'app admin.

## Ne pas faire

- Recréer une logique docker/flotte ici (SoT = fleet-collector).
- Exposer le Basic backend flotte au client (le proxy est server-side).
- Coupler au métier d'une marque.
