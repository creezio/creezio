# TODO — billing

### [todo] BILL-1 — Événements sans id Stripe : journaliser quand même
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] un événement sans `id` est aujourd'hui projeté mais absent du journal (pas de dédup possible) : décider journalisation sans dédup ou rejet 400, tracer dans interview.md

### [todo] BILL-2 — MRR : normaliser les abonnements non mensuels
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] `montant_mensuel` est pris tel quel depuis `unit_amount` (un plan annuel gonfle le MRR ×12) : lire `price.recurring.interval` et normaliser
  - [ ] gate admin-billing étendue (cas plan annuel)

### [done] BILL-3 — Tableaux `<table>` bruts → data-table kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/billing-admin-client.tsx
- criteres:
  - [x] « Clients & abonnements » et « Factures » rendus avec le composant table du design system (tri/pagination)

### [todo] BILL-4 — Réconciliation : dépasser le cap 10 pages × 100 objets
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] au-delà de 1000 customers/subscriptions/invoices la resync est silencieusement partielle : lever le cap ou remonter `truncated:true` dans la réponse

### [todo] BILL-5 — CRUD billing-customers/subscriptions → EntitySpec
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] bascule `createEntityApiMount` sans changement de contrat HTTP
