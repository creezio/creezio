---
"@creezio/observability": minor
"@creezio/fleet": minor
"@creezio/admin": minor
"@creezio/factory": minor
---

Retrait des wrappers de compat fleet-collector (dette 0.16, BACKLOG) :

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
