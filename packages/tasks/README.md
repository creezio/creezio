# `@creezio/tasks`

Tâches **plateforme** unifiées (kanban human / AI / Hermes + runs + agent IA).

Distinct des Plugin tasks Product Hub.

## Capacités

| Surface | Export |
|---------|--------|
| Store mince core (`creezio_platform_tasks`) | `createSqliteTasksStore`, `createTasksApiMount` |
| Kanban brand DB (`tasks`) | `createTask`, `listTasks`, `syncHermesTasks`, … |
| Runs / logs / HITL | `enqueueTaskRun`, `appendAgentLog`, … |
| Agent + runner IA | `runAiTaskAgent`, `ensureAiRunnerLoop`, … |
| Routes Hono `/api/v1/tasks` | `createTasksHonoRoutes()` |
| Adapter assistant | `createAssistantTasksAdapter()` |
| MCP host AI tools (D-P18) | `createAiTaskHostMcpTools()` |
| UI | `@creezio/tasks/ui` → `TasksKanbanClient` |


## Wire sites externes (P29 / ADR)

L'agent IA (`web_*` tools) émet des actions desktop en **`external_*`** (SoT).
Alias déprécié TF `supplier_*` encore accepté par `@creezio/electron-shell`
(`ai_workspace_web_action` + browser-tab-driver). Préférer `siteId` /
`site_id` dans les adaptateurs `externalTabs` ; `fournisseurId` /
`fournisseur_id` = miroir déprécié.

## Boot marque (obligatoire)

```ts
import {
  configureTasksBrand,
  createTasksHonoRoutes,
  createAssistantTasksAdapter,
  recoverInterruptedRuns,
  ensureAiRunnerLoop,
} from "@creezio/tasks";

configureTasksBrand({
  productName: "TempoFlow",
  productDomain: "CRM achats restauration",
  hermesSourceLabel: "TempoFlow CRM",
  hermesSkill: "tempoflow2-crm",
  envPrefix: "TF2_AI",
  idempotencyPrefix: "crm",
  assistantIdempotencyPrefix: "asst",
  taskHref: "/taches",
  examplePaths: ["/produits", "/marketplaces", "/panier"],
  db: { getWriteDb, queryAll, queryOne, tableExists },
  users: { getById: getUserById, list: listUsers, getOwner, ready: usersReady },
  presence: { isDesktopOnline, listOnlineBridges },
  workspace: { /* ensure/navigate/openTab/listTabs/webAction/screencast */ },
  navigation: { permissionForPath, hasPermission },
  externalTabs: { resolve: resolveOpenTabRequest, toWorkspaceParams: toSupplierOpenTabParams },
  screencast: { viewerCount: screencastViewerCount, subscribe: subscribeScreencast },
  auth: { getSessionFromContext, sessionActorIsOwner, sessionIsImpersonating },
});

// instrumentation / server boot
recoverInterruptedRuns();
ensureAiRunnerLoop();
```

## MCP host tools AI (D-P18)

Les tools `list_ai_collaborators` / `create_ai_task` / `get_ai_task` /
`get_ai_run_logs` / `answer_ai_question` (et optionnellement `list_tasks`)
vivent dans le kit — plus de jumeau TF/CV dans `hono-host-tools.ts`.

```ts
import {
  CREEZIO_AI_TASK_HOST_MCP_TOOL_NAMES,
  createAiTaskHostMcpTools,
} from "@creezio/tasks";
import "@/lib/configure-tasks";

createAiTaskHostMcpTools({
  registerTool: (name, config, handler) =>
    registerMcpTool(server, ctx, name, config, handler),
  getActorUserId: () => ctx.userId,
  includeListTasks: false, // true côté Certivan
});
```

Reste en marque : `open_external_tab` (+ `list_tools_by_space` TF) et le métier
façade.

## Montage API

```ts
// server/routes/tasks.ts — stub ≤ 40 LOC
import { createTasksHonoRoutes } from "@creezio/tasks";
import "@/lib/configure-tasks"; // side-effect configureTasksBrand

export const tasksRoutes = createTasksHonoRoutes();
```

```ts
// server/app.ts
api.use("/tasks", requireSessionOrTasksApiKey);
api.use("/tasks/*", requireSessionOrTasksApiKey);
api.route("/tasks", tasksRoutes);
```

Le mount Electron mince reste inchangé :

```ts
api.registerModuleApi("platform-tasks", createTasksApiMount(tasks));
```

## Page `/taches`

```tsx
import { AppShell } from "@creezio/shell-ui/ui";
import { TasksKanbanClient } from "@creezio/tasks/ui";

export default function TachesPage() {
  return (
    <AppShell title="Tâches" subtitle="Humains, collaborateurs IA et Hermes.">
      <TasksKanbanClient />
    </AppShell>
  );
}
```

## Fichiers marque à supprimer (cutover)

**TempoFlow / Certivan**

- `crm/src/lib/tasks.ts`
- `crm/src/lib/task-runs.ts`
- `crm/src/lib/ai-task-agent.ts`
- `crm/src/lib/ai-task-runner.ts`
- `crm/src/server/routes/tasks.ts` (ou stub délégant ≤ ~40 LOC)
- `crm/src/lib/assistant/tasks-adapter.ts` (remplacé par `createAssistantTasksAdapter`)

**Fidu**

- `crm/src/lib/cabinet-tasks.ts`
- `crm/src/components/tasks/taches-kanban-client.tsx`
- `crm/src/lib/task-runs.ts`
- `crm/src/lib/ai-task-runner.ts`
- routes tasks grasses (même règle stub)
- adapter local superflu

## Env AI (préfixe marque)

Avec `envPrefix: "TF2_AI"` :

- `TF2_AI_MODEL`, `TF2_AI_MAX_STEPS`, `TF2_AI_RUN_TIMEOUT_MS`, `TF2_AI_MAX_TOKENS`
- `TF2_AI_WEB_ALLOWED_HOSTS`, `TF2_AI_RUNNER_ENABLED`, `TF2_AI_HITL`
- `TF2_AI_MAX_CONCURRENT`, `TF2_AI_MAX_RUNS_PER_DAY`, `TF2_AI_MAX_TOKENS_PER_DAY`
