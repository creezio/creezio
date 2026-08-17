---
"@creezio/factory": patch
"@creezio/observability": patch
---

**fix(server-docker) — owner persisté dans secrets.env + ensure-owner.**

`create` écrit `CREEZIO_OWNER_*` dans `docker-data/stacks/<nom>/secrets.env` (chmod 600, `env_file`) — plus seulement un POST hôte oublié ensuite. `update` fusionne `secrets.env` : owner / `CREEZIO_E2E_*` ne sont plus droppés. Nouveau geste `creezio server-docker ensure-owner <nom>` : first-run si setup incomplet, sinon seed recette + vérif login, recreate **app seule** (sidecar / tunnel intact). Fail-closed VPS inchangé. Jamais le mot de passe en log ni dans le registre.
