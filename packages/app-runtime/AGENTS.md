# AGENTS.md — @creezio/app-runtime

## Mission

Façade **unique** pour démarrer une marque desktop / harness Node.
Toute évolution Meili / HTTP kernel / session IPC se fait **ici** (ou dans
`electron-shell`) — jamais en dupliquant l'orchestration dans la marque.

## API publique

- `startBrandDesktop(config)` — Electron main mince
- `startBrandKernelHarness(config)` — smokes sans GUI
- `composeBrandOs` / `listenBrandOsHttp` / `warmBrandNativeHosts` — OS natif
- `registerHermesHostMcpTools` / `createApiKeyBearerActorResolver` — H1/H4
  « Hermes cerveau unique » : tools host tasks (`create_ai_task`…) + workspace
  (`workspace.*`, `platform.ask_human`) sur la façade MCP ; Bearer opaque
  (clé CRM service Hermes, `user_id NULL` + scopes `full`) résolu contre
  `api_keys` et mappé owner. Gate : `test-phase-hermes-mcp.mjs`.
- `handleMcpJsonRpcRequest` / `isJsonRpcBody` — pont JSON-RPC 2.0 stateless
  sur `/mcp` (client MCP natif Hermes, `mcp_servers` + `skip_preflight`) ;
  le transport JSON legacy est conservé pour les corps sans `jsonrpc`.
- `startFleetHeartbeat` / `createFleetAccessMount` — auto-inscription flotte
  (F3) : register + heartbeat vers la DB centrale admin (module
  `fleet-registry` @creezio/admin) si `CREEZIO_FLEET_ADMIN_URL` +
  `CREEZIO_FLEET_REGISTER_SECRET` posés (no-op sinon, best-effort absolu) ;
  état local `{dataDir}/{brand}-fleet.json` 0600 (serverKey + hash de
  l'accessToken, jamais de clair) ; consultation admin → instance sur
  `/api/v1/platform/fleet-access/status|logs|ops` (Bearer accessToken).
  Branché dans le harness serveur (profil full). Gate :
  `test-phase-fleet-heartbeat.mjs`.

## Défauts plug-and-play (kit)

- `desktopProfile=full`, `desktopShell=runtime`
- `ensureKitOsBinaries()` au boot (Meili/cloudflared sous `electron-shell/resources/bin`)
- Warm n8n (skip : `CREEZIO_NATIVE_WARM=0`) ; Hermes warm : `CREEZIO_NATIVE_WARM_HERMES=1`
- Surface MCP locale : `CREEZIO_TUNNEL_LOCAL` (défaut on)
- Sonde agrégée : `GET /api/v1/os/ready`
- Opt-out shell : `CREEZIO_DESKTOP_SHELL=window`
- Bind Docker/headless : `CREEZIO_HTTP_HOST=0.0.0.0` (ou `METIER_HOST`)
  — voir `docker/server/` + `creezio server-docker`

## Meili (feed + usage UI) — composant CORE fail-closed

`meiliFeed` (marque) + indexer kit (`electron-shell/host/meili`) alimentent
les index. Au boot, `configureEntityMeiliFromFeed` branche le CRUD
entity-list (`GET /api/v1/modules/<entité>`) sur Meili dès qu'un index a
une table + `filterableAttributes` — **y compris q vide**. **Fail-closed**
(décision 2026-08-28, voir `creezio/AGENTS.md` Pièges +
`electron-shell/AGENTS.md` section Meili) : feed avec index + binaire
absent/start KO = **échec de boot explicite** (`MeiliRequiredError`) ;
entité indexée + Meili KO = **503 `meili_unavailable`** (ou
`engine:"indexing"` pendant l'indexation initiale) — zéro LIKE SQL de
secours. `CREEZIO_ALLOW_NO_MEILI=1` = dev/tests hors-browse uniquement.
Helpers : `browseMeiliIndexOutcome` / `browseMeiliIndex`.
`searchMeiliIndexes` est interdit pour le browse (retourne [] si q vide).
SQL = hors index uniquement (agrégats, joins, écritures, EAN, by id).

## Ne pas faire

- Pas de domaine métier (CHR, GED…) dans ce package.
- Pas de vendor Hermes/n8n/binaires dans `apps/<marque>/resources`.
- La marque ne doit fournir que : `manifest`, migrations/API métier, `meiliFeed?`, `navItems?`.

## Consommation marque

```ts
import { startBrandDesktop } from "@creezio/app-runtime";

await startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
});
```
