# TODO — prospects

### [done] PROSP-1 — Migrer le mount vers un EntitySpec `createEntityApiMount`
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [x] `createAdminCrudMount("prospects")` = EntitySpec déclaratif (`ADMIN_ENTITY_SPECS.prospects`)
  - [x] dialecte `{ ok, items }` conservé (compat client)

### [done] PROSP-2 — Archivage réel (archived_at) au lieu du DELETE
- priorite: P3
- depends: PROSP-1
- fichiers: packages/admin/src/index.ts, packages/admin/ui/prospects-kanban-client.tsx
- criteres:
  - [x] `POST /:id/archive` écrit `archived_at` (`archivable` + `softDeleteOnly`)
  - [x] client n'utilise plus DELETE comme archivage

### [todo] PROSP-3 — Validation serveur `nom` requis à la création
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] POST sans `nom` non vide → 400 (aujourd'hui la contrainte NOT NULL SQLite produit une 500 non normalisée)

### [todo] PROSP-4 — `<textarea>` notes → primitive kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/prospects-kanban-client.tsx
- criteres:
  - [ ] le champ notes utilise une primitive du design system (textarea kit quand disponible dans @creezio/shell-ui)

### [todo] PROSP-5 — Gate kit dédiée au CRUD prospects
- priorite: P3
- depends: aucune
- fichiers: scripts/ (gate à créer)
- criteres:
  - [ ] gate node --test : CRUD complet + tri kanban `position ASC, created_at DESC` sur DB better-sqlite3 avec adminMigrations()
