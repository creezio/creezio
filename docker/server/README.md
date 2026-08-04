# Serveurs marque Docker (headless)

Lancer le **kernel OS + métier + CRM web** d’une marque Creezio en mode
serveur HTTP, **sans** build Electron / AppImage. Multi-instances par registre
(`docker-data/servers.json`) ou Compose legacy (ports + volumes DB isolés).

Complémentaire du pack Electron `pack:linux:server` : même harness
(`startBrandKernelHarness` → `listenBrandOsHttp`), packaging différent.

L'image embarque :

- le kernel + API `/api/v1/*` + MCP (comme le desktop)
- **Meilisearch Linux** (`/opt/creezio/bin/meilisearch`) — recherche réelle,
  plus de sql-fallback
- l'**UI Next standalone** (`ui/.next/standalone`) servie derrière le port
  unique → `http://127.0.0.1:PORT/` = CRM complet (setup, login, mails,
  tâches, admin…)
- le **boot-status** : `GET /api/v1/os/boot-status` répond dès le lancement
  (early-listen) avec le même modèle que le splash desktop (étapes, %,
  chronos) ; chaque transition = une ligne JSONL dans `docker logs` ;
  journal ops JSONL sous `/data/ops/`

## Une ligne (recommandé) — registre d'instances

```bash
creezio server-docker create demo --brand-root "$BRAND_ROOT"
# → build image si absente, port auto (18790+n), bind 127.0.0.1,
#   attend le boot (progression live), CRM sur http://127.0.0.1:18793/

creezio server-docker ls     --brand-root …   # instances + état docker
creezio server-docker stop   demo --brand-root …
creezio server-docker start  demo --brand-root …
creezio server-docker logs   demo --brand-root … [--tail 500] [--follow]
creezio server-docker rm     demo --brand-root … [--purge-data]
```

Registre : `{BRAND_ROOT}/docker-data/servers.json` — nom, port, volume,
marque. Image par marque : `creezio-server-<brandId>:local`, containers
`<brandId>-server-<nom>` (multi-marques sans collision).

Options `create` : `--port N`, `--expose` (bind 0.0.0.0 — sinon loopback),
`--warm` (n8n/Hermes dans le container), `--env K=V` (répétable).

## Admin web multi-serveurs

```bash
creezio server-docker admin up --brand-root "$BRAND_ROOT"
# → http://127.0.0.1:18800/admin (Basic auth —
#   credentials dans docker-data/server-admin.json)
```

Container `creezio-server-admin` (fleet-collector étendu, `--network host`,
`/var/run/docker.sock` monté) : liste des serveurs, create/start/stop/rm,
barre de boot-status live (rendu splash), health/version, logs docker +
ops JSONL, disque. Voir `docker/server-admin/README.md`.

## Sécurité

- Ports publiés sur **127.0.0.1** par défaut (CLI registre et Compose).
  Opt-in exposition : `--expose` (create) ou `SERVER_BIND=0.0.0.0` (compose).
- Accès distant recommandé : reverse proxy (nginx-proxy-manager) + TLS —
  voir [REMOTE-ACCESS.md](./REMOTE-ACCESS.md).

## Prérequis

- `docker` + `docker compose` (plugin v2+)
- Marque avec `scripts/brand-kernel-harness.mjs` + `vendor/creezio`
- `npm run build:runtime` côté marque (dossier `build/` requis)
- `npm run build:ui` si la marque a `ui/` (CRM web — le CLI `build` le fait)

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
| `CREEZIO_KIT_ROOT` | racine du kit | Kit (Dockerfile / compose) |
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
export CREEZIO_KIT_ROOT=<racine du kit>
export BRAND_ROOT=<racine de la marque>
cd "$BRAND_ROOT" && npm run build:runtime

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
creezio server-docker up --brand-root "$BRAND_ROOT"
# ou : npm run server-docker:up -- --brand-root "$BRAND_ROOT"

curl -sS http://127.0.0.1:18791/api/v1/core/health   # server-1
curl -sS http://127.0.0.1:18792/api/v1/core/health   # server-2

# Raccourcis générés (Linux RDP / bureau) :
#   ~/Desktop/TempoFlow-Server-1.desktop
#   ~/Bureau/TempoFlow-Server-1.desktop
#   Exec → ~/bin/open-creezio-server-1 → creezio-open-url → firefox/…

creezio server-docker down --brand-root "$BRAND_ROOT"
```

**Projet Compose** : `creezio-servers` (ne touche pas `tempoflow`, `n8n`, etc.).
Override marque TF3 : `--project tf3-servers`.

## Raccourcis bureau Linux

À chaque `up` / `proof`, le CLI écrit :

| Artefact | Rôle |
|----------|------|
| `~/bin/creezio-open-url` | Script kit : `~/.local/firefox` → snap firefox → chromium → gio → xdg-open |
| `~/bin/open-creezio-server-N` | Wrapper par instance (URL `http://127.0.0.1:PORT/` figée) + log |
| `~/Desktop\|Bureau/{Product}-Server-{N}.desktop` | `Exec=/…/open-creezio-server-N` (**pas** `xdg-open` direct) |

- Log : `~/.local/state/tempoflow-server/open-server.log`
- Trust XFCE : `gio set … metadata::trusted true` (posé par le CLI)
- `StartupNotify=false` (évite silence XFCE sur wrapper bash)
- Préférer Firefox **tarball** dans `~/.local/firefox` : le snap échoue souvent
  hors cgroup session (`is not a snap cgroup`) sous xrdp / agents.

`Icon` : `resources/icons/server.png` (ou `brand-spec/icons/server.png`).

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

## Santé / observabilité

- `GET /api/v1/os/boot-status` → splash JSON (200 dès le lancement — early-listen)
- `GET /api/v1/core/health` → `200` + `brandId` (503 pendant le boot)
- `GET /api/v1/core/version` → versions kit
- `GET /api/v1/os/status` → hosts (si profile full)
- `GET /api/v1/os/ready` → agrégat P&P (mode `docker` : vendors n8n/Hermes soft)
- `docker logs <container>` → une ligne JSONL `{"creezio":"boot-step",…}` par
  transition d'étape de boot
- `/data/ops/*.jsonl` → journal ops (mêmes kinds que le desktop)
