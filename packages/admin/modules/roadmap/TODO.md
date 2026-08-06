# TODO — roadmap

### [todo] ROAD-1 — Migrer le mount vers un EntitySpec `createEntityApiMount`
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] CRUD identique via EntitySpec déclaratif, dialecte `{ ok, items }` conservé

### [done] ROAD-2 — Client UI kit `RoadmapAdminClient`
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/ (nouveau fichier), packages/admin/ui/index.ts
- criteres:
  - [x] client générique (liste par statut/jalon, création, édition) sur primitives kit, labels marque en props
  - [x] adopté par au moins une app admin sans style ad hoc

### [todo] ROAD-3 — Validation serveur `titre` requis
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] POST sans `titre` non vide → 400 normalisé (pas d'erreur SQLite brute)

### [todo] ROAD-4 — Gate kit dédiée au CRUD roadmap
- priorite: P3
- depends: aucune
- fichiers: scripts/ (gate à créer)
- criteres:
  - [ ] gate node --test : CRUD + tri position sur DB better-sqlite3 avec adminMigrations()
