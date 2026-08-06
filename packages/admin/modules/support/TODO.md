# TODO — support

### [todo] SUPP-1 — Gate kit dédiée (sync + reply + idempotence messages)
- priorite: P2
- depends: aucune
- fichiers: scripts/ (gate à créer), packages/admin/src/index.ts
- criteres:
  - [ ] mock backend flotte (servers + export + reply + statut) : sync upsert idempotent, corps = premier message client, derniere_reponse = dernier message admin
  - [ ] reply : relais obligatoire avant copie locale, 502 si origine introuvable
  - [ ] messages jamais dupliqués par remote_id

### [done] SUPP-2 — Doublon d'affichage de la réponse admin après re-sync
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/index.ts, packages/admin/modules/support/interview.md
- criteres:
  - [x] sync rattache la copie locale (`remote_id IS NULL`) au message exporté (corps+origine) au lieu d'insérer
  - [x] reply stocke le `remote_id` renvoyé par le relais quand disponible ; stratégie tracée en interview.md

### [todo] SUPP-3 — `<textarea>` réponse → primitive kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/tickets-admin-client.tsx
- criteres:
  - [ ] champ réponse sur primitive du design system quand disponible

### [todo] SUPP-4 — Sync planifié côté serveur
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] aujourd'hui le sync n'a lieu qu'à l'ouverture de la page (client) ; évaluer un tick serveur (à la manière de startFleetRegistryPoller) pour que les tickets arrivent sans visite
  - [ ] décision tracée dans interview.md
