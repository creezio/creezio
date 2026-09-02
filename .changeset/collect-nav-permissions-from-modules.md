---
"@creezio/app-runtime": minor
"@creezio/auth": minor
"@creezio/factory": patch
---

Les permissions nav viennent des `navItems` de chaque module (`collectNavPermissions` / `collectPermissionGroups`). Plus de catalogue global à éditer pour lancer des modules en parallèle. `SessionProvider` lit `/me.permissions` au lieu d'écraser la liste owner. `brand module init` pose `permission: "nav.<id>"` et un `horsIndexJustification` de stub.
