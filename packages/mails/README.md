# `@creezio/mails`

Mails **natifs plateforme** — boîte de réception + envoi générique + pièces jointes.
**Pas** de templates TempoFlow/Fidu.

> SoT unique : messages inbound/outbound + PJ vivent dans `core.db`
> (`creezio_platform_mails` / `creezio_platform_mail_attachments`).
> Les marques ne réimplémentent plus `email-queries` / `mail-inbox` / routes grasses.

## Capacités

| Surface | Export |
|---------|--------|
| Store sqlite / memory | `createSqliteMailsStore`, `createMemoryMailsStore` |
| API module (draft/send) | `createMailsApiMount` |
| API inbox Hono | `createEmailInboxRoutes` → `POST /inbound`, `GET /meta`, list/get/patch/delete, PJ |
| Config marque | `configureMails({ rootDomain, uiEnabled, … })` |
| UI | `@creezio/mails/ui` → `MailInbox` |
| Worker CF | `email-worker/` (domaines via env) |
| Migration | `migrateBrandEmailsToKit(brandDb, kitDb)` |

## Intégration marque (contrat mince)

```ts
// boot serveur (une fois)
import {
  configureMails,
  createEmailInboxRoutes,
  FILE_SINK_PROVIDER_ID,
  createFileSinkMailProvider,
  createMailsApiMount,
  createSqliteMailsStore,
} from "@creezio/mails";

configureMails({
  rootDomain: "tempoflow.fr", // ou certivan.creez.io / fidu.creez.io
  inboundSecretEnvKeys: ["EMAIL_INBOUND_SECRET", "TF2_EMAIL_INBOUND_SECRET"],
  uiEnabled: true, // Fidu : false pour feature-off documenté
  pageSubtitle: "Boîte de réception locale — *@slug.mail.tempoflow.fr",
});

// Electron brand-runtime (déjà typique)
const mails = createSqliteMailsStore({
  coreDbPath: runtime.paths.core,
  defaultProviderId: FILE_SINK_PROVIDER_ID,
});
mails.registerProvider(createFileSinkMailProvider({ outDir: mailOutDir }));
api.registerModuleApi("platform-mails", createMailsApiMount(mails));

// Hono app.ts — auth session côté marque ; inbound bypass session
api.route("/email", createEmailInboxRoutes());
```

```tsx
// src/app/mails/page.tsx
import { AppShell } from "@creezio/shell-ui/ui";
import { MailInbox } from "@creezio/mails/ui";
import { resolvePageSubtitle } from "@creezio/mails";

export default function MailsPage() {
  return (
    <AppShell kind="section" title="Mails" subtitle={resolvePageSubtitle()}>
      <MailInbox />
    </AppShell>
  );
}
```

Env process Next (injecté Electron) :
- `CREEZIO_CORE_DB_PATH` — SoT inbox
- `EMAIL_DOMAIN` / `APP_PUBLIC_URL` — domaine public
- `EMAIL_INBOUND_SECRET` (+ alias marque)

## Fidu — UI on/off

Capacité **native** (store + API) toujours montée.
Pour masquer l’UI :

```ts
configureMails({ rootDomain: "fidu.creez.io", uiEnabled: false });
// + ne pas exposer /mails (ou page qui redirige)
```

Ce n’est **pas** un reclassement « mails = métier Fidu ».

## Migration depuis tables marque `emails`

1. **Cutover clean** (recommandé instances neuves) : inbound écrit uniquement le kit ;
   tables marque `emails` / `email_attachments` deviennent inertes (migration historique
   034 peut rester pour ne pas casser le versioning).
2. **One-shot données existantes** :

```ts
import { migrateBrandEmailsToKit, createSqliteMailsStore } from "@creezio/mails";

const kit = createSqliteMailsStore({ coreDbPath: corePath });
const result = migrateBrandEmailsToKit(brandDb, kit.db);
// { migrated, skipped, errors }
```

Idempotent via `message_id` / `brand_email_id`.

## Extinction TF / CV (liste)

Supprimer après sync vendor :
- `crm/src/components/mail/mail-inbox.tsx`
- `crm/src/lib/email-queries.ts`
- routes email grasses → stub ≤40 LOC `createEmailInboxRoutes`
- `crm/scripts/email-worker/*` forké → pointer / documenter worker kit

## Worker Cloudflare

Voir [`email-worker/README.md`](./email-worker/README.md).
Domaines injectés (`MAIL_ROOT_DOMAIN`) — **aucun** `tempoflow.fr` /
`certivan.creez.io` hardcodé dans le package.

## Providers d'envoi

| Id | Rôle |
|----|------|
| `platform-stub` | Tests sans I/O |
| `file-sink` | Écrit JSON dans un dossier |

SMTP / API marque : implémenter `MailProvider` + `registerProvider`.
