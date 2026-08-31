---
"@creezio/factory": minor
---

Clôture des dettes structurelles flotte (BACKLOG § Flotte multi-VPS) :

- **`verify-prod` généralisé** : la factory matérialise `scripts/verify-prod.mjs`
  dans toute app générée (profil brand : version / login E2E `secrets.env` /
  `auth/me` role owner / browse d'un module à `meiliIndexes` `engine:"meili"` /
  `llm-status` ; profil admin : version / login / me), script npm `verify:prod`,
  extension métier `scripts/verify-prod.local.mjs` (`localChecks(ctx)`, jamais
  régénérée). Gate d'inventaire : `test-phase-factory-two-repos`.
- **Préflight UFW fail-closed** dans `server-docker agent up | admin up |
  enroll` (`src/server-docker-ufw.ts`, gate `test-phase-server-docker-ufw`) :
  UFW actif + règle `172.16.0.0/12 → 172.17.0.1:<port>` absente → règle posée
  (root / `sudo -n`, re-vérifiée), sinon échec explicite avec la commande
  exacte — incident 10–30/08/2026 (host-agent droppé 20 jours) rendu
  impossible.
- **App admin : heartbeat flotte vers elle-même** : `server-docker create
  --profile prod` d'une app admin pose `CREEZIO_FLEET_ADMIN_URL=http://127.0.0.1:18791`
  par défaut (si secret register présent et URL absente) — l'instance admin
  apparaît au tableau `/flotte` avec son propre `kitVersion`.
