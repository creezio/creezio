# @creezio/app-runtime

## 0.6.0

### Patch Changes

- Updated dependencies [d948fcc]
  - @creezio/auth@0.6.0
  - @creezio/shell-ui@0.6.0
  - @creezio/integrations@0.6.0
  - @creezio/mails@0.6.0
  - @creezio/tasks@0.6.0
  - @creezio/brand-config@0.6.0
  - @creezio/platform-core@0.6.0
  - @creezio/product-hub@0.6.0
  - @creezio/electron-shell@0.6.0
  - @creezio/api-kernel@0.6.0
  - @creezio/mcp-facade@0.6.0
  - @creezio/assistant@0.6.0
  - @creezio/observability@0.6.0
  - @creezio/support@0.6.0
  - @creezio/browser-host@0.6.0
  - @creezio/database@0.6.0

## 0.5.0

### Minor Changes

- 8b4c876: Rôle métier marque en session : `configureAuth({ resolveBrandRole })` (callback déclaratif, db brand fournie par la surface plateforme) expose `brand_role` dans `GET /api/v1/auth/me` — la valeur suit la cible en impersonation — et `useSession().me.brandRole` côté UI. Jamais de throw (best effort → null) ; resolver absent = `brand_role: null` (rétrocompatible). Consommateur premier : `@creezio/interactive-demo` (scénarios par rôle via la prop `role` d'InteractiveDemoRoot).

### Patch Changes

- Updated dependencies [8b4c876]
- Updated dependencies [0ff4ed2]
- Updated dependencies [e23b259]
- Updated dependencies [d674c86]
  - @creezio/auth@0.5.0
  - @creezio/shell-ui@0.5.0
  - @creezio/brand-config@0.5.0
  - @creezio/assistant@0.5.0
  - @creezio/integrations@0.5.0
  - @creezio/observability@0.5.0
  - @creezio/platform-core@0.5.0
  - @creezio/support@0.5.0
  - @creezio/mails@0.5.0
  - @creezio/tasks@0.5.0
  - @creezio/product-hub@0.5.0
  - @creezio/electron-shell@0.5.0
  - @creezio/api-kernel@0.5.0
  - @creezio/mcp-facade@0.5.0
  - @creezio/browser-host@0.5.0
  - @creezio/database@0.5.0
