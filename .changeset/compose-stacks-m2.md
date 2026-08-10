---
"@creezio/factory": minor
"@creezio/electron-shell": minor
"@creezio/observability": minor
"@creezio/app-runtime": minor
---

**M2 — 1 instance serveur = 1 stack compose autonome (app + cloudflared sidecar).**

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
