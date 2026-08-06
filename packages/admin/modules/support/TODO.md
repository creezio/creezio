# TODO — support

### [todo] SUPP-1 — Gate kit dédiée (sync + reply + idempotence messages)
- priorite: P2
- depends: aucune
- fichiers: scripts/ (gate à créer), packages/admin/src/index.ts
- criteres:
  - [ ] mock backend flotte (servers + export + reply + statut) : sync upsert idempotent, corps = premier message client, derniere_reponse = dernier message admin
  - [ ] reply : relais obligatoire avant copie locale, 502 si origine introuvable
  - [ ] messages jamais dupliqués par remote_id

### [todo] SUPP-2 — Doublon d'affichage de la réponse admin après re-sync
- priorite: P2
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] la copie locale (`remote_id = NULL`) et le même message revenu de l'export marque (remote_id distant) ne s'affichent plus en double
  - [ ] stratégie tracée en interview (rapprochement corps+auteur+fenêtre temporelle, ou remote_id retourné par le relais)

### [done] SUPP-3 — `<textarea>` réponse → primitive kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/tickets-admin-client.tsx
- criteres:
  - [x] champ réponse sur primitive du design system quand disponible

### [todo] SUPP-4 — Sync planifié côté serveur
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] aujourd'hui le sync n'a lieu qu'à l'ouverture de la page (client) ; évaluer un tick serveur (à la manière de startFleetRegistryPoller) pour que les tickets arrivent sans visite
  - [ ] décision tracée dans interview.md
