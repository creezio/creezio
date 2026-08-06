# AGENTS — @creezio/mails

## Mission

Maintenir la capacité mails générique : store, inbox, providers, routes Hono, UI et worker Cloudflare. Le package doit rester sans domaine, template ou transport SMTP marque hardcodé.

## Ne pas faire

- Ne pas hardcoder de domaine marque ou de suffixe mail.
- Ne pas stocker/logguer le secret inbound en clair.
- Ne pas ajouter de template email métier dans le kit.
- Ne pas imposer un provider SMTP unique ; garder `MailProvider` extensible.
- Ne pas rendre `/inbound` dépendant d'une session UI : il doit utiliser le secret partagé.
- `docs/FILES.md` est maintenu via `node scripts/generate-files-md.mjs mails` (gate `test-phase-docs-freshness`) — la colonne Rôle s'édite à la main, ne pas inventer d'autre format.

## Points d'entrée

- `src/index.ts` : surface publique.
- `src/config.ts` : `configureMails`, domaine, secret, textes UI.
- `src/types.ts` : schéma plateforme et contrats.
- `src/inbox-queries.ts` : inbox, pièces jointes, insertion inbound.
- `src/email-routes.ts` : routes Hono `/email`.
- `src/api-mount.ts` : surface platform-core drafts/send.
- `src/providers/file-sink.ts` : provider local.
- `src/migrate-brand-emails.ts` : migration vers le kit.
- `ui/mail-inbox.tsx` : UI inbox.
- `email-worker/worker.js` : worker Cloudflare.
- `email-worker/bootstrap.mjs` : déploiement worker.

## Modifier sans casser

- Préserver les tables `creezio_platform_mails` et `creezio_platform_mail_attachments`.
- Toute colonne ajoutée doit être migrable via `ensureMailsInboundColumnsSql` ou équivalent.
- Garder la déduplication par `message_id`.
- Garder `Authorization: Bearer` et `x-email-inbound-secret` compatibles pour `/inbound`.
- Ne pas dépasser les attentes UI snake_case (`from_addr`, `read_at`, `attachments`, etc.).
- Les pièces jointes doivent rester servies avec un `Content-Disposition` sûr.

## Config brand

```ts
configureMails({
  rootDomain: "example.com",
  inboundSecretEnvKeys: ["EMAIL_INBOUND_SECRET", "BRAND_EMAIL_INBOUND_SECRET"],
  mailSubdomain: "mail",
  uiEnabled: true,
});
```

Env côté app :

- `EMAIL_DOMAIN`
- `APP_PUBLIC_URL`
- `MCP_PUBLIC_URL`
- `EMAIL_INBOUND_SECRET` ou clé personnalisée

Env côté worker : voir `email-worker/README.md`.

## Tests/gates

```bash
npm run typecheck -w @creezio/mails
npm run build -w @creezio/mails
npm run test:inbox -w @creezio/mails
```

Vérifications hôte utiles :

- `GET /api/v1/email/meta` retourne `ready` et `domain`.
- `POST /api/v1/email/inbound` refuse un secret invalide.
- un inbound avec PJ est listé et la PJ est téléchargeable.
- `PATCH /:id` bascule lu/non lu.
- `MailInbox` reste utilisable si aucun domaine mail n'est configuré.

## Fichiers sensibles

- `src/email-routes.ts` : auth secret inbound.
- `src/inbox-queries.ts` : insertion, déduplication, BLOB pièces jointes.
- `src/types.ts` : schéma SQL.
- `src/config.ts` : résolution domaines/env.
- `email-worker/worker.js` : parsing MIME et routage slug.
- `email-worker/bootstrap.mjs` : déploiement Cloudflare.

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
- [email-worker/README.md](./email-worker/README.md)
