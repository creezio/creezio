# @creezio/auth

## 0.7.0

### Patch Changes

- @creezio/shell@0.7.0
- @creezio/platform-core@0.7.0
- @creezio/shell-ui@0.7.0

## 0.6.0

### Minor Changes

- d948fcc: feat(login): page /login split-screen 50/50 brand-configurable — nouveau `LoginPage` (@creezio/auth/ui) : panneau formulaire modernisé (labels associés, `role="alert"`, `aria-invalid`, focus accent, loading) + panneau brand (logo/initiale, nom produit, tagline, highlights, gradient/image configurables). Config marque via `ShellUiBrand.login` (prop `login` de `CreezioUiBoot`) — zéro hardcodé, défaut neutre élégant sans config. `configureShellUiBrand` devient no-op sans changement (comparaison par clé, `login` en profondeur) et notifie des abonnés : nouveau `subscribeShellUiBrand` + hook `useShellUiBrand` (@creezio/shell-ui/ui[/kit]) pour lire la brand au render sans flash du défaut — CreezioUiBoot configure désormais au render. Compat : `LoginForm` inchangé fonctionnellement (mêmes props/modes), la route OS /login et le template factory basculent sur `LoginPage` — aucune modif requise côté apps pour le nouveau design.

### Patch Changes

- Updated dependencies [d948fcc]
  - @creezio/shell-ui@0.6.0
  - @creezio/shell@0.6.0
  - @creezio/platform-core@0.6.0

## 0.5.0

### Minor Changes

- 8b4c876: Rôle métier marque en session : `configureAuth({ resolveBrandRole })` (callback déclaratif, db brand fournie par la surface plateforme) expose `brand_role` dans `GET /api/v1/auth/me` — la valeur suit la cible en impersonation — et `useSession().me.brandRole` côté UI. Jamais de throw (best effort → null) ; resolver absent = `brand_role: null` (rétrocompatible). Consommateur premier : `@creezio/interactive-demo` (scénarios par rôle via la prop `role` d'InteractiveDemoRoot).

### Patch Changes

- Updated dependencies [0ff4ed2]
- Updated dependencies [d674c86]
  - @creezio/shell-ui@0.5.0
  - @creezio/platform-core@0.5.0
  - @creezio/shell@0.5.0
