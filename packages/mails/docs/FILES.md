# @creezio/mails — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/mails/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`email-worker/README.md`](../email-worker/README.md) | 55 | — |
| [`email-worker/bootstrap.mjs`](../email-worker/bootstrap.mjs) | 197 | — |
| [`email-worker/worker.js`](../email-worker/worker.js) | 250 | — |
| [`src/api-mount.ts`](../src/api-mount.ts) | 61 | `createMailsApiMount` |
| [`src/config.ts`](../src/config.ts) | 125 | `MailsConfig`, `configureMails`, `getMailsConfig`, `resetMailsConfigForTests`, `resolveEmailDomain`, `resolveInboundSecret`, `resolvePageSubtitle`, `resolveEmptyStateNoDomainHint` |
| [`src/email-routes.ts`](../src/email-routes.ts) | 203 | `EmailInboxRouteDeps`, `createEmailInboxRoutes` |
| [`src/env-bridge.ts`](../src/env-bridge.ts) | 50 | `indexKitInboundMail` |
| [`src/env-store.ts`](../src/env-store.ts) | 43 | `getKitMailsStore`, `resetKitMailsStoreForTests` |
| [`src/inbox-queries.ts`](../src/inbox-queries.ts) | 347 | `ensureMailsInboxSchema`, `emailsReady`, `listInboxEmails`, `getInboxEmail`, `getInboxAttachment`, `markInboxEmailRead`, `deleteInboxEmail`, `insertInboundEmail` |
| [`src/index.ts`](../src/index.ts) | 67 | `PLATFORM_MAILS_CORE_SQL`, `ensureMailsInboundColumnsSql`, `configureMails`, `getMailsConfig`, `resetMailsConfigForTests`, `resolveEmailDomain`, `resolveEmptyStateNoDomainHint`, `resolveInboundSecret` |
| [`src/memory-store.ts`](../src/memory-store.ts) | 92 | `CreateMemoryMailsStoreOptions`, `createMemoryMailsStore` |
| [`src/migrate-brand-emails.ts`](../src/migrate-brand-emails.ts) | 153 | `MigrateBrandEmailsResult`, `migrateBrandEmailsToKit` |
| [`src/providers/file-sink.ts`](../src/providers/file-sink.ts) | 66 | `FILE_SINK_PROVIDER_ID`, `CreateFileSinkMailProviderOptions`, `createFileSinkMailProvider` |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | 50 | `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase` |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | 335 | `SqliteMailsStore`, `CreateSqliteMailsStoreOptions`, `createSqliteMailsStore` |
| [`src/types.ts`](../src/types.ts) | 169 | `MailStatus`, `PlatformMailAttachmentMeta`, `PlatformMail`, `MailProvider`, `InboundAttachmentInput`, `InboundEmailInput`, `InboxEmailListItem`, `InboxEmailAttachmentMeta` |
| [`ui/index.ts`](../ui/index.ts) | 6 | `MailInbox` |
| [`ui/mail-inbox.tsx`](../ui/mail-inbox.tsx) | 444 | `MailInboxProps`, `MailInbox` |

---

## Détail par fichier

### `email-worker/README.md`

- **Lignes** : 55

_(pas de cartouche JSDoc en tête — voir le code)_

### `email-worker/bootstrap.mjs`

- **Lignes** : 197

_(pas de cartouche JSDoc en tête — voir le code)_

### `email-worker/worker.js`

- **Lignes** : 250

Cloudflare Email Worker — inbound générique `@creezio/mails`.
Catch-all Email Routing → POST vers l'instance client :
  https://{slug}.{MAIL_ROOT_DOMAIN}/api/v1/email/inbound
Destinataires acceptés :
  *@ {slug}.mail.{MAIL_ROOT_DOMAIN}   (recommandé — MX sans conflit CNAME tunnel)
  *@ {slug}.{MAIL_ROOT_DOMAIN}        (si MX un jour compatible)
Secrets / vars Worker :
  EMAIL_INBOUND_SECRET  — Bearer partagé avec le CRM
  MAIL_ROOT_DOMAIN      — ex. tempoflow.fr | certivan.creez.io | fidu.creez.io
  MAIL_SUBDOMAIN        — défaut "mail" → {slug}.mail.{root}
  CRM_INBOUND_URL_TEMPLATE — optionn

### `src/api-mount.ts`

- **Lignes** : 61
- **Exports** : `createMailsApiMount`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/config.ts`

- **Lignes** : 125
- **Exports** : `MailsConfig`, `configureMails`, `getMailsConfig`, `resetMailsConfigForTests`, `resolveEmailDomain`, `resolveInboundSecret`, `resolvePageSubtitle`, `resolveEmptyStateNoDomainHint`

Configuration marque pour `@creezio/mails` (domaine public, UI, secrets inbound).
Zéro domaine hardcodé dans le package — injecté via configureMails.

### `src/email-routes.ts`

- **Lignes** : 203
- **Exports** : `EmailInboxRouteDeps`, `createEmailInboxRoutes`

Routes Hono boîte mail plateforme — équivalent fonctionnel `/api/v1/email` gold TF.
Auth session reste côté marque (montage) ; inbound protégé par secret partagé.

### `src/env-bridge.ts`

- **Lignes** : 50
- **Exports** : `indexKitInboundMail`

Bridge inbound → kit SoT (core.db).
Après cutover marques : préférer `createEmailInboxRoutes` / `insertInboundFull`.
Conservé pour compat scripts / indexation légère sans PJ.

### `src/env-store.ts`

- **Lignes** : 43
- **Exports** : `getKitMailsStore`, `resetKitMailsStoreForTests`

Store mails SoT via env `CREEZIO_CORE_DB_PATH` / `DB_PATH` (process Next/CRM).

### `src/inbox-queries.ts`

- **Lignes** : 347
- **Exports** : `ensureMailsInboxSchema`, `emailsReady`, `listInboxEmails`, `getInboxEmail`, `getInboxAttachment`, `markInboxEmailRead`, `deleteInboxEmail`, `insertInboundEmail`

Requêtes boîte mail plateforme (SoT kit — core.db).
Remplace les jumeaux marque `email-queries.ts`.

### `src/index.ts`

- **Lignes** : 67
- **Exports** : `PLATFORM_MAILS_CORE_SQL`, `ensureMailsInboundColumnsSql`, `configureMails`, `getMailsConfig`, `resetMailsConfigForTests`, `resolveEmailDomain`, `resolveEmptyStateNoDomainHint`, `resolveInboundSecret`, `resolvePageSubtitle`, `createMemoryMailsStore`, `createSqliteMailsStore`, `openNodeSqliteDatabase`, `FILE_SINK_PROVIDER_ID`, `createFileSinkMailProvider`, `createMailsApiMount`, `indexKitInboundMail`, `getKitMailsStore`, `resetKitMailsStoreForTests`, `ensureMailsInboxSchema`, `emailsReady`, `listInboxEmails`, `getInboxEmail`, `getInboxAttachment`, `markInboxEmailRead`, `deleteInboxEmail`, `insertInboundEmail`, `createEmailInboxRoutes`, `migrateBrandEmailsToKit`

@creezio/mails — mails plateforme (SoT inbox + providers + UI).
Pas de templates TempoFlow/Fidu.

### `src/memory-store.ts`

- **Lignes** : 92
- **Exports** : `CreateMemoryMailsStoreOptions`, `createMemoryMailsStore`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/migrate-brand-emails.ts`

- **Lignes** : 153
- **Exports** : `MigrateBrandEmailsResult`, `migrateBrandEmailsToKit`

Migration one-shot tables marque `emails` / `email_attachments` → kit SoT.
Idempotent via message_id / brand_email_id.

### `src/providers/file-sink.ts`

- **Lignes** : 66
- **Exports** : `FILE_SINK_PROVIDER_ID`, `CreateFileSinkMailProviderOptions`, `createFileSinkMailProvider`

Provider mails **non-stub** : écrit chaque envoi dans un fichier JSON
sous `outDir` (sink local / tests / CI). Pas de templates marque.
Pour SMTP réel, enregistrer un autre `MailProvider` via `registerProvider`
et passer `defaultProviderId`.

### `src/sqlite-driver.ts`

- **Lignes** : 50
- **Exports** : `SqliteStatement`, `SqliteDatabase`, `OpenSqliteDatabase`, `openNodeSqliteDatabase`

Driver SQLite minimal — @creezio/mails (I3 + inbox). 
import { createRequire } from "node:module";
import path from "node:path";

export type SqliteStatement = {
  run(...params: unknown[]): { changes?: number; lastInsertRowid?: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
};

export type SqliteDatabase = {
  exec(sql: string): unknown;

### `src/sqlite-store.ts`

- **Lignes** : 335
- **Exports** : `SqliteMailsStore`, `CreateSqliteMailsStoreOptions`, `createSqliteMailsStore`

Store mails plateforme — sqlite **core** (I3 + inbox SoT complète).

### `src/types.ts`

- **Lignes** : 169
- **Exports** : `MailStatus`, `PlatformMailAttachmentMeta`, `PlatformMail`, `MailProvider`, `InboundAttachmentInput`, `InboundEmailInput`, `InboxEmailListItem`, `InboxEmailAttachmentMeta`, `InboxEmailDetail`, `PlatformMailsStore`, `PLATFORM_MAILS_CORE_SQL`, `ensureMailsInboundColumnsSql`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 6
- **Exports** : `MailInbox`

@creezio/mails/ui — boîte de réception native (gold TF).

### `ui/mail-inbox.tsx`

- **Lignes** : 444
- **Exports** : `MailInboxProps`, `MailInbox`

_(pas de cartouche JSDoc en tête — voir le code)_

