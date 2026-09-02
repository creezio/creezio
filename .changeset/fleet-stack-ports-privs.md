---
"@creezio/factory": patch
"@creezio/fleet": patch
---

`server-docker update` persiste et réutilise le `hostPort` loopback (2ᵉ update = même port) et lit/écrit les fichiers stack root:root 600 (`cf.env`, `secrets.env`) via `sudo -n` / wrapper `/usr/local/sbin/creezio-server-docker priv-io` — fail-closed actionnable, plus de chmod one-shot.
