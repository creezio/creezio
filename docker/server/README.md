# Serveurs marque Docker (headless)

Lancer le **kernel OS + métier** d’une marque Creezio en mode serveur HTTP,
**sans** build Electron / AppImage. Multi-instances via Compose (ports + volumes DB isolés).

Complémentaire du pack Electron `pack:linux:server` : même harness
(`startBrandKernelHarness` → `listenBrandOsHttp`), packaging différent.

## Prérequis

- `docker` + `docker compose` (plugin v2+)
- Marque avec `scripts/brand-kernel-harness.mjs` + `vendor/creezio`
- `npm run build:electron` côté marque (dossier `build/` requis)

## Nommage des instances

Les services Compose s’appellent **`server-1`**, **`server-2`**, … (chiffres uniquement).
Pas de lettres (`server-a` / `server-b` interdit).

| Instance | Port hôte (défaut) | Volume data | Raccourci bureau |
|----------|-------------------|-------------|------------------|
| `server-1` | `SERVER_1_PORT` → `18791` | `$DATA_DIR/server-1` | `{Product}-Server-1.desktop` |
| `server-2` | `SERVER_2_PORT` → `18792` | `$DATA_DIR/server-2` | `{Product}-Server-2.desktop` |

`DATA_DIR` par défaut : `{BRAND_ROOT}/docker-data/servers`.

## Variables

| Variable | Défaut | Rôle |
|----------|--------|------|
| `BRAND_ROOT` | — | Racine marque (build context) |
| `CREEZIO_KIT_ROOT` | `/opt/docker/creezio` | Kit (Dockerfile / compose) |
| `BRAND_ID` | `tempoflow3` | Identité (doc / env) |
| `SERVER_1_PORT` / `SERVER_2_PORT` | `18791` / `18792` | Ports hôte |
| `METIER_PORT` / `PORT` | `18791` | Port dans le container |
| `METIER_DATA_DIR` | `/data` | Volume SQLite (`core`/`brand`) |
| `CREEZIO_HTTP_HOST` | `0.0.0.0` | Bind Docker (obligatoire) |
| `CREEZIO_NATIVE_WARM` | `0` | Skip n8n/Hermes au boot |
| `CREEZIO_TUNNEL_*` / `CREEZIO_CATALOG_*` | — | Optionnels (ne pas committer) |
| `SERVER_DESKTOP_PRODUCT` | BrandSpec `brandName` | Prefixe des `.desktop` |

## Config Docker vs Electron (first-run / setup)

| Aspect | Electron (exe / AppImage / NSIS) | Docker headless |
|--------|----------------------------------|-----------------|
| userData | `{installDir}/data/` (packagé) | volume `docker-data/servers/server-N` → `/data` |
| First-run / setup | Wizard UI dans la fenêtre desktop | **HTTP same-origin** : `/setup`, puis `/settings` |
| Tray / NSIS / splash | Oui | **Non** — pas de chrome natif |
| Secrets / seed | Fichiers sous userData + UI | Env `CREEZIO_*` au `up` + pages `/setup` / `/settings` |
| Isolation multi-tenant | Un installDir par machine | Un volume + port par `server-N` |

Chaque instance a sa propre DB SQLite sous
`{BRAND_ROOT}/docker-data/servers/server-N/` (monté `/data` = `METIER_DATA_DIR`).
Configurer l’instance **1** n’affecte pas l’instance **2**.

Flux typique first-run Docker :

1. `creezio server-docker up --brand-root …`
2. Ouvrir le raccourci bureau ou `http://127.0.0.1:18791/`
3. Compléter `/setup` dans le navigateur (même API que le desktop)
4. Ajuster ensuite via `/settings` ou en passant des env `CREEZIO_*` au compose

## 1 serveur

```bash
export CREEZIO_KIT_ROOT=/opt/docker/creezio
export BRAND_ROOT=/opt/docker/tempoflow3
cd "$BRAND_ROOT" && npm run build:electron

# Image
creezio server-docker build --brand-root "$BRAND_ROOT"

# Une instance (ne lancer que server-1)
docker compose -p creezio-servers \
  -f "$CREEZIO_KIT_ROOT/docker/server/docker-compose.yml" \
  up -d --build server-1

curl -sS "http://127.0.0.1:18791/api/v1/core/health"
# → {"ok":true,"brandId":"tempoflow3",...}
```

## N serveurs (preuve 2 instances)

```bash
creezio server-docker up --brand-root /opt/docker/tempoflow3
# ou : npm run server-docker:up -- --brand-root /opt/docker/tempoflow3

curl -sS http://127.0.0.1:18791/api/v1/core/health   # server-1
curl -sS http://127.0.0.1:18792/api/v1/core/health   # server-2

# Raccourcis générés (Linux RDP / bureau) :
#   ~/Desktop/TempoFlow-Server-1.desktop
#   ~/Bureau/TempoFlow-Server-1.desktop
#   (idem Server-2) — Exec: xdg-open http://127.0.0.1:PORT/

creezio server-docker down --brand-root /opt/docker/tempoflow3
```

**Projet Compose** : `creezio-servers` (ne touche pas `tempoflow`, `n8n`, etc.).
Override marque TF3 : `--project tf3-servers`.

## Raccourcis bureau Linux

À chaque `up` / `proof`, le CLI écrit des `.desktop` sur `~/Desktop` et `~/Bureau`
(s’ils existent) :

- Nom : `{Product}-Server-{N}.desktop` (ex. `TempoFlow-Server-1.desktop`)
- `Exec` : `xdg-open 'http://127.0.0.1:PORT/'`
- `Icon` : `resources/icons/server.png` (ou `brand-spec/icons/server.png`)

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
