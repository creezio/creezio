# AGENTS — @creezio/tasks

## Mission

Maintenir les tâches plateforme : kanban human/ai/hermes, runs IA, API Hono, adapter assistant, MCP host tools et UI. Le package doit rester générique et déléguer tout contexte métier à `configureTasksBrand`.

## Ne pas faire

- Ne pas importer de code marque (`@/lib/*`, stores CRM spécifiques, routes Next).
- Ne pas contourner les invariants d'exécutant/assigné.
- Ne pas exécuter une tâche IA avec les droits owner si l'assigné est un collaborateur IA.
- Ne pas marquer un run réussi si desktop, LLM ou `finish_task(success=true)` manquent.
- Ne pas exposer les tools MCP host sans contrôle actor owner.
- Ne pas toucher à `docs/FILES.md` sauf demande explicite.

## Points d'entrée

- `src/index.ts` : surface publique.
- `src/brand/config.ts` : `configureTasksBrand` et adapters marque.
- `src/kanban-service.ts` : CRUD kanban, invariants, sync Hermes.
- `src/task-runs.ts` : runs, logs, HITL, quotas.
- `src/ai-task-agent.ts` : boucle agent LLM.
- `src/ai-task-runner.ts` : orchestration host.
- `src/hono-routes.ts` : API `/api/v1/tasks`.
- `src/api-mount.ts` : surface `ApiMount` plateforme.
- `src/assistant-adapter.ts` : bridge assistant.
- `src/mcp-host-tools.ts` : tools MCP host-only.
- `ui/tasks-kanban-client.tsx` : board React.
- `ui/task-detail-sheet.tsx` : détail/logs/runs.
- `ui/ai-activity-panel.tsx` : activité IA live.

## Modifier sans casser

- Garder les statuts `backlog`, `in_progress`, `blocked`, `done`, `cancelled`.
- Garder les exécutants `human`, `ai`, `hermes`.
- Préserver les mappings Hermes dans `hermesToTaskStatus` et `taskToHermesStatus`.
- Toute nouvelle colonne SQL doit être tolérée par les reads existants.
- Les endpoints session-only ne doivent pas devenir accessibles par API key sans décision explicite.
- Les SSE doivent garder `ready`, `ping`, `run`, `log` ou documenter toute évolution.
- Les logs agent doivent rester utiles pour diagnostiquer un échec sans contenir de secrets.

## Config brand

`configureTasksBrand` doit fournir :

- `productName`, `productDomain`, `hermesSourceLabel`, `hermesSkill` ;
- `envPrefix`, `idempotencyPrefix`, `assistantIdempotencyPrefix`, `taskHref`, `examplePaths` ;
- `db`, `users`, `presence`, `workspace`, `navigation`, `externalTabs`, `screencast`, `auth`.

Variables lues via `envPrefix` :

- `*_RUNNER_ENABLED`
- `*_MAX_RUNS_PER_DAY`
- `*_MAX_TOKENS_PER_DAY`
- `*_HITL`
- variables modèle/limites du runner selon `ai-task-agent`.

## Tests/gates

```bash
npm run typecheck -w @creezio/tasks
npm run build -w @creezio/tasks
```

Vérifications hôte utiles :

- `GET /api/v1/tasks/meta` retourne `ready: true`.
- création `human`, `ai`, `hermes` applique les invariants.
- `POST /:id/launch` enfile un run IA.
- `GET /runs/:runId/stream` émet logs et updates.
- MCP `create_ai_task` refuse un actor non owner.
- le board UI poll et synchronise Hermes sans boucle d'erreurs.

## Fichiers sensibles

- `src/kanban-service.ts` : invariants, statut, sync Hermes.
- `src/ai-task-runner.ts` : honnêteté des statuts, quotas, desktop bridge.
- `src/ai-task-agent.ts` : prompts/tools IA.
- `src/task-runs.ts` : état des runs et logs.
- `src/hono-routes.ts` : auth et endpoints publics.
- `src/mcp-host-tools.ts` : surface MCP host.
- `src/brand/config.ts` : contrat marque.

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
