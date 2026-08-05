# @creezio/admin

Modules natifs des apps admin de marque (« l'OS qui gère l'entreprise de la
marque ») — voir [ADR-admin-app-os](../../docs/adr/ADR-admin-app-os.md).

| Module | Route | Rôle |
|--------|-------|------|
| `fleet` | `/api/v1/modules/fleet/*` | Pilotage flotte (proxy backend `server-admin.mjs`) |
| `prospects` | `/api/v1/modules/prospects` | CRM prospection kanban générique |
| `roadmap` | `/api/v1/modules/roadmap` | Roadmap produit |
| `support` | `/api/v1/modules/support` | Tickets clients agrégés (sync flotte) |
| `billing-customers` / `billing-subscriptions` | `/api/v1/modules/billing-*` | Facturation : rapprochement client ↔ serveur ↔ abonnement (Stripe via config marque) |

## Usage (app admin)

```ts
import { adminMigrations, registerAdminModules } from "@creezio/admin";

await startBrandKernelHarness({
  brandId: "tempoflowadmin",
  brandMigrations: adminMigrations(),
  registerModuleApi: (api) => registerAdminModules(api),
  // …
});
```

UI : `import { FleetAdminClient } from "@creezio/admin/ui"` dans une page
Next de l'app admin.

Env backend flotte : `CREEZIO_FLEET_BACKEND_URL` (défaut
`http://127.0.0.1:18800`), `CREEZIO_FLEET_BACKEND_BASIC` (`user:pass`).
