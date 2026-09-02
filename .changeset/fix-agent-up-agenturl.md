---
"@creezio/fleet": patch
"@creezio/factory": patch
---

`agent up` persiste l'URL publique du tunnel dédié (`agentUrl`) dans host-agent.json et fleet-hosts.json après provision/migration — l'admin flotte ne sonde plus l'ancienne URL nested partagée. `fleet-hosts.json` root:root 600 : écriture via `sudo -n`, sinon POST `/admin/api/hosts/agent-url` (container) — plus d'exit 1 EACCES.
