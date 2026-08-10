# @creezio/auth

## 1.0.0

### Minor Changes

- 8b4c876: Rôle métier marque en session : `configureAuth({ resolveBrandRole })` (callback déclaratif, db brand fournie par la surface plateforme) expose `brand_role` dans `GET /api/v1/auth/me` — la valeur suit la cible en impersonation — et `useSession().me.brandRole` côté UI. Jamais de throw (best effort → null) ; resolver absent = `brand_role: null` (rétrocompatible). Consommateur premier : `@creezio/interactive-demo` (scénarios par rôle via la prop `role` d'InteractiveDemoRoot).

### Patch Changes

- Updated dependencies [0ff4ed2]
- Updated dependencies [d674c86]
  - @creezio/shell-ui@1.0.0
  - @creezio/platform-core@1.0.0
  - @creezio/shell@1.0.0
