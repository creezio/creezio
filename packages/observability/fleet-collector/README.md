# Fleet Collector — `@creezio/observability` (D-P25)

Service ops autonome (loopback HTTP + store JSON) : ingest télémétrie opt-in
desktop + cockpit ops. **SoT kit** — 0 domaine marque hardcodé.

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

Marques (après vendor sync) :

```bash
node vendor/creezio/observability/fleet-collector/server.mjs
# ou wrapper mince crm/scripts/fleet-collector/server.mjs
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
