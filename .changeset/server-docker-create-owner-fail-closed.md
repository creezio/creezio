---
"@creezio/factory": patch
---

`server-docker create` VPS/prod est fail-closed aussi sur le first-run owner : sans `CREEZIO_OWNER_EMAIL` / `CREEZIO_OWNER_PASSWORD`, la commande échoue (plus d'instance « OK » sans compte utilisable). Avec ces vars, le create appelle `POST /api/v1/os/setup` et log l'URL publique + `login : $CREEZIO_OWNER_EMAIL` (jamais le mot de passe). `CREEZIO_TUNNEL_LOCAL=1` : owner optionnel (dev machine).
