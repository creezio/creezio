---
"@creezio/factory": patch
---

`server-docker create/update` VPS (pas tunnel-local) pose `CREEZIO_NATIVE_WARM=1` et `CREEZIO_NATIVE_WARM_HERMES=1`. Skip n8n (`CREEZIO_NATIVE_WARM_N8N=0`) ne bloque plus Hermes.
