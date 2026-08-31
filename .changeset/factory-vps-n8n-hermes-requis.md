---
"@creezio/factory": patch
---

`server-docker create/update` VPS (pas tunnel-local) force `CREEZIO_NATIVE_WARM=1` + `CREEZIO_NATIVE_WARM_N8N=1` + Hermes. `CREEZIO_NATIVE_WARM=0` / `_N8N=0` / `_HERMES=0` sont ignorés (warn « ignoré, n8n/hermes requis »). `N8N=1` est posé explicitement pour écraser l'ENV image.
