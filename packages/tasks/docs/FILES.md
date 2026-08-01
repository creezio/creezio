# @creezio/tasks — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/tasks/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`scripts/port-from-tempoflow.mjs`](../scripts/port-from-tempoflow.mjs) | 406 | `TasksUserKind`, `TasksUser`, `TasksSession`, `TasksSqliteStatement`, `TasksSqliteDb`, `TasksDbAdapter`, `TasksUsersAdapter`, `TasksPresenceAdapter` |
| [`src/ai-task-agent.ts`](../src/ai-task-agent.ts) | 720 | `setAiTaskModelCaller`, `hasAiAgentModel`, `aiTaskModel`, `aiTaskMaxSteps`, `aiTaskTimeoutMs`, `aiTaskMaxTokens`, `aiWebHostAllowed`, `AskHumanFn` |
| [`src/ai-task-runner.ts`](../src/ai-task-runner.ts) | 700 | `aiRunnerEnabled`, `hostBridgeReady`, `resolveHostTargetUserId`, `checkAiRunQuotas`, `enqueueAiRunForTask`, `processAiTaskQueue`, `recoverInterruptedRuns`, `parseRecurringSchedule` |
| [`src/api-mount.ts`](../src/api-mount.ts) | 101 | `createTasksApiMount` |
| [`src/assistant-adapter.ts`](../src/assistant-adapter.ts) | 113 | `createAssistantTasksAdapter` |
| [`src/brand/config.ts`](../src/brand/config.ts) | 227 | `TasksUserKind`, `TasksUser`, `TasksSession`, `TasksSqliteStatement`, `TasksSqliteDb`, `TasksDbAdapter`, `TasksUsersAdapter`, `TasksPresenceAdapter` |
| [`src/env-bridge.ts`](../src/env-bridge.ts) | 43 | `upsertKitPlatformTask` |
| [`src/hono-routes.ts`](../src/hono-routes.ts) | 627 | `createTasksHonoRoutes` |
| [`src/index.ts`](../src/index.ts) | 171 | `PLATFORM_TASKS_CORE_SQL`, `createMemoryTasksStore`, `createSqliteTasksStore`, `openNodeSqliteDatabase`, `createTasksApiMount`, `upsertKitPlatformTask`, `configureTasksBrand`, `getTasksBrandConfig` |
| [`src/kanban-service.ts`](../src/kanban-service.ts) | 740 | `TASK_STATUSES`, `TaskStatus`, `EXECUTOR_KINDS`, `ExecutorKind`, `KANBAN_COLUMNS`, `TaskSource`, `TaskRow`, `Task` |
| [`src/mcp-host-tools.ts`](../src/mcp-host-tools.ts) | 376 | `CREEZIO_AI_TASK_HOST_MCP_TOOL_NAMES`, `CreezioAiTaskHostMcpToolName`, `CREEZIO_LIST_TASKS_MCP_TOOL_NAME`, `AiTaskHostMcpToolConfig`, `AiTaskHostMcpRegisterFn`, `CreateAiTaskHostMcpToolsOptions`, `createAiTaskHostMcpTools` |
| [`src/memory-store.ts`](../src/memory-store.ts) | 75 | `createMemoryTasksStore` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 39 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | 160 | `SqliteTasksStore`, `CreateSqliteTasksStoreOptions`, `createSqliteTasksStore` |
| [`src/task-runs.ts`](../src/task-runs.ts) | 570 | `RUN_STATUSES`, `RunStatus`, `TaskRunRow`, `AgentLogLevel`, `AgentSessionLog`, `AgentLogEvent`, `subscribeAgentLogs`, `subscribeTaskRuns` |
| [`src/types.ts`](../src/types.ts) | 54 | `PlatformTaskStatus`, `PlatformTask`, `PlatformTasksStore`, `PLATFORM_TASKS_CORE_SQL` |
| [`ui/ai-activity-panel.tsx`](../ui/ai-activity-panel.tsx) | 560 | `AiActivityPanel`, `__parseSseChunkForTests` |
| [`ui/index.ts`](../ui/index.ts) | 8 | — |
| [`ui/task-detail-sheet.tsx`](../ui/task-detail-sheet.tsx) | 669 | `TaskDetailSheet` |
| [`ui/tasks-kanban-client.tsx`](../ui/tasks-kanban-client.tsx) | 648 | `TasksKanbanClient` |
| [`ui/tasks-types.ts`](../ui/tasks-types.ts) | 121 | `TaskAssignee`, `TaskCard`, `KANBAN_COLUMNS`, `ColumnKey`, `STATUS_META`, `EXECUTOR_META`, `sourceLabel`, `previewBrief` |

---

## Détail par fichier

### `scripts/port-from-tempoflow.mjs`

- **Lignes** : 406
- **Exports** : `TasksUserKind`, `TasksUser`, `TasksSession`, `TasksSqliteStatement`, `TasksSqliteDb`, `TasksDbAdapter`, `TasksUsersAdapter`, `TasksPresenceAdapter`, `TasksWorkspaceAdapter`, `TasksNavAdapter`, `ResolvedExternalTab`, `TasksExternalTabsAdapter`, `TasksScreencastAdapter`, `TasksAuthAdapter`, `TasksBrandConfig`, `configureTasksBrand`, `getTasksBrandConfig`, `requireTasksBrand`, `resetTasksBrandForTests`, `tasksEnv`, `tasksEnvNumber`, `Task`

One-shot port TempoFlow gold → @creezio/tasks (platform-generic).
Run from packages/tasks: node scripts/port-from-tempoflow.mjs

### `src/ai-task-agent.ts`

- **Lignes** : 720
- **Exports** : `setAiTaskModelCaller`, `hasAiAgentModel`, `aiTaskModel`, `aiTaskMaxSteps`, `aiTaskTimeoutMs`, `aiTaskMaxTokens`, `aiWebHostAllowed`, `AskHumanFn`, `AiTaskAgentContext`, `buildAiTaskTools`, `AiTaskAgentOutcome`, `runAiTaskAgent`

Agent LLM d'un collaborateur IA — exécute une tâche du kanban dans SON
workspace Electron (partition dédiée, fake-cursor visible via « Voir
comme IA »), avec les ACL de SON persona (jamais celles de l'owner).
Outils : navigation CRM, inspection/action UI (UiDriver), onglets web,
délégation Hermes (sous-tâche), HITL, fin de tâche explicite (D4 :
`done` seulement sur finish_task(success=true)).

### `src/ai-task-runner.ts`

- **Lignes** : 700
- **Exports** : `aiRunnerEnabled`, `hostBridgeReady`, `resolveHostTargetUserId`, `checkAiRunQuotas`, `enqueueAiRunForTask`, `processAiTaskQueue`, `recoverInterruptedRuns`, `parseRecurringSchedule`, `processRecurringAiTasks`, `ensureAiRunnerLoop`, `getAiActivityForUser`, `retryFailedRun`

Runner host — exécute les tâches assignées à un collaborateur IA via la
boucle LLM (ai-task-agent). Persona ACL = user AI ; surface = workspace
Electron dédié (pas l'espace owner). Desktop bridge = host owner.
Honnêteté des statuts (D4) : un run sans bridge desktop, sans LLM ou sans
`finish_task(success=true)` est `failed` — jamais de succès de complaisance.

### `src/api-mount.ts`

- **Lignes** : 101
- **Exports** : `createTasksApiMount`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/assistant-adapter.ts`

- **Lignes** : 113
- **Exports** : `createAssistantTasksAdapter`

Adapter create_task / list_tasks pour @creezio/assistant.
Branché via configureAssistantBrand({ tasks: createAssistantTasksAdapter() }).

### `src/brand/config.ts`

- **Lignes** : 227
- **Exports** : `TasksUserKind`, `TasksUser`, `TasksSession`, `TasksSqliteStatement`, `TasksSqliteDb`, `TasksDbAdapter`, `TasksUsersAdapter`, `TasksPresenceAdapter`, `TasksWorkspaceAdapter`, `TasksNavAdapter`, `ResolvedExternalTab`, `TasksExternalTabsAdapter`, `ScreencastFrame`, `TasksScreencastAdapter`, `TasksAuthAdapter`, `TasksBrandConfig`, `configureTasksBrand`, `getTasksBrandConfig`, `requireTasksBrand`, `resetTasksBrandForTests`, `tasksEnv`, `tasksEnvNumber`

Configuration marque pour le runtime tasks plateforme.
Les marques appellent `configureTasksBrand` au boot (server / instrumentation).

### `src/env-bridge.ts`

- **Lignes** : 43
- **Exports** : `upsertKitPlatformTask`

Bridge tasks marque → SoT kit (même UUID) — M8.

### `src/hono-routes.ts`

- **Lignes** : 627
- **Exports** : `createTasksHonoRoutes`

API Kanban unifié « Tâches » — exécutants human / ai / hermes,
runs IA (poll + SSE) et synchronisation Hermes.
Factory : les marques montent `createTasksHonoRoutes()` sous /api/v1/tasks.

### `src/index.ts`

- **Lignes** : 171
- **Exports** : `PLATFORM_TASKS_CORE_SQL`, `createMemoryTasksStore`, `createSqliteTasksStore`, `openNodeSqliteDatabase`, `createTasksApiMount`, `upsertKitPlatformTask`, `configureTasksBrand`, `getTasksBrandConfig`, `requireTasksBrand`, `resetTasksBrandForTests`, `tasksEnv`, `tasksEnvNumber`, `createTask`, `deleteTask`, `EXECUTOR_KINDS`, `getTask`, `getTaskByHermesId`, `getTaskByIdempotency`, `getTaskDetail`, `hermesToTaskStatus`, `KANBAN_COLUMNS`, `listRecurringAiTasks`, `listSubtasks`, `listTasks`, `setTaskNextRun`, `syncHermesTasks`, `TASK_STATUSES`, `tasksByColumn`, `tasksReady`, `tasksRecurrenceReady`, `taskToHermesStatus`, `updateTask`, `updateTaskLocal`, `appendAgentLog`, `bumpRunStepCount`, `cancelTaskRun`, `claimNextQueuedRun`, `clearHitlResponse`, `countRunningRuns`, `countRunsCreatedToday`

@creezio/tasks — tâches plateforme (kanban human/ai/hermes + runs + AI).
Distinct de PluginTaskRecord (@creezio/product-hub).

### `src/kanban-service.ts`

- **Lignes** : 740
- **Exports** : `TASK_STATUSES`, `TaskStatus`, `EXECUTOR_KINDS`, `ExecutorKind`, `KANBAN_COLUMNS`, `TaskSource`, `TaskRow`, `Task`, `hermesToTaskStatus`, `taskToHermesStatus`, `tasksReady`, `listTasks`, `tasksByColumn`, `getTask`, `getTaskByHermesId`, `getTaskByIdempotency`, `listSubtasks`, `CreateTaskInput`, `createTask`, `UpdateTaskInput`, `updateTask`, `updateTaskLocal`, `tasksRecurrenceReady`, `listRecurringAiTasks`, `setTaskNextRun`, `deleteTask`, `syncHermesTasks`, `getTaskDetail`

Kanban unifié « Tâches » (schéma tasks plateforme) — une tâche a un exécutant :
- `human`  : collaborateur humain (kanban simple)
- `ai`     : collaborateur IA (runs `task_runs` + workspace Electron dédié)
- `hermes` : agent central Hermes (carte kanban WebUI, sync bidirectionnelle)
Remplace `cabinet-tasks.ts` et `todo-queries.ts`.

### `src/mcp-host-tools.ts`

- **Lignes** : 376
- **Exports** : `CREEZIO_AI_TASK_HOST_MCP_TOOL_NAMES`, `CreezioAiTaskHostMcpToolName`, `CREEZIO_LIST_TASKS_MCP_TOOL_NAME`, `AiTaskHostMcpToolConfig`, `AiTaskHostMcpRegisterFn`, `CreateAiTaskHostMcpToolsOptions`, `createAiTaskHostMcpTools`

D-P18 — tools MCP host-only pour workflows tâches IA.
Partagé TF/CV (ex-jumeaux hono-host-tools). Métier marque reste hors kit.
Prérequis : `configureTasksBrand()` déjà appelé (users + runtime kanban).

### `src/memory-store.ts`

- **Lignes** : 75
- **Exports** : `createMemoryTasksStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/sqlite-driver.ts`

- **Lignes** : 39
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal — @creezio/tasks (I3). 
import { createRequire } from "node:module";
import path from "node:path";

export type SqliteStatement = {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
};

export type SqliteDatabase = {
  exec(sql: string): unknown;

### `src/sqlite-store.ts`

- **Lignes** : 160
- **Exports** : `SqliteTasksStore`, `CreateSqliteTasksStoreOptions`, `createSqliteTasksStore`

Store tasks plateforme — sqlite **core** (Phase I3).

### `src/task-runs.ts`

- **Lignes** : 570
- **Exports** : `RUN_STATUSES`, `RunStatus`, `TaskRunRow`, `AgentLogLevel`, `AgentSessionLog`, `AgentLogEvent`, `subscribeAgentLogs`, `subscribeTaskRuns`, `taskRunsReady`, `taskRunsHitlReady`, `taskRunsTokensReady`, `countRunsCreatedToday`, `sumUsageTokensToday`, `getTaskRun`, `listTaskRunsForTask`, `getActiveRunForAssignee`, `countRunningRuns`, `listRunningRuns`, `getRunningRun`, `maxConcurrentAiRuns`, `enqueueTaskRun`, `claimNextQueuedRun`, `finishTaskRun`, `setHitlPrompt`, `resumeHitlRun`, `clearHitlResponse`, `cancelTaskRun`, `bumpRunStepCount`, `appendAgentLog`, `listAgentLogs`, `purgeAgentLogsOlderThan`, `isHitlPaused`

Runs d'exécution des tâches IA + logs session agent.

### `src/types.ts`

- **Lignes** : 54
- **Exports** : `PlatformTaskStatus`, `PlatformTask`, `PlatformTasksStore`, `PLATFORM_TASKS_CORE_SQL`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/ai-activity-panel.tsx`

- **Lignes** : 560
- **Exports** : `AiActivityPanel`, `__parseSseChunkForTests`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 8

@creezio/tasks/ui — kanban / détail / activité IA (O9, gold TF).

### `ui/task-detail-sheet.tsx`

- **Lignes** : 669
- **Exports** : `TaskDetailSheet`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/tasks-kanban-client.tsx`

- **Lignes** : 648
- **Exports** : `TasksKanbanClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/tasks-types.ts`

- **Lignes** : 121
- **Exports** : `TaskAssignee`, `TaskCard`, `KANBAN_COLUMNS`, `ColumnKey`, `STATUS_META`, `EXECUTOR_META`, `sourceLabel`, `previewBrief`

Types + méta UI du kanban unifié « Tâches » (API /api/v1/tasks). 

export type TaskAssignee = {
  id: string;
  username: string;
  kind: "human" | "ai";
};

export type TaskCard = {
  id: string;
  title: string;
  body: string;
  status: string;
  position: number;
  executor_kind: "human" | "ai" | "hermes";
  assignee_user_id: string | null;
  assignee?: TaskAssignee | null;
  parent_task_id: string | null;
  created_by: string | null;
  priority: number;
  hermes_task_id: string | null;
  hermes_status: string | null;
  recurring_schedule: string | null;
  source: string;
  result: string 

