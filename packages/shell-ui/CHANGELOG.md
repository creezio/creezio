# @creezio/shell-ui

## 0.7.1

### Patch Changes

- @creezio/brand-config@0.7.1
- @creezio/shell@0.7.1

## 0.7.0

### Patch Changes

- @creezio/brand-config@0.7.0
- @creezio/shell@0.7.0

## 0.6.0

### Minor Changes

- d948fcc: feat(login): page /login split-screen 50/50 brand-configurable — nouveau `LoginPage` (@creezio/auth/ui) : panneau formulaire modernisé (labels associés, `role="alert"`, `aria-invalid`, focus accent, loading) + panneau brand (logo/initiale, nom produit, tagline, highlights, gradient/image configurables). Config marque via `ShellUiBrand.login` (prop `login` de `CreezioUiBoot`) — zéro hardcodé, défaut neutre élégant sans config. `configureShellUiBrand` devient no-op sans changement (comparaison par clé, `login` en profondeur) et notifie des abonnés : nouveau `subscribeShellUiBrand` + hook `useShellUiBrand` (@creezio/shell-ui/ui[/kit]) pour lire la brand au render sans flash du défaut — CreezioUiBoot configure désormais au render. Compat : `LoginForm` inchangé fonctionnellement (mêmes props/modes), la route OS /login et le template factory basculent sur `LoginPage` — aucune modif requise côté apps pour le nouveau design.

### Patch Changes

- @creezio/brand-config@0.6.0
- @creezio/shell@0.6.0

## 0.5.0

### Minor Changes

- 0ff4ed2: Bandeau impersonation ? Voir comme ? natif dans WorkspaceRoot (auto-masqu?
  hors impersonation, nom produit via getShellUiBrand, retour via
  stopImpersonate) ? plus de wiring marque n?cessaire.

### Patch Changes

- d674c86: Peers internes @creezio/\* en `>=0.4.0` (au lieu de `^0.4.0`) : ?vite que le
  train lockstep escalade en 1.0.0 au premier bump minor (les peers restent
  satisfaits par toute version future du kit).
- Updated dependencies [e23b259]
- Updated dependencies [d674c86]
  - @creezio/brand-config@0.5.0
  - @creezio/shell@0.5.0
