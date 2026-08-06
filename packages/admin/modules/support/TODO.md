# TODO — support

### [todo] SUPP-1 — Gate kit dédiée (sync + reply + idempotence messages)
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P2
- depends: aucune
- fichiers: scripts/ (gate à créer), packages/admin/src/index.ts
- criteres:
  - [ ] mock backend flotte (servers + export + reply + statut) : sync upsert idempotent, corps = premier message client, derniere_reponse = dernier message admin
  - [ ] reply : relais obligatoire avant copie locale, 502 si origine introuvable
  - [ ] messages jamais dupliqués par remote_id

### [todo] SUPP-2 — Doublon d'affichage de la réponse admin après re-sync
- scope: BUG — dysfonctionnement réel, correctif autorisé (aucun changement de comportement au-delà du fix)
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] la copie locale (`remote_id = NULL`) et le même message revenu de l'export marque (remote_id distant) ne s'affichent plus en double
  - [ ] stratégie choisie documentée en commentaire de code (rapprochement corps+auteur+fenêtre temporelle, ou remote_id retourné par le relais) — interview.md mis à jour seulement APRÈS merge, en miroir du code

### [todo] SUPP-3 — `<textarea>` réponse → primitive kit
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/tickets-admin-client.tsx
- criteres:
  - [ ] champ réponse sur primitive du design system quand disponible

### [todo] SUPP-4 — Sync planifié côté serveur
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] aujourd'hui le sync n'a lieu qu'à l'ouverture de la page (client) — comportement produit ACTUEL ; un poller serveur est un CHANGEMENT produit : validation explicite du propriétaire requise avant toute implémentation
  - [ ] ne pas écrire de « décision » dans interview.md — ce fichier est un miroir rétro du code réel
