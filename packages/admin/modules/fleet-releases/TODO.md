# TODO — fleet-releases

### [todo] FREL-1 — `POST maintenance` sans auth : documenter/durcir la posture
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [ ] décision explicite : soit exiger un Bearer agent/une origine kernel, soit documenter dans le code pourquoi l'endpoint reste ouvert (idempotent, aucune donnée)
  - [ ] gate test-phase-fleet-rollout adaptée si durcissement

### [todo] FREL-2 — Transition automatique `rolling` → `done` à 100 % servie
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts, packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [ ] aujourd'hui « Terminer » est un geste manuel ; c'est le comportement produit ACTUEL — toute clôture auto est un CHANGEMENT produit qui exige une validation explicite du propriétaire (hors périmètre agent)
  - [ ] interview.md/prd.md ne se mettent à jour qu'APRÈS un changement validé et mergé — ne jamais y écrire une « décision » pour justifier du code nouveau

### [todo] FREL-3 — Slots : limite globale (pas seulement par release)
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/fleet-releases.ts
- criteres:
  - [ ] le sémaphore est par release : deux releases rolling simultanées peuvent saturer la bande passante du registre ; ajouter un plafond global optionnel
  - [ ] gate couvrant le plafond global
