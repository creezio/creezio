---
"@creezio/factory": patch
"@creezio/fleet": patch
---

server-docker : `CREEZIO_SERVER_DOCKER_BACKUP=0` (aussi `false`/`off`) skippe les backups (`update --backup`, one-shot, migrate-stack, API `backup:true`). Défaut on (prod-safe). L'env gagne ; warn `backup skippé (CREEZIO_SERVER_DOCKER_BACKUP=0)`.
