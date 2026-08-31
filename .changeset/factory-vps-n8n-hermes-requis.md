---
"@creezio/factory": patch
---

`server-docker create/update` VPS (pas tunnel-local) force `CREEZIO_NATIVE_WARM=1` + Hermes + n8n. `CREEZIO_NATIVE_WARM=0` / `CREEZIO_NATIVE_WARM_N8N=0` / `CREEZIO_NATIVE_WARM_HERMES=0` sont ignorés (warn « ignoré, n8n/hermes requis »).
