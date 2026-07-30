# `@creezio/observability`

Module **natif plateforme** — une seule SoT pour events, ops journal, fleet
agent, usage analytics, request-logs (+ UI admin) et **fleet-collector** ops.

Générique : pas de parcours métier resto / VASP / cabinet. Branding et domaines
uniquement via injection (`configure*` / env / hooks).

## Surfaces SoT

| Surface | Entrée kit | Notes |
|---------|------------|--------|
| Store V2 (activité / CP / usages) | `createSqliteObservabilityStore`, `createObservabilityApiMount` | C4 |
| Ops journal / rules / emit | `initOpsJournal`, `track`, `emitOpsEvent`, … | R4 / **P29** — émission SoT `TF2EVENT` (`OPS_EVENT_PREFIX`) ; lecture dual-read `OPS_EVENT_PREFIXES` = `TF2EVENT` + `CertivanEVENT` (ne pas casser) |
| Fleet agent + activity + samples | `createFleetAgent`, `recordFleetAction`, `createFleetSamples` | M7 — hooks chemins / consent / endpoint |
| Usage analytics | `configureUsageAnalytics`, routes + `ui` | N6 |
| Request-logs | `configureRequestLogs`, middleware, routes, `ui` | O5 |
| **Fleet collector** (ops VPS) | `fleet-collector/server.mjs` | **P25** — binaire neutre, env injection |

## Injection marque (`configure*` / hooks)

| API / env | Rôle |
|-----------|------|
| `configureUsageAnalytics({ getDb, … })` | DB + session usage |
| `configureUsageAnalyticsUiBrand({ aidAttr, titlebarAttr, … })` | Attributs DOM / chrome UI |
| `configureRequestLogs` / `CREEZIO_*` (+ fallbacks legacy) | Capacité ring, state dir flotte |
| `createFleetAgent({ endpoint, getConsent, getInstallId, getHeartbeatExtras, … })` | Endpoints flotte + extras métier |
| Fleet-collector env | `CREEZIO_FLEET_*` / `FLEET_*` (+ dual-read `TF2_*` / `CERTIVAN_*`) — domaine, tunnel suffix, titres UI |

## Checklist extinction jumeaux marques

- [ ] Pas de `lib/usage-analytics*` local
- [ ] Pas de `lib/request-logs*` + clients admin locaux
- [ ] Pas de `electron/ops-*`, `fleet-agent`, `fleet-activity`, `fleet-samples`, `fleet-telemetry` locaux
- [ ] Pas de twin `crm/scripts/fleet-collector/{server,ops-api,public}` — wrapper ≤80 LOC ou invoke vendor
- [ ] Mounts routes / pages admin ≤80 LOC
- [ ] Fidu : `features.fleet=false` / pas d’admin analytics — **respecter**

## Hors scope

- **ai-screencast** → `@creezio/electron-shell` + `@creezio/shell-ui`
- **page-trails / ops-track / server-incident** encore dans `@creezio/shell-ui` (P2 optionnel)
- Samples métier CV `electron/fleet-dossier-samples.ts` (via `getHeartbeatExtras`) — **reste marque**
- Cockpit / onboarding / auth / shell sidebar → autres packages

## Wiring marque mince (exemple)

```ts
// electron/host-runtime-ctx.ts — endpoints flotte marque
fleet: {
  envEndpointKey: "TF2_FLEET_ENDPOINT",
  defaultEndpoint: "https://fleet.tempoflow.fr/i-<token>",
}

// src/server/routes/usage-analytics.ts — wrap kit + session (≤20 LOC)
import { createUsageAnalyticsAdminRoutes } from "@creezio/observability";

// Fleet collector systemd / scripts :
// node vendor/creezio/observability/fleet-collector/server.mjs
// avec TF2_FLEET_* ou CREEZIO_FLEET_* + CREEZIO_FLEET_UI_TITLE / TUNNEL_SUFFIX
```

## Fleet-collector (D-P25)

Voir [`fleet-collector/README.md`](./fleet-collector/README.md).

```bash
npm run test:fleet-collector -w @creezio/observability
npm run fleet-collector -w @creezio/observability
```

## Gates kit

```bash
npm run build -w @creezio/observability && npm run build:cjs
node --test scripts/test-phase-v2.mjs scripts/test-phase-c4.mjs
node --test scripts/test-phase-r4.mjs scripts/test-phase-m7.mjs scripts/test-phase-m7p.mjs
node --test scripts/test-phase-n6.mjs scripts/test-phase-n6p.mjs
node --test scripts/test-phase-o5.mjs scripts/test-phase-o5p.mjs
node --test scripts/test-phase-p25.mjs
```
