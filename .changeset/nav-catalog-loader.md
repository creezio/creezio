---
"@creezio/factory": minor
"@creezio/os-ui": minor
"@creezio/shell-ui": minor
"@creezio/nav": minor
---

Catalogue sidebar consommé (BRIEF NAV-3 / Phase C) :

- `@creezio/shell-ui/ui` exporte `<NavCatalogLoader />` : fetch
  `GET /api/v1/modules/nav`, parse le contrat `{ items }`, bump
  `configureSidebar({ getNavItems })`. Fallback premier paint =
  `defaultOsPrimaryNavItems()`. `@creezio/nav/ui` re-exporte le même
  composant — le chrome factory importe le loader depuis
  `@creezio/shell-ui/ui`. `@creezio/nav` est quand même une dep factory
  (SERVER/CLIENT_CREEZIO_DEPS + transpilePackages) : même vague publish
  que granola/grokbot (`/admin/nav` + mount auto-register).
- Factory `renderUiBrandChrome` : plus de `BRAND_NAV` / `OS_NAV` inline.
  Chrome = loader + `defaultOsAdminNavItems({ includePlugins })`. Métier
  via `collectNavItems` (mount auto-register).
- `@creezio/os-ui` : `OS_PRIMARY_NAV_SEGMENTS` +
  `OS_UI_HORS_NAV_JUSTIFICATIONS`. Gate `test-phase-os-nav-catalog`.
