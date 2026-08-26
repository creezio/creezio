---
"@creezio/factory": patch
---

migrate-stack attache un tunnel Cloudflare in-process à un stack déjà sans sidecar quand cf.env manque et que CREEZIO_CF_* + CREEZIO_DOMAIN sont posés (landing extra-hostname / admin historique).
