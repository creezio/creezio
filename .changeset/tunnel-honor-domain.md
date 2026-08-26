---
"@creezio/electron-shell": patch
---

Au re-ensure boot, le hostname public suit `CREEZIO_DOMAIN` (plus le store seul). Sans ça, un admin passé de `lp` à `admin`+`lp` gardait un ingress lp-only.
