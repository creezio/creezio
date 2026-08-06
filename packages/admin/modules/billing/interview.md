# Interview module billing

## 1. Identité & pages

- id : `billing` ; titre : « Facturation Stripe (webhook + admin) ».
- Module natif kit (`@creezio/admin`) couvrant **4 mounts** :
  `/api/v1/modules/billing-webhook` (Stripe entrant),
  `/api/v1/modules/billing` (overview + reconcile),
  `/api/v1/modules/billing-customers` et
  `/api/v1/modules/billing-subscriptions` (CRUD rapprochement).
- Page : matérialisée par l'app admin (TempoFlow : `/billing`, nav
  chrome « Facturation ») rendant `BillingAdminClient` avec labels.
- Permission : session OS admin partout **sauf** le webhook (auth =
  signature Stripe, endpoint public).

## 2. Données & migrations

- Migrations historiques (**intouchables**) :
  - `admin_001_native_modules` → `admin_billing_customers`,
    `admin_billing_subscriptions`, `admin_billing_invoices` ;
  - `admin_002_support_messages_billing_events` → `admin_billing_events`
    (`stripe_event_id` UNIQUE = dédup webhook) ;
  - `admin_003_billing_periode_fin` →
    `admin_billing_subscriptions.periode_fin`.
- Schémas complets : prd.md (copies des migrations).
- FK logiques : `subscriptions.customer_id` → `customers.id` ;
  `invoices.customer_id` / `invoices.subscription_id` ; clés externes
  Stripe : `stripe_customer_id` / `stripe_subscription_id` /
  `stripe_invoice_id` / `stripe_event_id` (upserts).
- Nouvelle migration éventuelle : `mod_billing_00N_<slug>`.

## 3. API

- `billing-webhook` : mount **manuscrit** — justification : auth par
  signature sur le **corps brut** (`req.rawBody`), idempotence par
  événement, projections multi-tables.
- `billing` : mount **manuscrit** — justification : agrégats SQL
  (jointures, stats) + orchestration API Stripe paginée.
- `billing-customers` / `billing-subscriptions` : EntitySpec via
  `createAdminEntityMount(ADMIN_ENTITY_SPECS[…])` — dialecte
  `{ ok, items }` / `{ ok, item }` conservé (BILL-5).
- Options : `BillingWebhookMountOptions { webhookSecret?
  (STRIPE_WEBHOOK_SECRET), toleranceSeconds? (300) }` ;
  `BillingAdminMountOptions { stripeApiKey? (STRIPE_API_KEY), apiBase?
  (STRIPE_API_BASE, mock de test), timeoutMs? (20000) }`.
- Décision structurante : **aucune dépendance au SDK stripe** —
  `verifyStripeSignature` implémentée localement, `stripeListAll` en
  fetch nu (pagination `starting_after`, cap 50 pages / 5000 objets ;
  `truncated:true` si `has_more` après le cap — BILL-4).

### BILL-1 — événements Stripe sans `id`

Décision : **rejet 400** `event_id_required`. Sans `id`, la dédup
(`admin_billing_events.stripe_event_id` UNIQUE) est impossible ;
journaliser sans dédup risquerait des double-projections sur retry.
Stripe contractuellement fournit toujours `id` — un payload sans id
est malformé ; on ne projette ni n'écrit le journal.

## 4. UI, nav & permissions — kit graphique imposé

### Page /billing (matérialisée marque, client `BillingAdminClient`)

- stats : 3 `card`
- listes : `<table>` HTML brut ×2 (écart au kit : `data-table` attendu —
  dette BILL-3) + liste événements stylée tokens
- statuts : `badge` (variants selon statut abonnement/facture)
- action : `button` « Resynchroniser Stripe »
- erreurs : `card` destructive (message + hint serveur)

## 5. Tools MCP & policies

Aucun.

## 6. Rôles & permissions

- Webhook : endpoint **sans session** — la sécurité repose entièrement
  sur la signature HMAC + tolérance horodatage + dédup. Secret dans le
  `.env` gitignoré de l'app admin.
- Overview/reconcile/CRUD : session OS admin.
- `STRIPE_API_KEY` (`sk_…`) : server-side only, jamais commitée, jamais
  restituée par l'API.

## 7. Meili / n8n / plugins

Aucun.

## 8. Seeds & onboarding

Aucun. Amorçage des données : `POST reconcile` (premier remplissage sans
attendre les webhooks).

## 9. Gates de validation

- `scripts/test-phase-admin-billing.mjs` : webhook signé → projections
  (client, abonnement avec `periode_fin`, facture payée, journal) ;
  overview (jointures + stats MRR/actifs/impayées) ; réconciliation
  active contre un mock HTTP (`STRIPE_API_BASE`) — y compris facture
  jamais reçue par webhook et changement de statut d'abonnement ; 503 +
  hint sans `STRIPE_API_KEY` ; événement sans `id` → 400 (BILL-1) ;
  reconcile `truncated` si cap pages atteint (BILL-4) ; CRUD EntitySpec
  customers/subscriptions (BILL-5).

## 10. i18n

Libellés UI en français (labels FR des statuts) ; statuts persistés =
identifiants Stripe en anglais (`active`, `trialing`, `canceled`,
`paid`, `open`, `payment_failed`…) — contrat Stripe, ne pas traduire.
Formats monétaires/dates : `Intl` fr-FR côté client.
