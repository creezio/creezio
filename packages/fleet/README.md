# @creezio/fleet

Backend flotte **typé** du kit (P2.b) — ex `packages/observability/fleet-collector/*.mjs`.

C'est la brique qui pilote les serveurs marque headless (`docker/server`) :

| Module | Rôle |
|---|---|
| `docker` | Client Docker Engine API via socket Unix (ping, list/inspect/create/start/stop/rm, logs démuxés, pull avec auth) |
| `server-lib` | Logique partagée admin/agent : registre `servers.json`, allocation ports, collecte d'état, `createServer`, `updateServer` (pull → backup opt-in → recreate → health → rollback auto), backups tar en conteneur éphémère, rapport disque, snapshot poller |
| `instance-stack` | Stacks compose autonomes par instance : rendu `compose.yml`, sidecar `cloudflared`, `cf.env`/`secrets.env`, politique d'update fail-closed (`STACK_UPDATE_REFUSED`, `preserve-sidecar`) |
| `agent-updates` | Boucle pull des updates agent → app admin (directives fleet-releases, slots, statuts) |
| `update-status-store` | Persistance du suivi `update-status` (host-agent + plan local admin) : journal JSON atomique dans le répertoire d'état, reload au boot, flag `agentRestarted`, TTL 24 h |
| `registry-pull-proxy` | Proxy pull-only du registre d'images (`/v2/*`, Basic `hostId:agentToken` ou admin, push 405) |
| `server-admin` | Backend flotte admin (`startServerAdmin`) : plan local (socket) + plan flotte (agents tunnelisés), enrôlement, proxys |
| `host-agent` | Agent hôte (`startHostAgent`) : gestes locaux Bearer-only + boucle pull updates |
| `protocol` | Contrat de version agent↔backend (header `x-creezio-fleet-protocol`, refus fail-closed si absent ou ≠ v1) |

## Protocole agent ↔ backend (F4.4d)

Tous les échanges server-admin ↔ host-agent (et pull agent → app admin)
portent le header `x-creezio-fleet-protocol` (v1 depuis 0.15.0) :

- version égale → OK ;
- header **absent** ou version **différente** → refus fail-closed (409)
  avec message actionnable (`FLEET_PROTOCOL_ACCEPT_MISSING=false` depuis
  0.19.0 — dual-accept 0.15→0.18 terminé ; pas de bump v2 : le format
  filaire n'a pas changé).

## Suivi update-status persisté (T8)

Le suivi asynchrone des updates (`POST /update` → 202, poll
`GET /update-status`) était tenu en mémoire seule : un restart du process
pendant un update laissait l'admin poller dans le vide. Depuis 0.20.x le
suivi est **journalisé sur disque** (écriture atomique tmp+rename) dans le
répertoire d'état existant de chaque process :

- host-agent : `{dirname(CREEZIO_AGENT_STATE_FILE)}/host-agent-updates.json`
  (à côté de `host-agent.json`) ;
- server-admin (plan local) : `{adminRoot}/docker-data/server-admin-updates.json`.

Au boot, le journal est rechargé : une entrée restée `running` (update
interrompu par le restart) reçoit le champ **additif** `agentRestarted: true`
puis est résolue via `servers.json` — si l'image enregistrée de l'instance
correspond à l'image de l'update (posée par `updateServer` en fin d'update
OK), le statut devient `done` ; sinon l'issue réelle est inconnue → `error`
avec la **dernière étape persistée** (`lastStep`, alimentée au fil de l'eau)
dans `result.error`. Le poll admin retrouve donc toujours un statut terminal
au lieu d'un trou, et le mutex « update déjà en cours » ne reste jamais
coincé. Les entrées terminées sont purgées après un **TTL de 24 h**
(`DEFAULT_UPDATE_STATUS_TTL_MS`). Protocole v1 intact : champs additifs
seulement. Gate : `test-phase-fleet-update-status-persist`.

## Consommation

- Images Docker (`docker/server-admin`, `docker/host-agent`) : CMD
  `node node_modules/@creezio/fleet/dist/bin/{server-admin,host-agent}-main.js` —
  contexte stagé par `creezio server-docker admin|agent up`
  (`stageFleetImageContext`, fail-closed si dist absent).
- CLI `creezio server-docker` : import direct `packages/fleet/dist`
  (`importInstanceStack`, `server-lib`).
- `public/admin.html` : UI mono-fichier servie par server-admin sur `/admin`.

Package ESM-only (comme `factory`) — pas de dual CJS : consommé par
`import()`/CMD node, jamais `require()` Electron.

## Build / tests

```bash
npm run build -w @creezio/fleet     # tsc strict
npm run test:kit                    # gates fleet : server-docker, instance-stack, stack-update-preserve, fleet-agent, fleet-releases…
```
