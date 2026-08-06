# TODO — prospects

### [todo] PROSP-1 — Migrer le mount vers un EntitySpec `createEntityApiMount`
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] `createAdminCrudMount("prospects")` remplacé par un EntitySpec déclaratif (moteur kit @creezio/api-kernel) sans changement de contrat HTTP
  - [ ] dialecte `{ ok, items }` conservé (compat client)

### [todo] PROSP-2 — Archivage réel (archived_at) au lieu du DELETE
- priorite: P3
- depends: PROSP-1
- fichiers: packages/admin/src/index.ts, packages/admin/ui/prospects-kanban-client.tsx
- criteres:
  - [ ] la colonne `archived_at` (déjà en schéma) devient écrivable via `POST /<id>/archive` sur le mount kit
  - [ ] le client n'utilise plus DELETE comme archivage (fallback conservé pour compat)

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
