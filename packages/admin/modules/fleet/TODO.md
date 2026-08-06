# TODO — fleet

### [done] FLEET-1 — Gate kit dédiée au proxy fleet
- priorite: P2
- depends: aucune
- fichiers: scripts/test-phase-admin-fleet-proxy.mjs, packages/admin/src/index.ts
- criteres:
  - [x] mock backend Basic : proxy relaie méthode + query (multi-valeurs) + body JSON
  - [x] 503 sans CREEZIO_FLEET_BACKEND_BASIC, 502 backend down, statut backend conservé sur réponse non JSON
  - [x] gate dans `package.json` `test` (suite kit auto) — `node --test scripts/test-phase-admin-fleet-proxy.mjs`

### [todo] FLEET-2 — Remplacer prompt/confirm/alert par les primitives dialog du kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [ ] update / update en masse / suppression (+purge) / pin passent par `dialog` (@creezio/shell-ui)
  - [ ] plus aucun `window.prompt` / `window.confirm` / `window.alert` dans le client
  - [ ] gate test-phase-fleet-rollout (assertions UI) toujours verte

### [todo] FLEET-3 — `<select>` marque du formulaire création → primitive `select` kit
- priorite: P3
- depends: aucune
- fichiers: packages/admin/ui/fleet-admin-client.tsx
- criteres:
  - [ ] le choix de `brandRoot` utilise la primitive `select` du kit graphique
  - [ ] comportement identique (préselection du premier brandRoot)
