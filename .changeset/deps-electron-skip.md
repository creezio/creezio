---
"@creezio/factory": patch
---

Dockerfile serveur : `ELECTRON_SKIP_BINARY_DOWNLOAD=1` dans le stage `deps` (electron atterrit dans l arbre prod via le lockfile malgre --omit=dev ; son postinstall telecharge ~100 Mo sur le CDN GitHub, flaky sous charge — echec de build vecu sur tempoflow 2026-08-12) + retries npm (`NPM_CONFIG_FETCH_RETRIES=5` etc.) dans les stages d install (reset TLS transitoire). Builds in-image deterministes, identiques sur tous les hotes.
