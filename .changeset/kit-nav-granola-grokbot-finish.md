---
"@creezio/granola": minor
"@creezio/grokbot": minor
"@creezio/nav": minor
"@creezio/os-ui": minor
"@creezio/shell-ui": minor
"@creezio/factory": minor
"@creezio/app-runtime": minor
---

Vague unique granola + grokbot + catalogue sidebar :

- Factory **installe** `@creezio/granola`, `@creezio/grokbot` et
  `@creezio/nav` (SERVER_CREEZIO_DEPS / CLIENT_CREEZIO_DEPS /
  transpilePackages / package.json UI). Jamais les retirer pour un
  E404 pré-publish — le spawn `npm install` d'une app neuve est
  attendu KO jusqu'à `changeset publish` (publish.yml), pas un skip
  de gate.
- Chrome factory : `<NavCatalogLoader />` depuis `@creezio/shell-ui/ui`
  (GET `/api/v1/modules/nav`) — plus de `const OS_NAV`.
- UI Granola (notes + transcript + dossiers + santé webhook) et
  GrokBot (repos/usage/artefacts + runs live) sur cette même ligne.
