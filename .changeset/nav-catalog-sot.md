---
"@creezio/shell-ui": minor
"@creezio/factory": minor
---

Catalogue de nav OS unique (BRIEF NAV-1 / Phase A) :

- `@creezio/shell-ui` exporte `NavCatalogEntry`, `resolveNavCatalog`,
  `registerOsNavEntry` / `listOsNavEntries` / `defaultOsCatalogEntries`
  (registre Node-safe) et `resolveNavIcon` (allowlist lucide, fallback
  `Circle`). `defaultOsPrimaryNavItems()` devient un adaptateur du
  registre — plus une liste recopiée.
- Factory `renderUiBrandChrome` compose
  `[...BRAND_NAV, ...defaultOsPrimaryNavItems()]` et
  `defaultOsAdminNavItems({ includePlugins })` — **plus** de
  `const OS_NAV = […]`. Un nouveau module OS enregistré au catalogue
  apparaît sur toute marque factory-neuve sans éditer le chrome.

Pas d'écran admin ni de table SQL (NAV-2). Plan :
`docs/plans/PLAN-NAV-CATALOG.md`.
