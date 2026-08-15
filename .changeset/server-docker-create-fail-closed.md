---
"@creezio/factory": patch
---

`server-docker create` VPS/prod est fail-closed : sans `CREEZIO_TUNNEL_PROVISION_URL`/`_TOKEN`, la commande échoue (plus de stack loopback « OK »). Un slug d'instance dans `RESERVED_SLUGS` (`demo`…) dérive `CREEZIO_TUNNEL_SLUG=<brand>-<slug>` (log + env instance). `CREEZIO_TUNNEL_LOCAL=1` reste l'opt-in dev local.
