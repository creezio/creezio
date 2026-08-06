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

### [todo] ROAD-3 — Validation serveur `titre` requis
- scope: BUG — dysfonctionnement réel, correctif autorisé (aucun changement de comportement au-delà du fix)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] POST sans `titre` non vide → 400 normalisé (pas d'erreur SQLite brute)

### [todo] ROAD-4 — Gate kit dédiée au CRUD roadmap
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: scripts/ (gate à créer)
- criteres:
  - [ ] gate node --test : CRUD + tri position sur DB better-sqlite3 avec adminMigrations()
