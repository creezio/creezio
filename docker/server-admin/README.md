# Creezio Server Admin — admin web multi-serveurs Docker

Admin web des serveurs marque headless (`docker/server`), servi par
`packages/observability/fleet-collector/server-admin.mjs` (Node pur, zéro
dépendance npm — même esprit que le fleet collector). Point d'entrée
**séparé** de `server.mjs` : le service fleet-collector prod n'est pas touché.

## Usage

Voie nominale : depuis le **repo admin dédié** de la marque (`<brand>-admin`,
privé — ex. `creezio/tempoflow-admin`), config auto-générée dans
`{adminRoot}/docker-data/server-admin.json` :

```bash
creezio server-docker admin up --admin-root <adminRoot> [--port 18800]
creezio server-docker admin status --admin-root <adminRoot>
creezio server-docker admin down  --admin-root <adminRoot>
# → http://127.0.0.1:18800/admin (Basic auth)
```

Legacy (`--brand-root <brandRoot>`) : config sous
`{brandRoot}/docker-data/server-admin.json` — toujours lu, plus généré.

Ajouter une autre marque à un admin existant (append au `server-admin.json`
puis recreate du container, nouveau volume monté) :

```bash
creezio server-docker admin add-brand <autreBrandRoot> --brand-root <brandRoot>
```

Build manuel de l'image :

```bash
docker build -f docker/server-admin/Dockerfile \
  -t creezio-server-admin:local packages/observability/fleet-collector
```

Lancement direct sans Docker (dev) :

```bash
CREEZIO_ADMIN_PASS=secret \
CREEZIO_ADMIN_BRAND_ROOTS=<brandRoot> \
node packages/observability/fleet-collector/server-admin.mjs
# ou via le bin npm : creezio-server-admin
```

## Env

| Variable | Défaut | Rôle |
|----------|--------|------|
| `CREEZIO_ADMIN_PORT` | `18800` | Port HTTP |
| `CREEZIO_ADMIN_HOST` | `127.0.0.1` | Bind (loopback only par défaut) |
| `CREEZIO_ADMIN_USER` | `admin` | Login Basic auth |
| `CREEZIO_ADMIN_PASS` | — | **Obligatoire** — refus de démarrer sinon |
| `CREEZIO_ADMIN_BRAND_ROOTS` | — | Racines marques séparées par `:` |
| `CREEZIO_DOCKER_SOCK` | `/var/run/docker.sock` | Socket Docker Engine |

## Fonctionnalités

- Liste fusionnée des instances de **toutes** les marques
  (SoT `{brandRoot}/docker-data/servers.json`, conventions
  `packages/factory/src/server-docker-registry.ts`) + containers orphelins
  labellisés `creezio.server=1`.
- Create / start / stop / rm (+ purge data) via Docker Engine API
  (socket unix, specs identiques au CLI `creezio server-docker`).
- Barre de progression de boot en live (proxy `GET /api/v1/os/boot-status`),
  logs docker démultiplexés, événements ops JSONL, tailles disque.
- L'image serveur marque n'est **pas** buildée depuis l'admin : si elle est
  absente → 409 avec l'invite `creezio server-docker build`.

## Sécurité

- Bind `127.0.0.1` par défaut : accessible uniquement en loopback (session
  RDP/SSH sur l'hôte, ou tunnel SSH `ssh -L 18800:127.0.0.1:18800 …`).
  Le container tourne en `--network host` précisément pour que ce bind
  loopback reste effectif et que les serveurs (`127.0.0.1:<port>`) soient
  joignables.
- Basic auth obligatoire (timing-safe) sur **toutes** les routes `/admin*`.
- Le socket docker monté donne un contrôle root-équivalent sur l'hôte :
  ne jamais exposer ce service hors loopback sans reverse-proxy TLS + auth.
- Audit console de chaque action mutante (create/start/stop/rm).
