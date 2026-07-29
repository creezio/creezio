# `@creezio/tasks`

Tâches **plateforme** (distinctes des Plugin tasks Product Hub).

```ts
import {
  createSqliteTasksStore,
  createTasksApiMount,
  PLATFORM_TASKS_CORE_SQL,
} from "@creezio/tasks";

const store = createSqliteTasksStore({ coreDbPath: runtime.paths.core });
store.create({ userId: "u1", title: "Todo" });
```

- Mémoire : `createMemoryTasksStore`
- SQLite core : `createSqliteTasksStore` (I3)
- Mount API : `createTasksApiMount(store)` → `/api/v1/core/tasks` (via api-kernel)
