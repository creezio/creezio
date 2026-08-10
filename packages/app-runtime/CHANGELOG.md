# @creezio/app-runtime

## 1.0.0

### Minor Changes

- 8b4c876: Rôle métier marque en session : `configureAuth({ resolveBrandRole })` (callback déclaratif, db brand fournie par la surface plateforme) expose `brand_role` dans `GET /api/v1/auth/me` — la valeur suit la cible en impersonation — et `useSession().me.brandRole` côté UI. Jamais de throw (best effort → null) ; resolver absent = `brand_role: null` (rétrocompatible). Consommateur premier : `@creezio/interactive-demo` (scénarios par rôle via la prop `role` d'InteractiveDemoRoot).

### Patch Changes

- Updated dependencies [8b4c876]
- Updated dependencies [0ff4ed2]
- Updated dependencies [e23b259]
- Updated dependencies [d674c86]
  - @creezio/auth@1.0.0
  - @creezio/shell-ui@1.0.0
  - @creezio/brand-config@1.0.0
  - @creezio/assistant@1.0.0
  - @creezio/integrations@1.0.0
  - @creezio/observability@1.0.0
  - @creezio/platform-core@1.0.0
  - @creezio/support@1.0.0
  - @creezio/mails@1.0.0
  - @creezio/tasks@1.0.0
  - @creezio/electron-shell@1.0.0
  - @creezio/api-kernel@1.0.0
  - @creezio/browser-host@1.0.0
  - @creezio/database@1.0.0
  - @creezio/mcp-facade@1.0.0
  - @creezio/product-hub@1.0.0
