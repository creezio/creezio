# AGENTS.md — @creezio/fleet

## Mission

Backend flotte typé (P2.b) : gestes Docker Engine API, registre
`servers.json`, stacks compose par instance, updates pull/rollback, agent
hôte, backend admin flotte, proxy registre pull-only, **protocole
agent↔backend versionné**. Ex `packages/observability/fleet-collector/*.mjs`
(portage isofonctionnel 0.15.0).

**Ce code pilote la flotte réelle en prod** (app admin + host-agent sur les
VPS). Toute régression casse le pilotage d'instances vivantes : portage /
refactor à isofonctionnalité stricte, vérification empirique flotte après
déploiement (voir skill `creezio-fleet-ops`).

## Frontières

- **Node pur** : aucune dépendance runtime (ni `@creezio/*`, ni npm) — l'agent
  hôte doit rester léger et l'image se construit sans `npm ci`. Ne JAMAIS
  ajouter de dépendance runtime sans repenser le staging d'image
  (`stageFleetImageContext`, factory).
- **0 vocabulaire marque** (gate `no-brand-vocab` scanne `src/`).
- Mêmes endpoints / formats d'état disque / noms de conteneurs et d'images
  que les `.mjs` historiques — les consommateurs (admin app module fleet,
  scripts d'enrôlement, agents déployés) ne doivent rien voir changer.

## Protocole agent↔backend (`src/protocol.ts`)

- Header `x-creezio-fleet-protocol` porté dans les DEUX sens
  (server-admin↔host-agent) + boucle pull (agent-updates → app admin).
- v identique → ok ; header absent (déployés ≤ 0.14) → warn bruyant throttlé
  (`shouldWarnProtocol`, 1/10 min) accepté UNE version ; v différente → refus
  explicite message actionnable (jamais silencieux).
- **Au bump de `FLEET_PROTOCOL_VERSION`** : passer
  `FLEET_PROTOCOL_ACCEPT_MISSING=false` (absence de header = refus).

## Points d'entrée

- `src/index.ts` — barrel (protocol, types, docker, server-lib,
  instance-stack, agent-updates, registry-pull-proxy).
- `src/server-admin.ts` / `src/host-agent.ts` — `startServerAdmin()` /
  `startHostAgent()` (sous-chemins exports dédiés).
- `src/bin/*-main.ts` — CMD des images Docker
  (`node_modules/@creezio/fleet/dist/bin/*-main.js`).
- `public/admin.html` — UI admin mono-fichier (servie sur `/admin`).

## Wrappers de compat (une version)

`packages/observability/fleet-collector/{admin-docker,server-lib,
instance-stack,agent-updates,registry-pull-proxy,server-admin,host-agent}.mjs`
re-exportent ce package avec warning `[deprecated]` — retrait au prochain
minor. `server.mjs` / `ops-api.mjs` / `env.mjs` (collector télémétrie)
restent la SoT observability, hors périmètre fleet.

## Modifier sans casser

- `updateServer` : ne pas toucher l'ordre pull → (backup opt-in) → stop →
  rm → recreate → health → rollback auto ; refus stack fail-closed AVANT
  recreate (`isStackUpdateRefused`).
- `instance-stack` : politique `resolveStackUpdatePolicy` (préserver le
  sidecar cloudflared, refuser tout update qui casserait un hostname public).
- Gates : `test-phase-server-docker` (contenu server-lib/server-admin),
  `test-phase-instance-stack`, `test-phase-stack-update-preserve`,
  `test-phase-fleet-agent`, `test-phase-fleet-releases`,
  `test-phase-registry-pull-proxy` — via wrappers ou source TS.
- Images : tout renommage de `dist/bin/*` doit suivre dans les Dockerfiles
  (`docker/server-admin`, `docker/host-agent`) ET `stageFleetImageContext`
  (factory).

## Tests

```bash
npm run build -w @creezio/fleet
node --test scripts/test-phase-server-docker.mjs scripts/test-phase-instance-stack.mjs scripts/test-phase-stack-update-preserve.mjs scripts/test-phase-fleet-agent.mjs
```
