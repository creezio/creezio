---
"@creezio/factory": minor
---

`creezio server-docker registry-gc` (T11) : GC fail-closed du registre Docker local (`registry:2`, `127.0.0.1:5000`) — API v2 list/delete + `registry garbage-collect`, rétention `--keep N` (défaut 2) par famille de tags (`auto.*` de l'auto-publish CI d'un côté, tags manuels de l'autre), tags protégés jamais supprimés (conteneurs en cours, `docker-data/servers.json` — `--brand-root` + découverte labels `creezio.brand-root`, instances arrêtées incluses —, releases fleet de l'app admin via `--admin-app` / `CREEZIO_FLEET_ADMIN_URL`, admin injoignable = refus). Dry-run par défaut, `--apply` exécute.
