# @creezio/shell-ui

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
