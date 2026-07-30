# `@creezio/database`

Admin Database natif Creezio — catalogue SQLite, browse, CRUD contrôlé,
vues sauvegardées, **automations row-level** (triggers outbox, webhooks,
plugin_event, n8n).

**Contrat P13 / P29** : moteur + HTTP + UI dans le kit ; allowlist métier **uniquement** dans la marque. Défaut kit = **fail-closed** (aucune table métier CRUD-able).

## Ne pas confondre

| Package | Rôle |
|---------|------|
| **`@creezio/database`** | Automations **row-level** Admin Database (natif) |
| `@creezio/automations` | Lifecycle plugins/org/factory (**V3 prototype**, ≠ Database) |

## Contrat marque (obligatoire)

Sans `configureDatabasePolicy({ crudAllowlist })`, **aucune** table métier n’est CRUD-able.
Les whitelists métier vivent **dans la marque** (`brand-host.ts`), jamais dans ce package.

```ts
import {
  configureDatabaseEngine,
  configureDatabaseWebhookBrand,
  configureDatabasePolicy,
  DEFAULT_FORBIDDEN_WRITE_TABLES,
  startAutomationWorker,
  syncAllAutomationTriggers,
} from "@creezio/database";

/** Allowlist métier — définie dans la marque (ex. MYBRAND_CRUD_WHITELIST). */
const MYBRAND_CRUD_WHITELIST = [
  "customers",
  "orders",
  // …
] as const;

configureDatabasePolicy({
  crudAllowlist: MYBRAND_CRUD_WHITELIST,
  forbiddenWriteTables: DEFAULT_FORBIDDEN_WRITE_TABLES,
});
configureDatabaseEngine({ emitPluginEvent });
configureDatabaseWebhookBrand({
  userAgent: "MyBrand-Database-Automation/1.0",
  signatureHeader: "X-MyBrand-Signature",
  sourceHeader: "X-MyBrand-Source",
  sourceHeaderValue: "database-automation",
});
```

Schéma SQL : `DATABASE_CORE_SQL` (tables `db_*`).

## HTTP Admin

```ts
import { createAdminDatabaseRoutes } from "@creezio/database";

export const adminDatabaseRoutes = createAdminDatabaseRoutes({
  getDb,
  getWriteDb,
  getActor: (c) => /* session owner */ "owner",
  webhookTestSource: "mybrand-database",
});
```

Appeler `installDatabaseHost()` / `configure*DatabaseHost()` **avant** le montage
(routes et/ou ouverture DB) pour que la policy soit active.

## UI Admin

```tsx
import { DatabaseClient } from "@creezio/database/ui";
// Next : transpilePackages: ["@creezio/database"]
// Tailwind content : "./vendor/creezio/database/ui/**/*.{js,ts,jsx,tsx}"
```

Guard owner côté page marque (parité shell admin).

## Checklist hygiène / extinction

- [ ] Allowlist métier **locale** à la marque (pas d’import domaine TF depuis le kit)
- [ ] `configureDatabasePolicy` appelé au boot (route et/ou `db.ts`)
- [ ] Webhook brand headers `MyBrand-*` (pas de défaut métier hardcodé)
- [ ] Stub `admin-database.ts` mince (≤ ~40 LOC) — pas de logique moteur
- [ ] Page `/admin/database` : guard owner + `DatabaseClient` kit
- [ ] Vendor resync après bump kit : `sync-creezio-vendor.sh`
