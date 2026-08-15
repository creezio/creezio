---
"@creezio/app-runtime": patch
---

`/api/v1/admin/*` (MCP, database, analytics, endpoints, request-logs) exige une session à la bordure HTTP — 401 sans cookie/Bearer. Health, login, setup et OAuth MCP restent publics. Ferme la surface admin ouverte en prod (foove2#78).
