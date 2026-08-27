# @creezio/observability

## 0.10.11

### Patch Changes

- @creezio/platform-core@0.10.11
- @creezio/api-kernel@0.10.11

## 0.10.10

### Patch Changes

- Updated dependencies [4ecd205]
  - @creezio/platform-core@0.10.10
  - @creezio/api-kernel@0.10.10

## 0.10.9

### Patch Changes

- @creezio/platform-core@0.10.9
- @creezio/api-kernel@0.10.9

## 0.10.8

### Patch Changes

- Updated dependencies [a2fea46]
  - @creezio/api-kernel@0.10.8
  - @creezio/platform-core@0.10.8

## 0.10.7

### Patch Changes

- 55b1cd5: **feat — catalogue `listOperations()` + tools MCP générés + doctor ops non vides.**

  `api.listOperations()` alimente `/admin/api` (plus seulement la surface Hono). Les tools `module.<mountId>.<op.id>` sont générés depuis ce catalogue (handler = requête HTTP synthétique). Doctor fail-closed : `MODULE_OP_MISSING` si `apiMounts` sans `operations[]` **non vide** (pin ≥ 0.10.6) ; EntitySpec seul = OK (CRUD auto) ; `mcpTools` restant = `MODULE_MCP_TOOLS_DEPRECATED` (warn). Mounts kit/OS hors `modules/*.ts` non scannés.

- Updated dependencies [55b1cd5]
  - @creezio/api-kernel@0.10.7
  - @creezio/platform-core@0.10.7

## 0.10.6

### Patch Changes

- 1c7ec66: **feat — SoT unique : une opération de module = HTTP + /admin/api + tool MCP.**

  `ModuleOperation` sur `ApiMount` / EntitySpec (CRUD auto). Le kit collecte puis génère les tools `module.<mountId>.<op.id>` (handler = requête HTTP synthétique). Catalogue `/admin/api` = ops kernel, plus seulement la surface Hono admin. `mcpTools()` déprécié (doctor error si recouvrement). Doctor fail-closed `MODULE_OP_MISSING` / `MODULE_OP_UNCATALOGUED` depuis 0.10.6. Enable MCP = policies sur tools générés (`mcpPublishDefault`, `roles`).

- Updated dependencies [1c7ec66]
  - @creezio/api-kernel@0.10.6
  - @creezio/platform-core@0.10.6

## 0.10.5

### Patch Changes

- 6bce6a8: **fix(server-docker) — owner persisté dans secrets.env + ensure-owner.**

  `create` écrit `CREEZIO_OWNER_*` dans `docker-data/stacks/<nom>/secrets.env` (chmod 600, `env_file`) — plus seulement un POST hôte oublié ensuite. `update` fusionne `secrets.env` : owner / `CREEZIO_E2E_*` ne sont plus droppés. Nouveau geste `creezio server-docker ensure-owner <nom>` : first-run si setup incomplet, sinon seed recette + vérif login, recreate **app seule** (sidecar / tunnel intact). Fail-closed VPS inchangé. Jamais le mot de passe en log ni dans le registre.

  - @creezio/platform-core@0.10.5
  - @creezio/api-kernel@0.10.5

## 0.10.4

### Patch Changes

- @creezio/platform-core@0.10.4
- @creezio/api-kernel@0.10.4

## 0.10.3

### Patch Changes

- 5f8a383: **fix(update) — ne peut plus retirer cloudflared / changer le hostname.**

  `server-docker update` (et tout recreate compose) préserve un sidecar `cloudflared*` historique : seule l'image app change, `tunnel.env` / id / hostname inchangés, `up` sans `--remove-orphans`. Si une adresse publique est persistée sans sidecar (et sans contrat in-process), l'update **refuse** plutôt que de publier un compose app-seule (incident Tempoflow restos, 0.10.2 → 530/1033). Dev `CREEZIO_TUNNEL_LOCAL=1` inchangé. `migrate-stack` seul retire un sidecar et **réutilise** le tunnel existant — jamais un 2e hostname à l'update.

  - @creezio/platform-core@0.10.3
  - @creezio/api-kernel@0.10.3

## 0.10.2

### Patch Changes

- @creezio/platform-core@0.10.2
- @creezio/api-kernel@0.10.2

## 0.10.1

### Patch Changes

- @creezio/platform-core@0.10.1
- @creezio/api-kernel@0.10.1

## 0.10.0

### Minor Changes

- 96464bc: **BREAKING — Tunnel Cloudflare auto-provisionné par l'instance (fin du provisioner VPS et du sidecar cloudflared).**

  Le conteneur Docker crée, configure et sert son tunnel Cloudflare lui-même au boot via l'API CF (client `tunnel-cf-client` de `@creezio/platform-core`, Node pur, zéro dépendance) : GET du tunnel persisté dans `/data` → 404/token absent → recréation idempotente (le CNAME suit le nouvel id), PUT ingress (`http://127.0.0.1:18791` + services + hostnames supplémentaires multi-domaines sur le même tunnel), upsert DNS idempotent, cloudflared spawné **in-process** (binaire pinné `2026.7.3` dans l'image), sonde publique en arrière-plan non fatale.

  - **Contrat d'env** : `CREEZIO_CF_API_TOKEN` / `CREEZIO_CF_ACCOUNT_ID` / `CREEZIO_CF_ZONE_ID` (requis), `CREEZIO_CF_ZONE_NAME` / `CREEZIO_CF_UNIVERSAL_SSL` / `CREEZIO_TUNNEL_SLUG` / `CREEZIO_DOMAIN` (optionnels) — livrés au conteneur via `cf.env` (chmod 600) généré par `server-docker create`. `CREEZIO_TUNNEL_PROVISION_URL` / `_TOKEN` et `resolveTunnelProvision` sont **supprimés** (pas de fallback).
  - **Compose généré** : plus de service `cloudflared` sidecar ; `tunnel.env` → `cf.env` (600) ; secrets applicatifs isolés dans `secrets.env` (600) — aucun secret dans `environment:`.
  - **Nommage des hostnames de services** : `CREEZIO_CF_UNIVERSAL_SSL` truthy → nested (`n8n.{slug}.{zone}`) ; défaut **flat** (`n8n-{slug}.{zone}`). Remplace `CREEZIO_TUNNEL_FLAT_HOSTS`.
  - **CLI** : `create` est **fail-closed** (héritage #84/#86) : sans `CREEZIO_CF_*` (sauf `CREEZIO_TUNNEL_LOCAL=1`) **ou** sans owner VPS, échec actionnable — plus de loopback silencieux. Le contrat CF part dans `cf.env` (verify du token, aucun `/reserve`, aucun secret dans le registre). `rm` déprovisionne via l'API CF directe (DNS + tunnel) ; `enroll` gère l'ingress `agent[-.]{slug}` via le client CF ; `migrate-stack` bascule sidecar/legacy → in-container. Les instances live déjà up ne sont pas migrées par ce merge.
  - **Supprimé** : `docker/tunnel-provisioner/` entier (service, lib, docs).

  Migration des instances existantes : `creezio server-docker migrate-stack <nom> --brand-root …` avec le contrat `CREEZIO_CF_*` dans l'env (voir docs/RUNBOOK-AGENTS.md §7.3).

### Patch Changes

- Updated dependencies [96464bc]
  - @creezio/platform-core@0.10.0
  - @creezio/api-kernel@0.10.0

## 0.9.4

### Patch Changes

- @creezio/platform-core@0.9.4
- @creezio/api-kernel@0.9.4

## 0.9.3

### Patch Changes

- @creezio/platform-core@0.9.3
- @creezio/api-kernel@0.9.3

## 0.9.2

### Patch Changes

- 10b5198: server-docker backup : tar exécuté dans un conteneur éphémère (image de l'instance) au lieu du tar hôte. Le volume `/data` contient des fichiers root-owned 600 écrits par le conteneur (token plugins, config) et `backups/` peut être root-owned : le tar hôte en user deploy produisait une archive incomplète (fichiers skippés) ou non créable (tar exit 2, update annulé — vécu tempoflow 2026-08-12). Via le socket docker (groupe docker, sans sudo), le tar tourne en root : archive complète, écriture garantie, puis `chown` au uid/gid appelant pour la rétention. Comportement identique sur tous les hôtes.
  - @creezio/platform-core@0.9.2
  - @creezio/api-kernel@0.9.2

## 0.9.1

### Patch Changes

- @creezio/platform-core@0.9.1
- @creezio/api-kernel@0.9.1

## 0.9.0

### Patch Changes

- @creezio/platform-core@0.9.0
- @creezio/api-kernel@0.9.0

## 0.8.1

### Patch Changes

- @creezio/platform-core@0.8.1
- @creezio/api-kernel@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [848ec06]
  - @creezio/api-kernel@0.8.0
  - @creezio/platform-core@0.8.0

## 0.7.1

### Patch Changes

- @creezio/platform-core@0.7.1
- @creezio/api-kernel@0.7.1

## 0.7.0

### Minor Changes

- adf6d46: **M2 — 1 instance serveur = 1 stack compose autonome (app + cloudflared sidecar).**

  - `server-docker create` génère par défaut un stack compose par instance :
    port interne fixe 18791, port hôte loopback auto (`127.0.0.1::18791`,
    `--host-port N` pour un fixe), sidecar cloudflared (token dans
    `tunnel.env` chmod 600), zéro port public. `--no-stack` = legacy.
  - `server-docker migrate-stack <nom>` : bascule une instance legacy en
    douceur — backup /data obligatoire, ingress tunnel repointé
    `http://app:18791` (provisioner `serviceHost`), rollback legacy auto si KO.
  - Kernel : mode sidecar (`CREEZIO_TUNNEL_SIDECAR=1`) — config tunnel seedée
    par env (`CREEZIO_TUNNEL_TOKEN/_HOSTNAME/_ID`), ingress via provisioner
    avec `serviceHost`, `startCloudflared` no-op (le sidecar tourne déjà).
  - Provisioner : `/reserve` et `/configure` acceptent `serviceHost` (défaut
    127.0.0.1 — rétrocompatible), persisté dans le state du slug.
  - `update` stack-aware (server-lib) : compose régénéré avec la nouvelle
    image, `compose up -d`, registre réaligné sur le port hôte réattribué.
  - start/stop/rm/logs/ls stack-aware ; SoT renderer partagée
    (`fleet-collector/instance-stack.mjs`) entre CLI factory et server-lib.
  - dev-stack (Q1) matérialise les pages OS avant `next dev` (le hook predev
    de server/ui est contourné par le spawn direct — Q5 appliqué au dev).

### Patch Changes

- @creezio/platform-core@0.7.0
- @creezio/api-kernel@0.7.0

## 0.6.0

### Patch Changes

- @creezio/platform-core@0.6.0
- @creezio/api-kernel@0.6.0

## 0.5.0

### Patch Changes

- d674c86: Peers internes @creezio/\* en `>=0.4.0` (au lieu de `^0.4.0`) : ?vite que le
  train lockstep escalade en 1.0.0 au premier bump minor (les peers restent
  satisfaits par toute version future du kit).
- Updated dependencies [d674c86]
  - @creezio/platform-core@0.5.0
  - @creezio/api-kernel@0.5.0
