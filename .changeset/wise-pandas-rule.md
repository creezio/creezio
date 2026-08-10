---
"@creezio/access-control": minor
"@creezio/auth": minor
"@creezio/shell-ui": minor
"@creezio/api-kernel": minor
"@creezio/app-runtime": minor
"@creezio/factory": minor
"@creezio/os-ui": minor
---

Module natif `@creezio/access-control` : visibilité modules/sidebar par rôle,
administrable en UI.

- **Nouveau package** : rôles déclaratifs marque (config) + overrides
  allow/deny en DB (`access_role_overrides`, `access_user_roles`,
  `access_audit_log` sur core.db), résolution dynamique `resolvePermissions`
  (cache 30 s invalidé aux écritures), API `/api/v1/access/*` gardée par
  `platform.access.manage`, UI admin « Rôles & accès » (matrice, comptes,
  journal).
- **auth** : adaptateur `resolveEffectivePermissions` — `/me` et les JWT
  mintés (login, impersonation) embarquent les permissions résolues
  dynamiquement quand la marque configure access-control.
- **shell-ui** : `CoreNavItem.permission` / `SidebarNavItem.permission` +
  filtrage des entrées primaires de sidebar (même logique que l'admin) ;
  entrée admin native « Rôles & accès ».
- **api-kernel** : `ApiMount.permission` + hook `authorizeModuleAccess` —
  le kernel refuse l'appel API (401/403), pas seulement l'affichage.
- **app-runtime** : montage du module sur la surface plateforme (store
  core.db, routes, injection auth) + garde kernel câblée (session, owner,
  machine keys bordure).
- **factory / os-ui** : nouvelle marque générée = page `/admin/access`,
  entrée de nav avec permission, deps et transpilePackages à jour.