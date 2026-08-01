# AGENTS — @creezio/observability

## Mission

Maintenir les briques d'observabilité génériques : events store, ops journal, fleet agent/samples, usage analytics, request logs, UI admin et fleet collector. Tout doit rester best-effort, redacted et multi-marques.

## Ne pas faire

- Ne pas hardcoder de domaine, token, label UI ou chemin marque.
- Ne pas faire échouer une requête métier parce qu'un log/request-log/fleet event échoue.
- Ne pas écrire de secrets en clair dans les logs, JSONL, bundles ou heartbeats.
- Ne pas monter les routes admin sans auth côté marque.
- Ne pas ajouter de dépendance UI obligatoire côté runtime serveur.
- Ne pas toucher à `docs/FILES.md` sauf demande explicite.

## Points d'entrée

- `src/index.ts` : surface publique.
- `src/api-mount.ts` : `/platform/observability`.
- `src/ops/journal.ts` : ops JSONL et hooks.
- `src/ops/fleet-agent.ts` : agent heartbeat/crash/bundle/commands.
- `src/ops/fleet-activity.ts` : buffer actions flotte.
- `src/ops/fleet-samples.ts` : samples pour diagnostics.
- `src/usage/adapters.ts` : `configureUsageAnalytics`.
- `src/usage/http-routes.ts` : routes ingest/admin usage.
- `src/usage/ui-brand.ts` : tokens UI analytics.
- `src/request-logs/config.ts` : config miroir fleet.
- `src/request-logs/middleware.ts` : middlewares API/MCP.
- `src/request-logs/request-logs.ts` : ring buffer et redaction.
- `src/request-logs/http-routes.ts` : routes admin request logs.
- `fleet-collector/server.mjs` : serveur collector.
- `fleet-collector/env.mjs` : résolution env collector.
- `ui/index.ts` : exports UI.

## Modifier sans casser

- Garder tous les chemins de collecte best-effort (`try/catch`) sauf raison explicite.
- Toute donnée user/env/API doit passer par `redactSecrets` ou un équivalent.
- Les scopes fleet doivent rester opt-in via `isScopeActive`.
- Garder les endpoints collector `/heartbeat`, `/crash`, `/bundle`, `/commands`.
- Garder la compat env neutre `CREEZIO_*` / `FLEET_*` et dual-read legacy si déjà présent.
- Ne pas augmenter la rétention ops/request logs sans borne claire.
- Les routes usage admin doivent continuer à accepter `period`, `from`, `to`, `kind`, `userId`, `q`.

## Config brand

Usage analytics :

```ts
configureUsageAnalytics({ getWriteDb, getDb, tableExists });
configureUsageAnalyticsUiBrand({
  aidAttr: "data-creezio-aid",
  titlebarNoDragClass: "creezio-titlebar-no-drag",
  mirrorFleetAction,
});
```

Request logs :

```ts
configureRequestLogs({
  getFleetStateDir: () => process.env.CREEZIO_FLEET_STATE_DIR,
});
```

Ops/fleet :

- `initOpsJournal(userDataDir, version, hooks)` au boot desktop.
- `createFleetAgent({ baseUrl, getConfig, isScopeActive, getInstallId, getAppVersion })`.
- `startFleetAgent(runtimeHooks)` avec santé, samples et extras métier.

Collector :

- `CREEZIO_FLEET_INGEST_TOKEN`
- `CREEZIO_FLEET_OPS_USER` / `_PASS` / `_TOKEN`
- `CREEZIO_FLEET_DIR`
- `FLEET_PUBLIC_DOMAIN` / `CREEZIO_FLEET_DOMAIN`
- labels UI `CREEZIO_FLEET_UI_*`

## Tests/gates

```bash
npm run typecheck -w @creezio/observability
npm run build -w @creezio/observability
npm run test:fleet-collector -w @creezio/observability
```

Vérifications hôte utiles :

- request logs capturent API et MCP sans secrets.
- `GET /request-logs` et purge fonctionnent derrière auth.
- `POST /usage/events` insère un batch et l'admin l'affiche.
- ops journal écrit un boot JSONL et un résumé.
- fleet agent n'envoie rien si le scope est désactivé.
- collector refuse l'ingest sans token et protège `/ops/api/*`.

## Fichiers sensibles

- `src/request-logs/request-logs.ts` : redaction et miroir JSONL.
- `src/request-logs/middleware.ts` : lecture clone requête/réponse.
- `src/ops/journal.ts` : écriture fichiers et hooks anomalies.
- `src/ops/fleet-agent.ts` : payloads télémétrie et commandes distantes.
- `src/usage/http-routes.ts` : ingest user/session.
- `fleet-collector/server.mjs` : auth ops et ingestion.
- `fleet-collector/env.mjs` : secrets/env collector.

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
- [fleet-collector/README.md](./fleet-collector/README.md)
