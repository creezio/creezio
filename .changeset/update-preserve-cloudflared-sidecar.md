---
"@creezio/observability": patch
"@creezio/factory": patch
---

**fix(update) — ne peut plus retirer cloudflared / changer le hostname.**

`server-docker update` (et tout recreate compose) préserve un sidecar `cloudflared*` historique : seule l'image app change, `tunnel.env` / id / hostname inchangés, `up` sans `--remove-orphans`. Si une adresse publique est persistée sans sidecar (et sans contrat in-process), l'update **refuse** plutôt que de publier un compose app-seule (incident Tempoflow restos, 0.10.2 → 530/1033). Dev `CREEZIO_TUNNEL_LOCAL=1` inchangé. `migrate-stack` seul retire un sidecar et **réutilise** le tunnel existant — jamais un 2e hostname à l'update.
