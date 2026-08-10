---
"@creezio/desktop-tooling": patch
---

fix(desktop-tooling): e2e-browser-parcours résout `@creezio/app-runtime` et `@creezio/platform-core` via la résolution package (`createRequire` depuis la racine app) — plus de sondage `server/node_modules` (cassé selon le hoisting workspaces en CI).
