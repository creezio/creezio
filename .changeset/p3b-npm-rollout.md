---
"@creezio/propagation": minor
"@creezio/app-runtime": minor
"@creezio/admin": minor
---

P3.b — rollout npm flotte-wide : `buildAllBrandPrPayloads` branché sur le
workflow réel `propagate.yml` (canaux marque data-driven, `brandId` libre,
PR de bump automatique avec rapport d'impact) ; heartbeat flotte enrichi
`kitVersion` + `architectureVersion` (champs additifs, protocole v1
dual-accept) ; registre admin `admin_fleet_servers` : colonnes
`kit_version` / `architecture_version` (migration `admin_006`) exposées via
l'API fleet et badge UI — « quelle version tourne où ».
