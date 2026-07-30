# @creezio/database — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/database/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/access-log.ts`](../src/access-log.ts) | 44 | `logDatabaseAccess`, `listAccessLog` |
| [`src/adapters.ts`](../src/adapters.ts) | 54 | `DatabaseEngineAdapters`, `DatabaseWebhookBrand`, `configureDatabaseEngine`, `getDatabaseEngineAdapters`, `configureDatabaseWebhookBrand`, `getDatabaseWebhookBrand` |
| [`src/automations-store.ts`](../src/automations-store.ts) | 228 | `AutomationTriggerType`, `WebhookAction`, `PluginAction`, `N8nAction`, `AutomationAction`, `Automation`, `listAutomations`, `getAutomation` |
| [`src/catalog.ts`](../src/catalog.ts) | 93 | `CatalogEntry`, `ColumnInfo`, `listCatalog`, `getTableMeta` |
| [`src/conditions.ts`](../src/conditions.ts) | 160 | `CompareOp`, `ConditionRule`, `ConditionGroup`, `ConditionContext`, `evaluateConditions`, `parseConditions` |
| [`src/crud.ts`](../src/crud.ts) | 67 | `insertRow`, `updateRow`, `deleteRow` |
| [`src/engine.ts`](../src/engine.ts) | 416 | `AutomationEvent`, `processAutomationEvent`, `processPendingEvents`, `processRetries`, `fireButtonAutomations`, `startAutomationWorker` |
| [`src/export.ts`](../src/export.ts) | 48 | `exportTable` |
| [`src/http/admin-routes.ts`](../src/http/admin-routes.ts) | 481 | `AdminDatabaseRouteDeps`, `createAdminDatabaseRoutes` |
| [`src/identifiers.ts`](../src/identifiers.ts) | 24 | `isSafeIdentifier`, `quoteIdent`, `isSystemTable` |
| [`src/index.ts`](../src/index.ts) | 115 | `openNodeSqliteDatabase`, `DATABASE_CORE_SQL`, `configureDatabaseEngine`, `configureDatabaseWebhookBrand`, `getDatabaseEngineAdapters`, `getDatabaseWebhookBrand`, `isSafeIdentifier`, `quoteIdent` |
| [`src/query.ts`](../src/query.ts) | 175 | `BrowseFilter`, `BrowseOptions`, `jsonRow`, `browseTable`, `getRowByRowid` |
| [`src/schema.ts`](../src/schema.ts) | 76 | `DATABASE_CORE_SQL` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 47 | `SqliteRunResult`, `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/triggers.ts`](../src/triggers.ts) | 93 | `syncAutomationTriggers`, `syncAllAutomationTriggers` |
| [`src/views.ts`](../src/views.ts) | 122 | `SavedViewConfig`, `SavedView`, `listSavedViews`, `createSavedView`, `updateSavedView`, `deleteSavedView` |
| [`src/webhooks.ts`](../src/webhooks.ts) | 119 | `WebhookDeliveryResult`, `assertWebhookUrl`, `signWebhookBody`, `deliverWebhook`, `retryDelaySeconds`, `MAX_WEBHOOK_ATTEMPTS` |
| [`src/whitelist.ts`](../src/whitelist.ts) | 76 | `DEFAULT_FORBIDDEN_WRITE_TABLES`, `configureDatabasePolicy`, `getCrudAllowlist`, `getForbiddenWriteTables`, `CRUD_WHITELIST`, `FORBIDDEN_WRITE_TABLES`, `canCrudTable`, `canAutomateTable` |
| [`ui/database-automations-panel.tsx`](../ui/database-automations-panel.tsx) | 390 | `DatabaseAutomationsPanel` |
| [`ui/database-client.tsx`](../ui/database-client.tsx) | 796 | `DatabaseClient` |
| [`ui/index.ts`](../ui/index.ts) | 15 | `DatabaseClient`, `DatabaseAutomationsPanel`, `displayValue`, `columnTypeLabel` |
| [`ui/primitives/badge.tsx`](../ui/primitives/badge.tsx) | 38 | `BadgeProps`, `Badge` |
| [`ui/primitives/button.tsx`](../ui/primitives/button.tsx) | 45 | `ButtonProps`, `Button`, `buttonVariants` |
| [`ui/primitives/cn.ts`](../ui/primitives/cn.ts) | 7 | `cn` |
| [`ui/primitives/input.tsx`](../ui/primitives/input.tsx) | 20 | `Input` |
| [`ui/primitives/sheet.tsx`](../ui/primitives/sheet.tsx) | 91 | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle` |
| [`ui/primitives/tabs.tsx`](../ui/primitives/tabs.tsx) | 52 | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| [`ui/types.ts`](../ui/types.ts) | 87 | `CatalogEntry`, `TableDetail`, `Automation`, `SavedView`, `displayValue`, `columnTypeLabel` |

---

## Détail par fichier

### `src/access-log.ts`

- **Lignes** : 44
- **Exports** : `logDatabaseAccess`, `listAccessLog`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/adapters.ts`

- **Lignes** : 54
- **Exports** : `DatabaseEngineAdapters`, `DatabaseWebhookBrand`, `configureDatabaseEngine`, `getDatabaseEngineAdapters`, `configureDatabaseWebhookBrand`, `getDatabaseWebhookBrand`

Adapters host pour le moteur Database (plugins, branding webhook, n8n).
Évite tout import `@/` marque dans le package.

### `src/automations-store.ts`

- **Lignes** : 228
- **Exports** : `AutomationTriggerType`, `WebhookAction`, `PluginAction`, `N8nAction`, `AutomationAction`, `Automation`, `listAutomations`, `getAutomation`, `createAutomation`, `updateAutomation`, `deleteAutomation`, `listAutomationRuns`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/catalog.ts`

- **Lignes** : 93
- **Exports** : `CatalogEntry`, `ColumnInfo`, `listCatalog`, `getTableMeta`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/conditions.ts`

- **Lignes** : 160
- **Exports** : `CompareOp`, `ConditionRule`, `ConditionGroup`, `ConditionContext`, `evaluateConditions`, `parseConditions`

Évaluateur de conditions style Notion (AND/OR imbriqués).

### `src/crud.ts`

- **Lignes** : 67
- **Exports** : `insertRow`, `updateRow`, `deleteRow`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/engine.ts`

- **Lignes** : 416
- **Exports** : `AutomationEvent`, `processAutomationEvent`, `processPendingEvents`, `processRetries`, `fireButtonAutomations`, `startAutomationWorker`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/export.ts`

- **Lignes** : 48
- **Exports** : `exportTable`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/http/admin-routes.ts`

- **Lignes** : 481
- **Exports** : `AdminDatabaseRouteDeps`, `createAdminDatabaseRoutes`

Routes Hono Admin Database (catalogue, browse, automations, CRUD, export).
Port TempoFlow → kit (M2). Auth owner reste côté marque (montage).

### `src/identifiers.ts`

- **Lignes** : 24
- **Exports** : `isSafeIdentifier`, `quoteIdent`, `isSystemTable`

Identifiants SQLite sûrs (tables / colonnes). 

const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isSafeIdentifier(value: string): boolean {
  return SAFE_IDENT.test(value) && !value.startsWith("sqlite_");
}

export function quoteIdent(value: string): string {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Identifiant SQLite invalide : ${value}`);
  }

### `src/index.ts`

- **Lignes** : 115
- **Exports** : `openNodeSqliteDatabase`, `DATABASE_CORE_SQL`, `configureDatabaseEngine`, `configureDatabaseWebhookBrand`, `getDatabaseEngineAdapters`, `getDatabaseWebhookBrand`, `isSafeIdentifier`, `quoteIdent`, `isSystemTable`, `DEFAULT_FORBIDDEN_WRITE_TABLES`, `CRUD_WHITELIST`, `FORBIDDEN_WRITE_TABLES`, `configureDatabasePolicy`, `getCrudAllowlist`, `getForbiddenWriteTables`, `canCrudTable`, `canAutomateTable`, `evaluateConditions`, `parseConditions`, `listCatalog`, `getTableMeta`, `jsonRow`, `browseTable`, `getRowByRowid`, `logDatabaseAccess`, `listAccessLog`, `listSavedViews`, `createSavedView`, `updateSavedView`, `deleteSavedView`, `listAutomations`, `getAutomation`, `createAutomation`, `updateAutomation`, `deleteAutomation`, `listAutomationRuns`, `syncAutomationTriggers`, `syncAllAutomationTriggers`, `assertWebhookUrl`, `signWebhookBody`

@creezio/database — Admin Database natif + automations row-level.
Fail-closed : CRUD métier impossible sans `configureDatabasePolicy({ crudAllowlist })`.
Ne pas confondre avec `@creezio/automations` (lifecycle plugins/org — V3 prototype).

### `src/query.ts`

- **Lignes** : 175
- **Exports** : `BrowseFilter`, `BrowseOptions`, `jsonRow`, `browseTable`, `getRowByRowid`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/schema.ts`

- **Lignes** : 76
- **Exports** : `DATABASE_CORE_SQL`

Schéma SQL core — tables Admin Database / automations row-level.
Identique à la migration TempoFlow v33 (préfixe `db_*` conservé pour compat).

### `src/sqlite-driver.ts`

- **Lignes** : 47
- **Exports** : `SqliteRunResult`, `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal — compatible better-sqlite3 / node:sqlite.
Port Database TempoFlow → @creezio/database (R1).

### `src/triggers.ts`

- **Lignes** : 93
- **Exports** : `syncAutomationTriggers`, `syncAllAutomationTriggers`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/views.ts`

- **Lignes** : 122
- **Exports** : `SavedViewConfig`, `SavedView`, `listSavedViews`, `createSavedView`, `updateSavedView`, `deleteSavedView`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/webhooks.ts`

- **Lignes** : 119
- **Exports** : `WebhookDeliveryResult`, `assertWebhookUrl`, `signWebhookBody`, `deliverWebhook`, `retryDelaySeconds`, `MAX_WEBHOOK_ATTEMPTS`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/whitelist.ts`

- **Lignes** : 76
- **Exports** : `DEFAULT_FORBIDDEN_WRITE_TABLES`, `configureDatabasePolicy`, `getCrudAllowlist`, `getForbiddenWriteTables`, `CRUD_WHITELIST`, `FORBIDDEN_WRITE_TABLES`, `canCrudTable`, `canAutomateTable`

Policy écriture / automation Admin Database.
Fail-closed : aucune table métier CRUD-able sans `configureDatabasePolicy`.
Les allowlists métier vivent dans chaque marque (jamais dans ce kit).

### `ui/database-automations-panel.tsx`

- **Lignes** : 390
- **Exports** : `DatabaseAutomationsPanel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/database-client.tsx`

- **Lignes** : 796
- **Exports** : `DatabaseClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 15
- **Exports** : `DatabaseClient`, `DatabaseAutomationsPanel`, `displayValue`, `columnTypeLabel`

Admin Database UI (port TempoFlow — M2).
Consommer via `@creezio/database/ui`.

### `ui/primitives/badge.tsx`

- **Lignes** : 38
- **Exports** : `BadgeProps`, `Badge`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/button.tsx`

- **Lignes** : 45
- **Exports** : `ButtonProps`, `Button`, `buttonVariants`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/cn.ts`

- **Lignes** : 7
- **Exports** : `cn`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/input.tsx`

- **Lignes** : 20
- **Exports** : `Input`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/sheet.tsx`

- **Lignes** : 91
- **Exports** : `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/primitives/tabs.tsx`

- **Lignes** : 52
- **Exports** : `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/types.ts`

- **Lignes** : 87
- **Exports** : `CatalogEntry`, `TableDetail`, `Automation`, `SavedView`, `displayValue`, `columnTypeLabel`

_(pas de cartouche JSDoc en tête — voir le code)_

