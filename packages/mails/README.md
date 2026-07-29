# `@creezio/mails`

Mails **natifs plateforme** — boîte / envoi générique. **Pas** de templates
TempoFlow/Fidu.

## Stores

- `createMemoryMailsStore` — tests
- `createSqliteMailsStore({ coreDbPath })` — **I3**, tables `PLATFORM_MAILS_CORE_SQL`

## Providers

| Id | Rôle |
|----|------|
| `platform-stub` | Toujours présent (tests sans I/O) |
| `file-sink` | **Non-stub I3** — écrit JSON dans un dossier (`createFileSinkMailProvider`) |

```ts
import {
  createSqliteMailsStore,
  createFileSinkMailProvider,
  createMailsApiMount,
  FILE_SINK_PROVIDER_ID,
} from "@creezio/mails";

const store = createSqliteMailsStore({
  coreDbPath: runtime.paths.core,
  defaultProviderId: FILE_SINK_PROVIDER_ID,
});
store.registerProvider(
  createFileSinkMailProvider({ outDir: path.join(userData, "mail-outbox") }),
);
const draft = store.createDraft({
  userId: "u1",
  to: "a@b.c",
  subject: "Hi",
});
await store.queueSend(draft.id, "u1"); // → fichier JSON + status sent
```

SMTP / API marque : implémenter `MailProvider` et `registerProvider` —
pas de templates dans ce package.
