---
"@creezio/app-runtime": patch
---

fix(app-runtime): health « degraded » cosmétique au boot en mode sidecar M2 — l'étape « tunnel » appelait le provisioner (172.17.0.1, gateway docker0) injoignable depuis le réseau compose du stack et partait en timeout 30 s. En mode sidecar, la re-configuration provisioner devient best-effort en arrière-plan et l'étape valide l'état RÉEL du tunnel en sondant l'URL publique avec retry + backoff (opt-out : CREEZIO_TUNNEL_PUBLIC_PROBE=0).
