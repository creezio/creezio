# TODO — fleet

### [todo] FLEET-1 — Gate kit dédiée au proxy fleet
- priorite: P2
- depends: aucune
- fichiers: scripts/test-phase-admin-fleet-proxy.mjs (à créer), packages/admin/src/index.ts
- criteres:
  - [ ] mock backend Basic : proxy relaie méthode + query (multi-valeurs) + body JSON
  - [ ] 503 sans CREEZIO_FLEET_BACKEND_BASIC, 502 backend down, statut backend conservé sur réponse non JSON
  - [ ] gate référencée dans scripts/README.md et verte dans npm run test:kit

### [done] FLEET-2 — Remplacer prompt/confirm/alert par les primitives dialog du kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [x] update / update en masse / suppression (+purge) / pin passent par `dialog` (@creezio/shell-ui)
  - [x] plus aucun `window.prompt` / `window.confirm` / `window.alert` dans le client
  - [x] gate test-phase-fleet-rollout (assertions UI) toujours verte

### [done] FLEET-3 — `<select>` marque du formulaire création → primitive `select` kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [x] le choix de `brandRoot` utilise la primitive `select` du kit graphique
  - [x] comportement identique (préselection du premier brandRoot)
