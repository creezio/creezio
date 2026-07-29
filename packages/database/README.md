# `@creezio/database`

Admin Database natif Creezio — catalogue SQLite, browse, CRUD contrôlé,
vues sauvegardées, **automations row-level** (triggers outbox, webhooks,
plugin_event, n8n).

**SoT** : port réel depuis TempoFlow `crm/src/lib/database/*` (phase **R1**).

## Ne pas confondre

| Package | Rôle |
|---------|------|
| **`@creezio/database`** | Automations **row-level** Admin Database (natif) |
| `@creezio/automations` | Lifecycle plugins/org/factory (**V3 prototype**, ≠ Database) |

## Usage host (TempoFlow)

```ts
import {
  configureDatabaseEngine,
  configureDatabaseWebhookBrand,
  configureDatabasePolicy,
  TEMPOFLOW_CRUD_WHITELIST,
  DEFAULT_FORBIDDEN_WRITE_TABLES,
  startAutomationWorker,
  syncAllAutomationTriggers,
} from "@creezio/database";

configureDatabasePolicy({
  crudAllowlist: TEMPOFLOW_CRUD_WHITELIST,
  forbiddenWriteTables: DEFAULT_FORBIDDEN_WRITE_TABLES,
});
configureDatabaseEngine({ emitPluginEvent });
configureDatabaseWebhookBrand({
  userAgent: "TempoFlow-Database-Automation/1.0",
  signatureHeader: "X-TempoFlow-Signature",
  sourceHeader: "X-TempoFlow-Source",
});
```

Schéma SQL : `DATABASE_CORE_SQL` (tables `db_*`, compat migration TF v33).
