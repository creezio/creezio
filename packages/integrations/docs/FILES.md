# FILES — @creezio/integrations

| Fichier | Rôle |
|---|---|
| `src/index.ts` | Barrel exports publics |
| `src/schema.ts` | DDL `creezio_integrations` (core.db, `INTEGRATIONS_CORE_SQL`) |
| `src/reference.ts` | Références `integration://<slug>` (validation, slugify, parse) |
| `src/secret-box.ts` | Scellement AES-256-GCM dérivé `AUTH_SECRET` + hint |
| `src/providers.ts` | Catalogue providers (openai, notion, anthropic, custom) + mapping credentials n8n |
| `src/store.ts` | Store SQLite : CRUD, resolveBySlug, setN8nSync |
| `src/n8n-sync.ts` | Push/update/remove credentials vers n8n embarqué (API publique) |
| `src/http/routes.ts` | Routes Hono `/api/v1/platform/integrations` (ACL owner / session / clé service) |
| `ui/integrations-client.tsx` | Page CRM (design system kit) |
| `ui/index.ts` | Barrel UI |
