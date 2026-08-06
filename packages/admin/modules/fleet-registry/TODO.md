# TODO — fleet-registry

### [done] FREG-1 — Événement `heartbeat_lost` jamais émis
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [x] émis sur transition online→offline détectée au `POST sync` (snapshot pré-upsert + `emitFleetHeartbeatLost`)
  - [x] gate test-phase-admin-fleet-registry verte

### [done] FREG-2 — Rate-limit register partagé multi-process
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [x] documenté dans le JSDoc de `createRateLimiter` : compteur mémoire **par process** (quota × N workers)
  - [x] décision tracée dans interview.md §6

### [done] FREG-3 — Purge/rétention du journal admin_fleet_events
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [x] `purgeFleetEvents` (âge + plafond rows, opts/env) appelée à chaque `POST sync`
  - [x] gate couvrant la purge
