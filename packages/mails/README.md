# @creezio/mails

## Rôle

`@creezio/mails` fournit la capacité mails native Creezio :

- store plateforme pour brouillons, queue d'envoi et mails inbound ;
- boîte de réception générique avec pièces jointes ;
- routes Hono `/email` pour inbound, meta, liste, détail, lecture/suppression ;
- `ApiMount` mince pour drafts/list/send ;
- provider local `file-sink` pour tests/CI ;
- UI `MailInbox` ;
- worker Cloudflare Email Routing dans `email-worker/`.

Le package ne contient aucun template métier ni domaine marque hardcodé.

## Périmètre kit vs marque

**Kit**

- Définit le schéma `creezio_platform_mails` et `creezio_platform_mail_attachments`.
- Indexe les mails inbound et pièces jointes en base kit.
- Expose `configureMails` pour dériver domaine, secret inbound et textes UI.
- Fournit `createEmailInboxRoutes` et `createMailsApiMount`.
- Fournit `createFileSinkMailProvider` pour un envoi non-stub en fichier JSON.
- Fournit le worker Cloudflare générique.

**Marque**

- Appelle `configureMails` avec `rootDomain`, secrets et préférences UI.
- Monte `createEmailInboxRoutes()` sous `/api/v1/email`.
- Fournit/migre le store SQLite kit via `getKitMailsStore` ou `createSqliteMailsStore`.
- Déploie/configure le worker Cloudflare et les MX.
- Enregistre un vrai provider SMTP/API si l'envoi sortant doit quitter le file-sink.
- Protège les routes UI par auth côté montage.

## Installation/build

```bash
npm run build -w @creezio/mails
npm run typecheck -w @creezio/mails
npm run test:inbox -w @creezio/mails
```

Exports :

- `@creezio/mails` : config, stores, providers, routes, queries inbox, migration.
- `@creezio/mails/ui` : `MailInbox`.
- `email-worker/` : worker Cloudflare et bootstrap de déploiement.

## Configuration détaillée

### `configureMails`

```ts
import { configureMails } from "@creezio/mails";

configureMails({
  rootDomain: "example.com",
  pageSubtitle: "Boîte de réception locale",
  emptyStateNoDomainHint: "Réservez un tunnel pour activer l'adresse mail.",
  uiEnabled: true,
  inboundSecretEnvKeys: ["EMAIL_INBOUND_SECRET", "BRAND_EMAIL_INBOUND_SECRET"],
  mailSubdomain: "mail",
});
```

Champs :

- `rootDomain` : domaine racine public (`{slug}.{rootDomain}`).
- `mailSubdomain` : sous-domaine mail, défaut `mail`, pour `{slug}.mail.{rootDomain}`.
- `pageSubtitle` : texte UI optionnel.
- `emptyStateNoDomainHint` : hint quand aucun domaine mail n'est résolu.
- `uiEnabled` : permet à une marque de cacher l'UI sans retirer la capacité.
- `inboundSecretEnvKeys` : liste de variables candidates pour le secret inbound.

### Résolution domaine

`resolveEmailDomain()` :

1. utilise `EMAIL_DOMAIN` si présent ;
2. sinon dérive depuis `APP_PUBLIC_URL` ou `MCP_PUBLIC_URL` ;
3. transforme `{slug}.{rootDomain}` en `{slug}.{mailSubdomain}.{rootDomain}`.

### Secret inbound

`resolveInboundSecret()` lit le premier env non vide de `inboundSecretEnvKeys`. Défaut : `EMAIL_INBOUND_SECRET`.

### Providers

`PlatformMailsStore.registerProvider` accepte un `MailProvider` :

```ts
import {
  FILE_SINK_PROVIDER_ID,
  createFileSinkMailProvider,
} from "@creezio/mails";

store.registerProvider(
  createFileSinkMailProvider({
    outDir: "/tmp/mails-out",
    id: FILE_SINK_PROVIDER_ID,
  }),
);
```

Un provider SMTP/API marque doit implémenter :

```ts
type MailProvider = {
  id: string;
  send(mail: PlatformMail): Promise<{ ok: boolean; error?: string }>;
};
```

### Env

- `EMAIL_DOMAIN` : domaine mail exact.
- `APP_PUBLIC_URL` ou `MCP_PUBLIC_URL` : source du slug public.
- `EMAIL_INBOUND_SECRET` ou clés déclarées dans `inboundSecretEnvKeys`.
- Env worker : voir [email-worker/README.md](./email-worker/README.md).

## API publique avec exemples

### Routes inbox Hono

```ts
import { Hono } from "hono";
import { configureMails, createEmailInboxRoutes } from "@creezio/mails";

configureMails({
  rootDomain: "example.com",
  inboundSecretEnvKeys: ["EMAIL_INBOUND_SECRET", "BRAND_EMAIL_INBOUND_SECRET"],
});

const api = new Hono();
api.route("/email", createEmailInboxRoutes());
```

Endpoints sous `/email` :

- `POST /inbound` : ingestion worker, auth `Authorization: Bearer <secret>` ou `x-email-inbound-secret`.
- `GET /meta` : ready, domaine, secret configuré, UI enabled, textes.
- `GET /` : liste inbox (`q`, `folder`, `unread=1`, `limit`, `offset`).
- `GET /:id` : détail.
- `GET /:id/attachments/:attId` : téléchargement PJ.
- `PATCH /:id` : `{ read: boolean }`.
- `DELETE /:id` : suppression.

Exemple inbound :

```bash
curl -X POST "$APP/api/v1/email/inbound" \
  -H "Authorization: Bearer $EMAIL_INBOUND_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "<msg-1@example.com>",
    "from": "client@example.com",
    "to": "contact@demo.mail.example.com",
    "subject": "Bonjour",
    "text": "Message entrant",
    "attachments": []
  }'
```

### `ApiMount` drafts/send

```ts
import { createMailsApiMount, createSqliteMailsStore } from "@creezio/mails";

const store = createSqliteMailsStore({ db });
const mount = createMailsApiMount(store);
```

Surface mince :

- `GET /list` ou `GET /`
- `POST /draft` ou `POST /`
- `POST /:uuid/send`

L'acteur vient de `x-creezio-user-id` ou `body.userId`.

### Requêtes inbox directes

```ts
import {
  ensureMailsInboxSchema,
  insertInboundEmail,
  listInboxEmails,
} from "@creezio/mails";

ensureMailsInboxSchema(db);

insertInboundEmail(db, {
  from: "client@example.com",
  to: "contact@demo.mail.example.com",
  subject: "Question",
  text: "Bonjour",
});

const inbox = listInboxEmails(db, { q: "Question", unreadOnly: true });
```

### UI

```tsx
import { MailInbox } from "@creezio/mails/ui";

export default function MailsPage() {
  return <MailInbox apiBase="/api/v1/email" />;
}
```

## Flux

### Inbound Cloudflare

1. Cloudflare Email Routing reçoit un mail catch-all.
2. `email-worker/worker.js` parse destinataire, MIME, texte/html et pièces jointes.
3. Le worker poste vers `https://{slug}.{root}/api/v1/email/inbound`.
4. `createEmailInboxRoutes` vérifie le secret partagé.
5. Le store insère le mail et les pièces jointes, avec déduplication par `message_id`.
6. `MailInbox` liste, marque lu/non lu, télécharge les pièces jointes et supprime.

Voir le détail opérationnel dans [email-worker/README.md](./email-worker/README.md).

### Envoi sortant

1. La marque crée un draft via store ou `ApiMount`.
2. `queueSend` choisit un provider enregistré.
3. `file-sink` écrit un JSON local ; un provider marque peut appeler SMTP/API.
4. Le statut passe `queued`, `sent` ou `failed` selon le provider.

## Intégration marques

- Appeler `configureMails` au boot serveur.
- Monter `/api/v1/email` avec auth UI côté marque, tout en laissant `/inbound` accessible au worker avec secret.
- Déployer le worker Cloudflare avec les mêmes secrets que l'app.
- Créer les DNS/MX `{slug}.mail.{root}` via le provisioner tunnel marque.
- Utiliser `migrateBrandEmailsToKit` pour basculer une ancienne table marque vers le schéma kit.
- Ajouter un provider réel si l'envoi sortant est activé.

## Dépendances

- Runtime : `@creezio/api-kernel`, `@creezio/auth`, `@creezio/platform-core`, `@creezio/shell-ui`, `hono`.
- Peer UI : `react`, `lucide-react`.
- Worker : Cloudflare Workers / Email Routing, `wrangler` côté déploiement.

## Voir aussi

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
- [email-worker/README.md](./email-worker/README.md)
