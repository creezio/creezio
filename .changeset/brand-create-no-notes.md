---
"@creezio/factory": minor
"@creezio/brand-spec": patch
"@creezio/os-ui": patch
"@creezio/interactive-demo": patch
---

`creezio brand create` is the only way to birth a brand (no notes, no `server/crm/`, no `demo-app`). Doctor fails closed on stub specs and leftover notes so an agent cannot scaffold a notes/demo app.

Terminer / Quitter retire le curseur singleton du DOM (`#creezio-demo-cursor` + `data-creezio-demo-ui`) au lieu de le laisser en opacity 0.

`server-docker create --profile prod` forwarde aussi `CREEZIO_FLEET_BACKEND_URL` et `CREEZIO_FLEET_BACKEND_BASIC`.
