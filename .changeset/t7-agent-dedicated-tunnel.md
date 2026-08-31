---
"@creezio/platform-core": minor
"@creezio/fleet": minor
"@creezio/factory": minor
---

T7 — tunnel cloudflared DÉDIÉ au host-agent. L'ingress `agent.{slug}.{zone}` ne passe plus par le cloudflared in-process d'un serveur applicatif du VPS (serveur down/recréé = agent injoignable) : `creezio server-docker enroll` provisionne un tunnel Cloudflare propre à l'agent (`ensureCfAgentTunnel`, nom CF `creezio-agent-<slug>`) et lance son connecteur dans un container dédié `creezio-agent-tunnel` (network host, restart unless-stopped, token dans `docker-data/agent-tunnel.env` 600). Migration douce des hôtes legacy au prochain enroll : bascule du CNAME agent après démarrage du connecteur puis retrait de la règle agent du tunnel partagé (URL publique inchangée, pas de coupure). Respawn surveillé par le host-agent (`@creezio/fleet` `agent-tunnel.ts`, backoff borné miroir cloudflared-respawn, kill-switch `CREEZIO_AGENT_TUNNEL_WATCH=0`, état additif `agentTunnel` dans `/agent/api/health`) ; `agent up` relance le connecteur manquant. Gates : `test-phase-agent-tunnel` (nouvelle) + `test-phase-tunnel-self-provision` §10.
