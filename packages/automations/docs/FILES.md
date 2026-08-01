# @creezio/automations — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/automations/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/api-mount.ts`](../src/api-mount.ts) | 129 | `createAutomationsApiMount` |
| [`src/engine.ts`](../src/engine.ts) | 259 | `AutomationEngine`, `createAutomationEngine`, `defaultDemobrandAutomationRules` |
| [`src/index.ts`](../src/index.ts) | 36 | `AUTOMATION_ACTION_TYPES`, `AUTOMATION_TRIGGER_TYPES`, `createAutomationEngine`, `defaultDemobrandAutomationRules`, `ruleMatches`, `createAutomationsApiMount`, `AUTOMATIONS_CORE_SQL`, `createSqliteAutomationPersist` |
| [`src/match.ts`](../src/match.ts) | 16 | `ruleMatches` |
| [`src/schema.ts`](../src/schema.ts) | 30 | `AUTOMATIONS_CORE_SQL` |
| [`src/sqlite-persist.ts`](../src/sqlite-persist.ts) | 150 | `AutomationPersistStore`, `CreateSqliteAutomationPersistOptions`, `createSqliteAutomationPersist` |
| [`src/types.ts`](../src/types.ts) | 115 | `AUTOMATION_TRIGGER_TYPES`, `AutomationTriggerType`, `AUTOMATION_ACTION_TYPES`, `AutomationActionType`, `AutomationTriggerEvent`, `AutomationAction`, `AutomationRule`, `AutomationRunResult` |

---

## Détail par fichier

### `src/api-mount.ts`

- **Lignes** : 129
- **Exports** : `createAutomationsApiMount`

Mount API automations — /api/v1/platform/automations/...

### `src/engine.ts`

- **Lignes** : 259
- **Exports** : `AutomationEngine`, `createAutomationEngine`, `defaultDemobrandAutomationRules`

Moteur automations — dispatch trigger → rules → actions.

### `src/index.ts`

- **Lignes** : 36
- **Exports** : `AUTOMATION_ACTION_TYPES`, `AUTOMATION_TRIGGER_TYPES`, `createAutomationEngine`, `defaultDemobrandAutomationRules`, `ruleMatches`, `createAutomationsApiMount`, `AUTOMATIONS_CORE_SQL`, `createSqliteAutomationPersist`

@creezio/automations — **lifecycle-only** (plugins / org / factory / obs).
Prototype V3 — **pas** le moteur Admin Database row-level.
SoT row-level = `@creezio/database` (extraction TempoFlow, R1).

### `src/match.ts`

- **Lignes** : 16
- **Exports** : `ruleMatches`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/schema.ts`

- **Lignes** : 30
- **Exports** : `AUTOMATIONS_CORE_SQL`

Schema SQLite core — rules + runs automations (C4).

### `src/sqlite-persist.ts`

- **Lignes** : 150
- **Exports** : `AutomationPersistStore`, `CreateSqliteAutomationPersistOptions`, `createSqliteAutomationPersist`

Persistance SQLite rules/runs automations (C4).

### `src/types.ts`

- **Lignes** : 115
- **Exports** : `AUTOMATION_TRIGGER_TYPES`, `AutomationTriggerType`, `AUTOMATION_ACTION_TYPES`, `AutomationActionType`, `AutomationTriggerEvent`, `AutomationAction`, `AutomationRule`, `AutomationRunResult`, `AutomationEngineAdapters`

Contrats automations **lifecycle** (vision V3 prototype).
Triggers = plugin/org/factory/obs — pas row-level Database.
Voir `@creezio/database` pour Admin Database / automations TF.

