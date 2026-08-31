# @creezio/fleet

## 0.20.0

### Minor Changes

- ac7035c: Retrait des wrappers de compat fleet-collector (dette 0.16, BACKLOG) :

  - `@creezio/observability` : suppression des 7 wrappers `.mjs`
    (`admin-docker`, `server-lib`, `instance-stack`, `agent-updates`,
    `registry-pull-proxy`, `server-admin`, `host-agent`) et du bin npm
    `creezio-server-admin` — la SoT flotte est `@creezio/fleet`
    (`packages/fleet/dist`). Le collector télémétrie (`server.mjs`,
    `ops-api.mjs`, `env.mjs`) reste inchangé.
  - `@creezio/factory` : le CLI `server-docker` (`importInstanceStack`,
    imports `server-lib` de backup/update/migrate-stack) pointe directement
    sur `packages/fleet/dist` (fail-closed si dist absent).
  - `@creezio/fleet` : protocole flotte v1 **strict** —
    `FLEET_PROTOCOL_ACCEPT_MISSING=false` (politique F4.4d). Pas de bump v2 :
    le format filaire est inchangé ; vérifié via l'API flotte que tous les
    composants déployés (host-agents enrôlés inclus) annoncent déjà v1.
  - `@creezio/admin` : le mount `fleet-releases` pose désormais le header
    `x-creezio-fleet-protocol` sur toutes ses réponses (la boucle pull des
    agents le vérifie — strict en 0.19) ; nouvelle dépendance
    `@creezio/fleet`.

## 0.19.0

## 0.18.0

## 0.17.1

## 0.17.0

## 0.16.0

## 0.15.0

### Minor Changes

- 1ab886b: P2.b — backend flotte sorti d'observability et typé : nouveau package `@creezio/fleet` (portage TS strict isofonctionnel des 7 `.mjs` de fleet-collector : admin-docker→docker, server-lib, instance-stack, agent-updates, registry-pull-proxy, server-admin, host-agent). Contrat de version agent↔backend (F4.4d) : header `x-creezio-fleet-protocol` v1 dans les deux sens, dual-accept UNE version pour les composants ≤ 0.14 sans header (warn bruyant throttlé), refus explicite actionnable sur écart de version. Les `.mjs` de fleet-collector deviennent des wrappers de compat `[deprecated]` (retrait au prochain minor) ; images server-admin/host-agent : CMD → `node_modules/@creezio/fleet/dist/bin/*-main.js`, contexte de build stagé par `stageFleetImageContext` (fail-closed si dist absent). Zéro changement de comportement : mêmes endpoints, formats d'état disque, noms de conteneurs/images.
