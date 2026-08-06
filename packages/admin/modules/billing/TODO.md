# TODO — billing

### [todo] BILL-1 — Événements sans id Stripe : journaliser quand même
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] un événement sans `id` est aujourd'hui projeté mais absent du journal (pas de dédup possible) : décider journalisation sans dédup ou rejet 400, tracer dans interview.md

### [done] BILL-2 — MRR : normaliser les abonnements non mensuels
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts (`monthlyAmountFromStripePrice`)
- criteres:
  - [x] `montant_mensuel` normalisé via `price.recurring.interval` (+ `interval_count`)
  - [x] gate admin-billing étendue (cas plan annuel + trimestre)

### [todo] BILL-3 — Tableaux `<table>` bruts → data-table kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/billing-admin-client.tsx
- criteres:
  - [ ] « Clients & abonnements » et « Factures » rendus avec le composant table du design system (tri/pagination)

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
