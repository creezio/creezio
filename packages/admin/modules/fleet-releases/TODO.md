# TODO — fleet-releases

### [done] FREL-1 — `POST maintenance` sans auth : documenter/durcir la posture
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [x] décision : rester ouvert (idempotent, pas de PII) ; chemin nominal = poller in-process ; allowlist F3 sur HTTP — documenté au-dessus du handler
  - [x] pas de durcissement auth → gate fleet-rollout inchangée

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
