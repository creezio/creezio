# TODO — roadmap

### [todo] ROAD-1 — Migrer le mount vers un EntitySpec `createEntityApiMount`
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] CRUD identique via EntitySpec déclaratif, dialecte `{ ok, items }` conservé

### [todo] ROAD-2 — Client UI kit `RoadmapAdminClient`
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/ (nouveau fichier), packages/admin/ui/index.ts
- criteres:
  - [ ] client générique (liste par statut/jalon, création, édition) sur primitives kit, labels marque en props
  - [ ] adopté par au moins une app admin sans style ad hoc

### [done] ROAD-3 — Validation serveur `titre` requis
- done: 2026-08-06
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [x] POST sans `titre` non vide → 400 `titre_required`

### [done] ROAD-4 — Gate kit dédiée au CRUD roadmap
- done: 2026-08-06
- priorite: P3
- depends: aucune
- fichiers: scripts/test-phase-admin-roadmap.mjs
- criteres:
  - [x] gate node --test : CRUD + tri position + validation titre
