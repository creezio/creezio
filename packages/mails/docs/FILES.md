# packages/mails — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs mails` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `email-worker/`

| Fichier | Rôle |
|---|---|
| [`email-worker/bootstrap.mjs`](../email-worker/bootstrap.mjs) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`email-worker/worker.js`](../email-worker/worker.js) | Cloudflare Email Worker — inbound générique `@creezio/mails`. Catch-all Email Routing → POST vers l'instance client : https://{slug}.{MAIL_ROOT_DOMAIN}/api/v1/email/inbound Destinataires acceptés : *@ {slug}.mail.{MAIL_ROOT_DOMAIN} (recommandé — MX sans conflit CNAME tunnel) *@ {slug}.{MAIL_ROOT_DOMAIN} (si MX un jour compatible) Secrets / vars Worker : EMAIL_INBOUND_SECRET — Bearer partagé avec le CRM MAIL_ROOT_DOMAIN — ex. tempoflow.fr \| certivan.creez.io \| fidu.creez.io MAIL_SUBDOMAIN — défaut "mail" → {slug}.mail.{root} CRM_INBOUND_URL_TEMPLATE — optionn |

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/api-mount.ts`](../src/api-mount.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`src/config.ts`](../src/config.ts) | Configuration marque pour `@creezio/mails` (domaine public, UI, secrets inbound). Zéro domaine hardcodé dans le package — injecté via configureMails. |
| [`src/email-routes.ts`](../src/email-routes.ts) | Routes Hono boîte mail plateforme — équivalent fonctionnel `/api/v1/email` gold TF. Auth session reste côté marque (montage) ; inbound protégé par secret partagé. |
| [`src/env-bridge.ts`](../src/env-bridge.ts) | Bridge inbound → kit SoT (core.db). Préférer `createEmailInboxRoutes` / `insertInboundFull` ; conservé pour compat scripts / indexation légère sans PJ. |
| [`src/env-store.ts`](../src/env-store.ts) | Store mails SoT via env `CREEZIO_CORE_DB_PATH` / `DB_PATH` (process Next/CRM). |
| [`src/inbox-queries.ts`](../src/inbox-queries.ts) | Requêtes boîte mail plateforme (SoT kit — core.db). Remplace les jumeaux marque `email-queries.ts`. |
| [`src/index.ts`](../src/index.ts) | @creezio/mails — mails plateforme (SoT inbox + providers + UI). Pas de templates TempoFlow/Fidu. |
| [`src/memory-store.ts`](../src/memory-store.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`src/migrate-brand-emails.ts`](../src/migrate-brand-emails.ts) | Migration one-shot tables marque `emails` / `email_attachments` → kit SoT. Idempotent via message_id / brand_email_id. |
| [`src/sqlite-driver.ts`](../src/sqlite-driver.ts) | Driver SQLite minimal — @creezio/mails (I3 + inbox). import { createRequire } from "node:module"; import path from "node:path"; export type SqliteStatement = { run(...params: unknown[]): { changes?: number; lastInsertRowid?: number \| bigint }; get(...params: unknown[]): unknown; all(...params: unknown[]): unknown[]; }; export type SqliteDatabase = { exec(sql: string): unknown; |
| [`src/sqlite-store.ts`](../src/sqlite-store.ts) | Store mails plateforme — sqlite **core** (I3 + inbox SoT complète). |
| [`src/types.ts`](../src/types.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |

## `src/providers/`

| Fichier | Rôle |
|---|---|
| [`src/providers/file-sink.ts`](../src/providers/file-sink.ts) | Provider mails **non-stub** : écrit chaque envoi dans un fichier JSON sous `outDir` (sink local / tests / CI). Pas de templates marque. Pour SMTP réel, enregistrer un autre `MailProvider` via `registerProvider` et passer `defaultProviderId`. |
| [`src/providers/smtp-env.ts`](../src/providers/smtp-env.ts) | Provider SMTP minimal via env (nodemailer optionnel — refus propre s'il est absent). |

## `ui/`

| Fichier | Rôle |
|---|---|
| [`ui/index.ts`](../ui/index.ts) | @creezio/mails/ui — boîte de réception native (gold TF). |
| [`ui/mail-inbox.tsx`](../ui/mail-inbox.tsx) | _(pas de cartouche JSDoc en tête — voir le code)_ |
