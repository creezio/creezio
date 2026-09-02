---
"@creezio/fleet": minor
"@creezio/admin": minor
---

T4 — suppression du hop HTTP artisanal admin → backend flotte : le contrat
client du backend (`server-admin-client.ts`) vit désormais dans
`@creezio/fleet` (résolution env `CREEZIO_FLEET_BACKEND_URL`/`_BASIC`,
`fleetBackendFetch` Basic, helpers typés `fetchFleetBackendServers` /
`verifyFleetHostCredential`), et `@creezio/admin` l'importe directement —
`fleet-registry` (sync/poller) et `fleet-releases` (vérif credential agents)
n'ont plus de fetch HTTP re-déclaré à la main ; `fleetFetch` (export
conservé) délègue au client. Comportement identique : transport HTTP Basic
loopback conservé (backend flotte = container séparé, seul détenteur du
socket Docker et de `fleet-hosts.json`), serveur HTTP server-admin intact
pour les host-agents distants (protocole v1, header
`x-creezio-fleet-protocol` inchangé).
