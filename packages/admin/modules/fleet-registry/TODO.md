# TODO — fleet-registry

### [todo] FREG-1 — Événement `heartbeat_lost` jamais émis
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [ ] le commentaire SQL de `admin_fleet_events.kind` cite `heartbeat_lost` mais aucun code ne l'émet : soit l'émettre (transition online→offline détectée par le poller), soit retirer la mention du commentaire (nouvelle migration interdite : note de doc)
  - [ ] gate test-phase-admin-fleet-registry verte

### [todo] FREG-2 — Rate-limit register partagé multi-process
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [ ] documenter (ou corriger) le fait que `createRateLimiter` est en mémoire par process : plusieurs workers = quota multiplié
  - [ ] décision tracée dans interview.md §6

### [todo] FREG-3 — Purge/rétention du journal admin_fleet_events
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-registry.ts
- criteres:
  - [ ] le journal croît sans borne (l'API n'en lit que 200) : ajouter une purge (janitor maintenance ou poller) avec seuil configurable
  - [ ] gate couvrant la purge
