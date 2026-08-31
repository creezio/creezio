---
"@creezio/host-runtime": minor
"@creezio/platform-core": minor
"@creezio/electron-shell": minor
"@creezio/brand-config": minor
"@creezio/factory": minor
"@creezio/search": patch
---

P1.c — coupe `electron` / `electron-shell` de l'image serveur :

- `resources/{vendor,scripts,bin}` (Hermes, n8n, skills, sonde Meili)
  déménagent de `@creezio/electron-shell` vers `@creezio/host-runtime`.
- `kitOsResourcesRoot()` résout `@creezio/host-runtime`.
- Factory : plus d'`electron-shell` dans `SERVER_CREEZIO_DEPS` (le client
  thin le garde).
- Dockerfile : après `npm ci`, purge `electron`, `electron-updater` et
  `@creezio/electron-shell` du stage deps (runtime headless Node pur).
