# TODO — billing

### [todo] BILL-1 — Événements sans id Stripe : journaliser quand même
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] un événement sans `id` est aujourd'hui projeté mais absent du journal (pas de dédup possible) — comportement produit ACTUEL ; changer (journalisation sans dédup ou rejet 400) = décision produit du propriétaire, pas d'un agent ; interview.md/prd.md mis à jour seulement APRÈS merge

### [todo] BILL-2 — MRR : normaliser les abonnements non mensuels
- scope: BUG — dysfonctionnement réel, correctif autorisé (aucun changement de comportement au-delà du fix)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] `montant_mensuel` est pris tel quel depuis `unit_amount` (un plan annuel gonfle le MRR ×12) : lire `price.recurring.interval` et normaliser
  - [ ] gate admin-billing étendue (cas plan annuel)

### [todo] BILL-3 — Tableaux `<table>` bruts → data-table kit
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/billing-admin-client.tsx
- criteres:
  - [ ] « Clients & abonnements » et « Factures » rendus avec le composant table du design system (tri/pagination)

### [todo] BILL-4 — Réconciliation : dépasser le cap 10 pages × 100 objets
- scope: BUG — dysfonctionnement réel, correctif autorisé (aucun changement de comportement au-delà du fix)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] au-delà de 1000 customers/subscriptions/invoices la resync est silencieusement partielle : lever le cap ou remonter `truncated:true` dans la réponse

### [todo] BILL-5 — CRUD billing-customers/subscriptions → EntitySpec
- scope: HORS-SCOPE — évolution/refactor/UI/décision : NE PAS réaliser sans demande explicite du propriétaire (l'app est considérée fonctionnelle telle quelle)
- priorite: P3
- depends: aucune
- fichiers: packages/admin/src/index.ts
- criteres:
  - [ ] bascule `createEntityApiMount` sans changement de contrat HTTP
