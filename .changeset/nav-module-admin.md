---
"@creezio/nav": minor
"@creezio/os-ui": minor
"@creezio/app-runtime": minor
"@creezio/factory": minor
---

Module hybride `@creezio/nav` (BRIEF NAV-2 / Phase B) :

- Persist des overrides sidebar en `brand.db` (`nav_overrides`) — jamais le
  catalogue entier ni `core.db`.
- Mount `/api/v1/modules/nav` auto-enregistré par `startBrandDesktop` /
  `createBrandKernel` (`createNavMount`).
- Admin `/admin/nav` (`NavAdminClient` + wrapper os-ui) : masquer,
  réordonner, renommer. Entrée `os.admin.nav` via `registerOsNavEntry`
  **et** `defaultOsAdminNavItems()` — pas un 3ᵉ `ADMIN_NAV`.
- Owner : voit tout ce qui est `available` ; `hidden` s'applique quand même
  (documenté dans `packages/nav/AGENTS.md`).

Gate : `scripts/test-phase-nav-module.mjs`. Plan :
`docs/plans/PLAN-NAV-CATALOG.md`.
