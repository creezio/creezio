---
"@creezio/app-runtime": minor
"@creezio/auth": minor
"@creezio/factory": minor
---

Les permissions nav des `navItems` alimentent `configureAuth` / `/admin/access` via `applyBrandModuleAuth` (collecteurs `collectNavPermissions` / `collectPermissionGroups`). `SessionProvider` lit uniquement `/me`. `brand module init` pose `permission: "nav.<id>"` sans `à qualifier` silencieux.
