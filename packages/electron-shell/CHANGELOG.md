# @creezio/electron-shell

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
  - @creezio/observability@0.10.0
  - @creezio/browser-host@0.10.0
  - @creezio/product-hub@0.10.0
  - @creezio/brand-config@0.10.0
  - @creezio/shell@0.10.0

## 0.9.4

### Patch Changes

- @creezio/brand-config@0.9.4
- @creezio/shell@0.9.4
- @creezio/platform-core@0.9.4
- @creezio/product-hub@0.9.4
- @creezio/observability@0.9.4
- @creezio/browser-host@0.9.4

## 0.9.3

### Patch Changes

- @creezio/brand-config@0.9.3
- @creezio/shell@0.9.3
- @creezio/platform-core@0.9.3
- @creezio/product-hub@0.9.3
- @creezio/observability@0.9.3
- @creezio/browser-host@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies [10b5198]
  - @creezio/observability@0.9.2
  - @creezio/brand-config@0.9.2
  - @creezio/shell@0.9.2
  - @creezio/platform-core@0.9.2
  - @creezio/product-hub@0.9.2
  - @creezio/browser-host@0.9.2

## 0.9.1

### Patch Changes

- @creezio/brand-config@0.9.1
- @creezio/shell@0.9.1
- @creezio/platform-core@0.9.1
- @creezio/product-hub@0.9.1
- @creezio/observability@0.9.1
- @creezio/browser-host@0.9.1

## 0.9.0

### Patch Changes

- @creezio/brand-config@0.9.0
- @creezio/shell@0.9.0
- @creezio/platform-core@0.9.0
- @creezio/product-hub@0.9.0
- @creezio/observability@0.9.0
- @creezio/browser-host@0.9.0

## 0.8.1

### Patch Changes

- @creezio/brand-config@0.8.1
- @creezio/shell@0.8.1
- @creezio/platform-core@0.8.1
- @creezio/product-hub@0.8.1
- @creezio/observability@0.8.1
- @creezio/browser-host@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [848ec06]
  - @creezio/platform-core@0.8.0
  - @creezio/observability@0.8.0
  - @creezio/browser-host@0.8.0
  - @creezio/product-hub@0.8.0
  - @creezio/brand-config@0.8.0
  - @creezio/shell@0.8.0

## 0.7.1

### Patch Changes

- @creezio/brand-config@0.7.1
- @creezio/shell@0.7.1
- @creezio/platform-core@0.7.1
- @creezio/product-hub@0.7.1
- @creezio/observability@0.7.1
- @creezio/browser-host@0.7.1

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

- Updated dependencies [adf6d46]
  - @creezio/observability@0.7.0
  - @creezio/brand-config@0.7.0
  - @creezio/shell@0.7.0
  - @creezio/platform-core@0.7.0
  - @creezio/product-hub@0.7.0
  - @creezio/browser-host@0.7.0

## 0.6.0

### Patch Changes

- @creezio/brand-config@0.6.0
- @creezio/shell@0.6.0
- @creezio/platform-core@0.6.0
- @creezio/product-hub@0.6.0
- @creezio/observability@0.6.0
- @creezio/browser-host@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [e23b259]
- Updated dependencies [d674c86]
  - @creezio/brand-config@0.5.0
  - @creezio/observability@0.5.0
  - @creezio/platform-core@0.5.0
  - @creezio/shell@0.5.0
  - @creezio/product-hub@0.5.0
  - @creezio/browser-host@0.5.0
