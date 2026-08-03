# AGENTS — `docker/server`

## Mission

SoT **générique kit** pour lancer des serveurs marque headless (HTTP API)
via Docker, multi-instances, sans AppImage/Electron.

## Ne pas faire

- Hardcoder un métier TF/CV/Fidu dans le Dockerfile.
- Utiliser le project name Compose d’un stack prod (`tempoflow`, `n8n`, …) —
  rester sur `creezio-servers` / override marque `tf3-servers`.
- Noms d’instances en lettres (`server-a`) — **chiffres uniquement**
  (`server-1`, `server-2`, …).
- Committer secrets tunnel/catalog dans compose ou `.env` versionné.
- Dupliquer l’orchestration OS : le CMD doit rester le harness marque →
  `startBrandKernelHarness`.

## Points d’entrée

| Fichier | Rôle |
|---------|------|
| `Dockerfile` | Image générique (context = racine marque) |
| `docker-compose.yml` | Exemple `server-1` + `server-2` |
| `brand.dockerignore` | Template ignore (posé en `.dockerignore` marque) |
| `README.md` | Doc humaine launch 1/N + config Docker vs Electron |
| CLI `creezio server-docker` | `build` / `up` / `down` / `ps` / `proof` + `.desktop` |

## Config

- Volumes : `{BRAND_ROOT}/docker-data/servers/server-N` → `/data` (= userData).
- First-run : UI HTTP `/setup` (pas de tray/NSIS) ; seed via env `CREEZIO_*`.
- Raccourcis : `{Product}-Server-{N}.desktop` sur `~/Desktop` + `~/Bureau`.

## Modifier

1. Bind HTTP : `CREEZIO_HTTP_HOST` géré dans `listenBrandOsHttp` /
   `listenBrandKernelHttp` — ne pas forcer `127.0.0.1` dans l’image.
2. Warm natif off par défaut (`CREEZIO_NATIVE_WARM=0`) pour image légère.
3. Après changement runtime consommé : `npm run build -w @creezio/app-runtime`
   (+ electron-shell si besoin) puis sync vendor marque.

## Preuve

```bash
creezio server-docker proof --brand-root /opt/docker/tempoflow3
curl -sS http://127.0.0.1:18791/api/v1/core/health   # server-1
curl -sS http://127.0.0.1:18792/api/v1/core/health   # server-2
# brandId cohérent, HTTP 200, containers server-1/2, .desktop présents
```
