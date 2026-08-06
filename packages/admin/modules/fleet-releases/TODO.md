# TODO — fleet-releases

### [todo] FREL-1 — `POST maintenance` sans auth : documenter/durcir la posture
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [ ] décision explicite : soit exiger un Bearer agent/une origine kernel, soit documenter dans le code pourquoi l'endpoint reste ouvert (idempotent, aucune donnée)
  - [ ] gate test-phase-fleet-rollout adaptée si durcissement
- note: traité dans PR #34 (ne pas rouvrir ici)

### [done] FREL-2 — Transition automatique `rolling` → `done` à 100 % servie
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [x] `autoCloseFleetReleases` : wave_pct ≥ 100 ∧ tous les éligibles servis (report `done` OU image cible) → `done` + événement `release_auto_done`
  - [x] décision tracée dans interview.md §6 (acceptée) ; geste manuel « Terminer » conservé

### [done] FREL-3 — Slots : limite globale (pas seulement par release)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [x] plafond global optionnel (`maxGlobalDownloadSlots` / `CREEZIO_FLEET_DOWNLOAD_SLOTS_GLOBAL`, 0 = off)
  - [x] gate couvrant le plafond global (`reason: "global_full"`)
