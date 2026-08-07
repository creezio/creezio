# Runbook flotte Creezio — opérations récurrentes

**Source of truth : [`.cursor/skills/creezio-fleet-ops/SKILL.md`](../.cursor/skills/creezio-fleet-ops/SKILL.md)**
(skill Cursor versionné — chargé automatiquement par les agents ; ce fichier
n'est qu'un index pour la lecture humaine / hors Cursor. Ne pas dupliquer le
contenu ici : éditer le skill).

Chaque procédure y est au format « Objectif → Commande exacte → Vérification
→ Où est la vérité (fichier) → Pièges », avec les commandes copiables
vérifiées sur le VPS TempoFlow.

## Table des matières (sections du skill)

1. **Créer un serveur** — `creezio server-docker create` (+ `--profile prod`,
   `--browser`), registre `docker-data/servers.json`, tunnel `{slug}.tempoflow.fr` ;
   clé assistant : `OPENAI_API_KEY` hôte forwardée par `--profile prod`
   (vérif `GET /api/v1/assistant/llm-status`)
2. **Créer un compte owner / user en headless** — `POST /api/v1/os/setup`
   (local-config) **et** `migrateBrandCredentialsToKit` (`creezio_users`,
   core.db) ; collaborateurs via `POST /api/v1/platform/users`
3. **Login / vérifier un compte** — `POST /api/v1/auth/login`
   (`{"email","password"}`), cookie `<brandId>_session`, `GET /api/v1/auth/me`
4. **Publier une image, updater, rollback** — `server-docker publish --tag`,
   registre `127.0.0.1:5000`, update admin async (202 + `update-status`),
   backup + rollback auto
4b. **Déployer sur toute la flotte (releases pull)** — `publish --release`
   (draft), registre pull-only `registry.{zone}`, cycle
   draft → rolling (canary `wave_pct`) → done, kill-switch
   `paused`/`aborted`, hold/pin/canal par serveur, auto-pause sur échecs —
   ADR [adr/ADR-fleet-updates-docker-images.md](./adr/ADR-fleet-updates-docker-images.md)
5. **Admin flotte** — `admin up --admin-root …`, `server-admin.json` /
   `fleet-hosts.json`, Basic auth, `admin.tempoflow.fr`
6. **Agent hôte + enrôlement VPS** — `agent up`, enrollToken one-shot,
   `enroll --admin … --token … --slug …`, `agent.{slug}.{zone}`
7. **Client desktop thin** — `pack:win` / `electron:publish`, feed `/tf3/`,
   GUID dédié, `defaultServerUrl` / `TF3_DEFAULT_SERVER_URL`
8. **Diagnostics boot** — `boot-status`, `health`, `version`, `ready`,
   logs JSONL `boot-step`, `/data/ops/*.jsonl`, `crash:list`
9. **Pièges connus** — ordre catalogue/listen, AUTH_SECRET par instance,
   setup ≠ login, vendor browser-host, symlinks electron-builder, publish
   local pas SSH, feed TF2, collector :8665, slugs réservés, timeouts
   Cloudflare, nommage Compose
10. **Entretien disque Docker (VPS)** — GC BuildKit native (`daemon.json`
    `builder.gc`), timer `docker-disk-maintenance` quotidien (prune sans
    `-a` + `--keep-storage` + rétention registre 5 tags + alerte ≥ 85 %),
    rétention auto post-publish (`--keep-tags` / `--no-retention`)
11. **n8n & Hermes embarqués** — superadmin flotte
    (`CREEZIO_SUPERADMIN_EMAIL/_PASSWORD`), owner n8n silencieux, clé API n8n
    (`.{brand}-n8n-api-key.json` → env Hermes), webhooks publics, MCP, skills
    seedés au boot
12. **Intégrations / clés API tierces** — page `/admin/integrations`, API
    `/api/v1/platform/integrations` (CRUD owner + `resolve` par référence
    `integration://<slug>` via clé service Hermes), sync push vers le n8n
    embarqué (`creezio:<slug>`), secrets chiffrés `core.db`

## Docs liées

- [`docker/server/README.md`](../docker/server/README.md) — serveurs headless
- [`docker/server-admin/README.md`](../docker/server-admin/README.md) — admin web
- [`docker/tunnel-provisioner/README.md`](../docker/tunnel-provisioner/README.md) — tunnels
- [`docs/adr/ADR-tunnel-flat-hosts.md`](./adr/ADR-tunnel-flat-hosts.md) — nested vs flat (Universal SSL)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — vue d'ensemble
