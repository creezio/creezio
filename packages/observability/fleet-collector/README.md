# Fleet Collector — `@creezio/observability`

Services ops autonomes en Node pur (loopback HTTP + store JSON), **SoT kit**
— 0 domaine marque hardcodé. Le dossier porte trois serveurs :

| Fichier | Service | Câblé en prod |
|---|---|---|
| `server.mjs` | Collector télémétrie (ingest heartbeat/crash/bundle + cockpit ops) | Service dédié (ex. TF2 `:8665`) |
| `server-admin.mjs` (+ `server-lib.mjs`, `admin-docker.mjs`, `ops-api.mjs`, `registry-pull-proxy.mjs`) | **Backend flotte** `creezio-server-admin` (`:18800`, Basic) : gestes Docker (create/update/rollback), hôtes enrôlés, proxy registre pull-only `/v2/*` (F4) | Image `docker/server-admin` — `creezio server-docker admin up` |
| `host-agent.mjs` (+ `agent-updates.mjs`) | **Agent hôte** (`:18810`) : gestes locaux d'un VPS + boucle d'updates en pull (F5) | Image `docker/host-agent` — `creezio server-docker agent up` |

**Piège prod** : ce code est **copié dans les images** au build — après
toute modif de ces `.mjs`, re-runner `creezio server-docker admin up …` /
`agent up …` (sinon nouvelles routes → 404 silencieux).

## Lancement

```bash
# Depuis le kit
CREEZIO_FLEET_INGEST_TOKEN=… \
CREEZIO_FLEET_OPS_USER=ops \
CREEZIO_FLEET_OPS_PASS=… \
CREEZIO_FLEET_UI_TITLE="TempoFlow Fleet" \
CREEZIO_FLEET_TUNNEL_SUFFIX=tempoflow.fr \
FLEET_PUBLIC_DOMAIN=fleet.tempoflow.fr \
npm run fleet-collector -w @creezio/observability

# Ou binaire
npx creezio-fleet-collector
```

Marques (package npm installé) :

```bash
node node_modules/@creezio/observability/fleet-collector/server.mjs
```

## Env (neutre + dual-read legacy)

| Variable | Alias legacy | Rôle |
|----------|--------------|------|
| `CREEZIO_FLEET_PORT` / `FLEET_PORT` | `TF2_FLEET_PORT`, `CERTIVAN_FLEET_PORT` | Listen (défaut 8665) |
| `CREEZIO_FLEET_INGEST_TOKEN` / `FLEET_INGEST_TOKEN` | `TF2_*`, `CERTIVAN_*` | Path ingest `/i-<token>/…` |
| `CREEZIO_FLEET_OPS_USER` / `_PASS` / `_TOKEN` | idem | Auth ops Basic / Bearer |
| `CREEZIO_FLEET_DIR` / `FLEET_DIR` | idem | State JSON |
| `FLEET_PUBLIC_DOMAIN` / `CREEZIO_FLEET_DOMAIN` | — | Domaine public (docs / NPM) |
| `CREEZIO_FLEET_TUNNEL_SUFFIX` | — | Fallback hostname `${slug}.${suffix}` |
| `CREEZIO_FLEET_UI_TITLE` / `_MARK` / `_HOME_TITLE` / `_REALM` | — | Branding UI |
| `CREEZIO_FLEET_UI_EXTRAS_TITLE` | — | Carte extras (ex. « Dossiers VASP ») |
| `CREEZIO_FLEET_UI_ETAT_LABELS` | — | JSON labels états extras |

## Endpoints

- Ingest : `POST /i-<token>/heartbeat|crash|bundle`, `GET/POST …/commands`
- Ops : `/` UI + `/ops/api/*` (Basic / Bearer)

## Extras métier (marques)

Le collector accepte `dossierStats` opaque dans le heartbeat (agrégation + UI
si présent). L’émission métier reste marque — ex. Certivan
`electron/fleet-dossier-samples.ts` via `getHeartbeatExtras`.

## Tests

```bash
npm run test:fleet-collector -w @creezio/observability
# ou
node packages/observability/fleet-collector/test-fleet-collector.mjs
```

## DNS / NPM (VPS)

```bash
FLEET_PUBLIC_DOMAIN=fleet.example.com FLEET_PORT=8665 \
CF_ENV=/path/to/.cloudflare.env \
bash packages/observability/fleet-collector/configure-fleet-npm.sh
```
