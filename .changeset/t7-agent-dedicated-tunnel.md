---
"@creezio/platform-core": minor
"@creezio/fleet": minor
"@creezio/factory": minor
---

T7 — tunnel cloudflared DÉDIÉ au host-agent. L'ingress `agent.{slug}.{zone}` / `agent-{slug}.{zone}` appartient exclusivement au cycle de vie du host-agent : `creezio server-docker enroll` et `agent up` provisionnent un tunnel Cloudflare propre (`ensureCfAgentTunnel`, nom CF `creezio-agent-<slug>`, container `creezio-agent-tunnel`, token `docker-data/agent-tunnel.env` 600). `agent up` (chaque update de l'agent) détecte un hôte déjà enrôlé sans tunnel dédié et exécute la migration (provision → connecteur → bascule CNAME → retrait d'une règle résiduelle). Fail-closed si `CREEZIO_CF_*` manquent. `server-docker rm` d'une instance ne touche jamais les DNS agent ; seul `agent rm` les retire (`deprovisionCfAgentTunnel`). Plus d'option `agent` sur l'ingress kernel des instances, plus de kill-switch `CREEZIO_AGENT_TUNNEL_WATCH`. Respawn surveillé par `@creezio/fleet` `agent-tunnel.ts`. Gates : `test-phase-agent-tunnel`, `test-phase-tunnel-self-provision` §10, `test-phase-server-docker` (rm instance ≠ DNS agent).
