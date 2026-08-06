# TODO — prospects

### [todo] PROSP-1 — Migrer le mount vers un EntitySpec `createEntityApiMount`
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] `createAdminCrudMount("prospects")` remplacé par un EntitySpec déclaratif (moteur kit @creezio/api-kernel) sans changement de contrat HTTP
  - [ ] dialecte `{ ok, items }` conservé (compat client)

### [todo] PROSP-2 — Archivage réel (archived_at) au lieu du DELETE
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: PROSP-1
- fichiers: packages/admin/src/index.ts, packages/admin/ui/prospects-kanban-client.tsx
- criteres:
  - [ ] la colonne `archived_at` (déjà en schéma) devient écrivable via `POST /<id>/archive` sur le mount kit
  - [ ] le client n'utilise plus DELETE comme archivage (le chemin DELETE-archive est supprimé)

### [done] PROSP-3 — Validation serveur `nom` requis à la création
- done: 2026-08-06
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [x] POST sans `nom` non vide → 400 `nom_required`

### [todo] PROSP-4 — `<textarea>` notes → primitive kit
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/prospects-kanban-client.tsx
- criteres:
  - [ ] le champ notes utilise une primitive du design system (textarea kit quand disponible dans @creezio/shell-ui)

### [done] PROSP-5 — Gate kit dédiée au CRUD prospects
- done: 2026-08-06
- priorite: P3
- depends: aucune
- fichiers: scripts/test-phase-admin-prospects.mjs
- criteres:
  - [x] gate node --test : CRUD + tri kanban + validation nom
