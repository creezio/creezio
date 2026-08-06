# TODO — billing

### [done] BILL-1 — Événements sans id Stripe : rejet 400
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts, packages/admin/modules/billing/interview.md
- criteres:
  - [x] décision : rejet 400 `event_id_required` (pas de journal ni projection sans dédup) — tracée dans interview.md
  - [x] gate admin-billing : événement signé sans `id` → 400

### [todo] BILL-2 — MRR : normaliser les abonnements non mensuels
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] `montant_mensuel` est pris tel quel depuis `unit_amount` (un plan annuel gonfle le MRR ×12) : lire `price.recurring.interval` et normaliser
  - [ ] gate admin-billing étendue (cas plan annuel)

### [todo] BILL-3 — Tableaux `<table>` bruts → data-table kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/billing-admin-client.tsx
- criteres:
  - [ ] « Clients & abonnements » et « Factures » rendus avec le composant table du design system (tri/pagination)

### [done] BILL-4 — Réconciliation : dépasser le cap 10 pages × 100 objets
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [x] cap relevé à 50 pages (5000 objets) ; si `has_more` après le cap → `truncated:true` + `truncatedCollections` dans la réponse reconcile

### [done] BILL-5 — CRUD billing-customers/subscriptions → EntitySpec
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [x] bascule `createEntityApiMount` via `createAdminEntityMount` + dialecte `{ ok, items }`
  - [x] gate admin-billing : CRUD EntitySpec customers/subscriptions
