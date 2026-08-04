# AGENTS — `docker/server`

## Mission

SoT **générique kit** pour lancer des serveurs marque headless (HTTP API +
CRM web Next) via Docker, multi-instances, sans AppImage/Electron.

## Ne pas faire

- Hardcoder un métier TF/CV/Fidu dans le Dockerfile (gate le vérifie).
- Utiliser le project name Compose d'un stack prod (`tempoflow`, `n8n`, …) —
  rester sur `creezio-servers` / override marque `tf3-servers`.
- Instances **Compose** en lettres (`server-a`) — chiffres uniquement
  (`server-1`, `server-2`, …). Les instances **registre**
  (`creezio server-docker create <nom>`) sont nommées librement
  (`[a-z0-9][a-z0-9-]*`) → containers `<brandId>-server-<nom>`.
- Publier les ports sur `0.0.0.0` par défaut — loopback obligatoire,
  exposition opt-in (`--expose` / `SERVER_BIND`).
- Committer secrets tunnel/catalog dans compose ou `.env` versionné.
- Dupliquer l'orchestration OS : le CMD doit rester le harness marque →
  `startBrandKernelHarness`.

## Points d'entrée

| Fichier | Rôle |
|---------|------|
| `Dockerfile` | Image générique (context = racine marque, Meili + UI Next embarqués) |
| `docker-compose.yml` | Legacy `server-1` + `server-2` (bind 127.0.0.1) |
| `brand.dockerignore` | Template ignore v2 (posé/rafraîchi en `.dockerignore` marque) |
| `creezio-open-url.sh` | Opener navigateur (firefox/gio/xdg-open…) → `~/bin/` |
| `README.md` | Doc humaine (registre, admin, sécurité, boot-status) |
| `REMOTE-ACCESS.md` | Reverse proxy nginx-proxy-manager |
| CLI `creezio server-docker` | `create/start/stop/rm/logs/ls/admin` + `build/up/down/ps/proof` |
| `../server-admin/` | Image admin web (fleet-collector étendu) |

## Config

- Registre : `{BRAND_ROOT}/docker-data/servers.json` (SoT instances —
  `packages/factory/src/server-docker-registry.ts`).
- Volumes : `{BRAND_ROOT}/docker-data/servers/<nom>` → `/data` (= userData).
- Boot observable : early-listen `GET /api/v1/os/boot-status` (SplashViewModel
  JSON), JSONL par étape dans `docker logs`, ops journal `/data/ops/`.
- First-run : UI HTTP `/setup` (pas de tray/NSIS) ; seed via env `CREEZIO_*`.
- Recherche : Meili embarqué (`MEILI_BINARY=/opt/creezio/bin/meilisearch`).
- n8n/Hermes : opt-in `CREEZIO_NATIVE_WARM=1` (`create --warm`).
- Raccourcis compose : `{Product}-Server-{N}.desktop` → `~/bin/open-creezio-server-N`
  (**jamais** `Exec=xdg-open` seul — souvent absent hors desktop).

## Modifier

1. Bind HTTP : `CREEZIO_HTTP_HOST` géré dans `listenBrandOsHttp` /
   `listenBrandKernelHttp` — ne pas forcer `127.0.0.1` dans l'image
   (le loopback se fait au publish côté hôte).
2. Warm natif off par défaut (`CREEZIO_NATIVE_WARM=0`) pour image légère.
3. Après changement runtime consommé : `npm run build -w @creezio/app-runtime`
   (+ electron-shell si besoin) puis sync vendor marque.
4. Gate : `node --test scripts/test-phase-server-docker.mjs`.

## Preuve

```bash
creezio server-docker create demo --brand-root /opt/docker/tempoflow3
curl -sS http://127.0.0.1:1879X/api/v1/os/boot-status | head -c 300
curl -sS http://127.0.0.1:1879X/api/v1/core/health
curl -sSI http://127.0.0.1:1879X/login        # CRM web (200, pas 404)
creezio server-docker admin up --brand-root /opt/docker/tempoflow3
# brandId cohérent, HTTP 200, boot-status avec étapes, admin liste l'instance
```
