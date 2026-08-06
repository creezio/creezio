# TODO — fleet-releases

### [todo] FREL-1 — `POST maintenance` sans auth : documenter/durcir la posture
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [ ] décision explicite : soit exiger un Bearer agent/une origine kernel, soit documenter dans le code pourquoi l'endpoint reste ouvert (idempotent, aucune donnée)
  - [ ] gate test-phase-fleet-rollout adaptée si durcissement

### [todo] FREL-2 — Transition automatique `rolling` → `done` à 100 % servie
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts, packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [ ] aujourd'hui « Terminer » est un geste manuel ; évaluer une clôture auto quand tous les serveurs éligibles ont un report `done`
  - [ ] décision tracée dans interview.md (même si refus)

### [todo] FREL-3 — Slots : limite globale (pas seulement par release)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [ ] le sémaphore est par release : deux releases rolling simultanées peuvent saturer la bande passante du registre ; ajouter un plafond global optionnel
  - [ ] gate couvrant le plafond global
