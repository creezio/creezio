# Serveurs marque Docker (headless)

Lancer le **kernel OS + métier** d’une marque Creezio en mode serveur HTTP,
**sans** build Electron / AppImage. Multi-instances via Compose (ports + volumes DB isolés).

Complémentaire du pack Electron `pack:linux:server` : même harness
(`startBrandKernelHarness` → `listenBrandOsHttp`), packaging différent.

## Prérequis

- `docker` + `docker compose` (plugin v2+)
- Marque avec `scripts/brand-kernel-harness.mjs` + `vendor/creezio`
- `npm run build:electron` côté marque (dossier `build/` requis)

## Variables

| Variable | Défaut | Rôle |
|----------|--------|------|
| `BRAND_ROOT` | — | Racine marque (build context) |
| `CREEZIO_KIT_ROOT` | `/opt/docker/creezio` | Kit (Dockerfile / compose) |
| `BRAND_ID` | `tempoflow3` | Identité (doc / env) |
| `SERVER_A_PORT` / `SERVER_B_PORT` | `18791` / `18792` | Ports hôte |
| `METIER_PORT` / `PORT` | `18791` | Port dans le container |
| `METIER_DATA_DIR` | `/data` | Volume SQLite (`core`/`brand`) |
| `CREEZIO_HTTP_HOST` | `0.0.0.0` | Bind Docker (obligatoire) |
| `CREEZIO_NATIVE_WARM` | `0` | Skip n8n/Hermes au boot |
| `CREEZIO_TUNNEL_*` / `CREEZIO_CATALOG_*` | — | Optionnels (ne pas committer) |

## 1 serveur

```bash
export CREEZIO_KIT_ROOT=/opt/docker/creezio
export BRAND_ROOT=/opt/docker/tempoflow3
cd "$BRAND_ROOT" && npm run build:electron

# Image
creezio server-docker build --brand-root "$BRAND_ROOT"

# Une instance (compose scale manuel : ne lancer que server-a)
docker compose -p creezio-servers \
  -f "$CREEZIO_KIT_ROOT/docker/server/docker-compose.yml" \
  up -d --build server-a

curl -sS "http://127.0.0.1:18791/api/v1/core/health"
# → {"ok":true,"brandId":"tempoflow3",...}
```

## N serveurs (preuve 2 instances)

```bash
creezio server-docker up --brand-root /opt/docker/tempoflow3
# ou : npm run server-docker:up -- --brand-root /opt/docker/tempoflow3

curl -sS http://127.0.0.1:18791/api/v1/core/health   # server-a
curl -sS http://127.0.0.1:18792/api/v1/core/health   # server-b

creezio server-docker down --brand-root /opt/docker/tempoflow3
```

Chaque service a son volume `./data/server-{a,b}` → isolation DB.

**Projet Compose** : `creezio-servers` (ne touche pas `tempoflow`, `n8n`, etc.).

## Wiring marque (TF3 / futures)

Côté marque, minimum :

1. Harness existant (`scripts/brand-kernel-harness.mjs`)
2. Compose override mince (optionnel) — ex. `docker-compose.server.yml` qui
   pointe `BRAND_ROOT=.` et `CREEZIO_KIT_ROOT`
3. `.dockerignore` aligné sur `docker/server/brand.dockerignore` (le CLI le pose)

Pas de domaine métier dans l’image kit : le context = sources marque + vendor.

## Lien Electron server

| Mode | Artefact | Usage |
|------|----------|-------|
| Docker headless | Image `creezio-brand-server` | Flotte / CI / multi-tenant VPS |
| Electron server | AppImage / NSIS `pack:linux:server` | Desktop « héberger » GUI |

Les deux exposent `/api/v1/core/health` + OS HTTP ; Docker n’ouvre pas de `BrowserWindow`.

## Santé

- `GET /api/v1/core/health` → `200` + `brandId`
- `GET /api/v1/core/version` → versions kit
- `GET /api/v1/os/status` → hosts (si profile full)
