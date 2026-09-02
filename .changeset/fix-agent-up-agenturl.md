---
"@creezio/fleet": patch
"@creezio/factory": patch
---

`agent up` persiste l'URL publique du tunnel dédié (`agentUrl`) dans host-agent.json et fleet-hosts.json après provision/migration — l'admin flotte ne sonde plus l'ancienne URL nested partagée.
