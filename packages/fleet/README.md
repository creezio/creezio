# @creezio/fleet

Backend flotte **typé** du kit (P2.b) — ex `packages/observability/fleet-collector/*.mjs`.

C'est la brique qui pilote les serveurs marque headless (`docker/server`) :

| Module | Rôle |
|---|---|
| `docker` | Client Docker Engine API via socket Unix (ping, list/inspect/create/start/stop/rm, logs démuxés, pull avec auth) |
| `server-lib` | Logique partagée admin/agent : registre `servers.json`, allocation ports, collecte d'état, `createServer`, `updateServer` (pull → backup opt-in → recreate → health → rollback auto), backups tar en conteneur éphémère, rapport disque, snapshot poller |
| `instance-stack` | Stacks compose autonomes par instance : rendu `compose.yml`, sidecar `cloudflared`, `cf.env`/`secrets.env`, politique d'update fail-closed (`STACK_UPDATE_REFUSED`, `preserve-sidecar`) |
| `agent-updates` | Boucle pull des updates agent → app admin (directives fleet-releases, slots, statuts) |
| `registry-pull-proxy` | Proxy pull-only du registre d'images (`/v2/*`, Basic `hostId:agentToken` ou admin, push 405) |
| `server-admin` | Backend flotte admin (`startServerAdmin`) : plan local (socket) + plan flotte (agents tunnelisés), enrôlement, proxys |
| `host-agent` | Agent hôte (`startHostAgent`) : gestes locaux Bearer-only + boucle pull updates |
| `protocol` | Contrat de version agent↔backend (header `x-creezio-fleet-protocol`, dual-accept, refus explicite) |

## Protocole agent ↔ backend (F4.4d)

Tous les échanges server-admin ↔ host-agent (et pull agent → app admin)
portent le header `x-creezio-fleet-protocol` (v1 depuis 0.15.0) :

- version égale → OK ;
- header **absent** (composant ≤ 0.14) → accepté avec **warn bruyant**
  throttlé (dual-accept UNE version, `FLEET_PROTOCOL_ACCEPT_MISSING`) ;
- version **différente** → refus explicite avec message actionnable.

Au prochain bump (v2), `FLEET_PROTOCOL_ACCEPT_MISSING` passe à `false` :
l'absence de header devient un refus fail-closed.

## Consommation

- Images Docker (`docker/server-admin`, `docker/host-agent`) : CMD
  `node node_modules/@creezio/fleet/dist/bin/{server-admin,host-agent}-main.js` —
  contexte stagé par `creezio server-docker admin|agent up`
  (`stageFleetImageContext`, fail-closed si dist absent).
- CLI `creezio server-docker` : via les wrappers de compat
  `packages/observability/fleet-collector/*.mjs` (une version, warning
  `[deprecated]`).
- `public/admin.html` : UI mono-fichier servie par server-admin sur `/admin`.

Package ESM-only (comme `factory`) — pas de dual CJS : consommé par
`import()`/CMD node, jamais `require()` Electron.

## Build / tests

```bash
npm run build -w @creezio/fleet     # tsc strict
npm run test:kit                    # gates fleet : server-docker, instance-stack, stack-update-preserve, fleet-agent, fleet-releases…
```
