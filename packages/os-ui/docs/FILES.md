# FILES — @creezio/os-ui

| Fichier | Rôle |
|---------|------|
| [`src/index.ts`](../src/index.ts) | Exports : `CreezioUiBoot`, `OS_UI_ROUTE_SEGMENTS` (segments OS interdits dans le `ui/app` versionné marque), `OS_UI_ROUTE_GROUP` (`(creezio-os)`) |
| [`src/boot.tsx`](../src/boot.tsx) | `CreezioUiBoot` — boot client OS : identité desktop (`desktopApiGlobal`, `productName`, `publicHostSuffix`) + `configureShellUiBrand` |
| [`scripts/materialize.mjs`](../scripts/materialize.mjs) | CLI `creezio-materialize-os-ui` — copie `routes/` vers `ui/app/(creezio-os)/` d'une marque (dossier gitignoré côté marque) |
| `routes/login/page.tsx` | Page login OS (wrapper `@creezio/auth/ui`) |
| `routes/setup/page.tsx` | Setup first-run (wrapper `@creezio/onboarding/ui`) |
| `routes/onboarding/page.tsx` | Onboarding (wrapper `@creezio/onboarding/ui`) |
| `routes/mails/page.tsx` | Inbox mails (wrapper `@creezio/mails/ui`) |
| `routes/taches/page.tsx` | Kanban tâches (wrapper `@creezio/tasks/ui`) |
| `routes/mcp/page.tsx` | Console MCP (wrapper `@creezio/mcp-facade/ui`) |
| `routes/cockpit/page.tsx` | Cockpit (wrapper `@creezio/cockpit/ui`) |
| `routes/server-cockpit/page.tsx` | Cockpit serveur (wrapper `@creezio/cockpit/ui`) |
| `routes/collaborateurs/page.tsx` | Gestion collaborateurs (OS) |
| `routes/configuration/page.tsx` | Configuration OS |
| `routes/parametres/page.tsx` | Paramètres |
| `routes/settings/page.tsx` | Settings desktop |
| `routes/developers/page.tsx` | Espace développeurs (API keys…) |
| `routes/admin/analytics/page.tsx` | Admin analytics (wrapper `@creezio/observability/ui`) |
| `routes/admin/database/page.tsx` | Admin Database (wrapper `@creezio/database/ui`) |
| `routes/admin/mcp/page.tsx` | Admin MCP |
| `routes/admin/plugins/page.tsx` | Admin plugins (Product Hub) |
| `routes/admin/request-logs/page.tsx` | Admin request-logs (wrapper `@creezio/observability/ui`) |
