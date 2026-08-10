---
"@creezio/desktop-tooling": patch
---

e2e-browser-parcours : résolution hoist-safe des packages @creezio (imports
nus depuis le script publié — workspaces monorepo où tout est hoisté à la
racine) + export du sous-chemin `./scripts/*` pour que les wrappers apps
résolvent via `import.meta.resolve` (plus de sondage `server/node_modules`).
