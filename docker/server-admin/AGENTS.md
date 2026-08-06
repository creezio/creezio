# AGENTS — `docker/server-admin`

## Mission

Image de l'admin web multi-serveurs (backend flotte). Le code vit dans
`packages/observability/fleet-collector/server-admin.mjs` (+ `admin-docker.mjs`,
`registry-pull-proxy.mjs`, `server-lib.mjs`) — ce dossier contient le
`Dockerfile` et le script d'exposition `configure-admin-npm.sh`.

## Ne pas faire

- Ajouter des dépendances npm (Node pur, même esprit que le fleet-collector).
- Toucher `server.mjs` (fleet-collector prod) pour un besoin admin : le point
  d'entrée admin est séparé (`server-admin.mjs`).
- Binder hors `127.0.0.1` par défaut : le socket Docker monté équivaut à root
  sur l'hôte. Exposition publique = reverse-proxy TLS + auth uniquement
  (`configure-admin-npm.sh`).
- Autoriser une méthode push sur le proxy registre `/v2/*` (pull-only, F4 —
  gate `scripts/test-phase-registry-pull-proxy.mjs`).

## Piège connu

Le code est **embarqué au build de l'image** : après toute modif de
`fleet-collector/*.mjs`, re-runner `creezio server-docker admin up`
(rebuild + recreate), sinon l'admin continue de servir l'ancien code.

## Tests / gates

```bash
cd /opt/docker/creezio
node --test scripts/test-phase-registry-pull-proxy.mjs
node --test scripts/test-phase-fleet-releases.mjs
node packages/observability/fleet-collector/test-server-admin.mjs
```

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
- [../../packages/observability/AGENTS.md](../../packages/observability/AGENTS.md)
