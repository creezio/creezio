# `@creezio/tasks`

Tâches **natives plateforme** (todo utilisateur) — distinctes des
`PluginTaskRecord` Product Hub.

Montage api-kernel : `registerModuleApi("platform-tasks", …)` via
`createTasksApiMount`.

```ts
import { createMemoryTasksStore, createTasksApiMount } from "@creezio/tasks";
import { createApiKernel } from "@creezio/api-kernel";

const store = createMemoryTasksStore();
const api = createApiKernel();
api.registerModuleApi("platform-tasks", createTasksApiMount(store));
```
