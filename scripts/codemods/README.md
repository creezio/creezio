# Codemods d'architecture — migrations kit → marques

Quand `ARCHITECTURE_VERSION` (`packages/platform-core/src/architecture-version.ts`)
change (ex. `H6` → `H7`), les marques consommateurs npm doivent migrer. Le
bump est REFUSÉ par la gate `test-phase-arch-codemod` **sauf si un codemod
de migration existe ici** : la marque l'exécute lors de sa montée de
version (`npm update "@creezio/*"` + codemods).

## Contrat

Un dossier par **version cible** :

```
scripts/codemods/
  H7/
    manifest.json          # {"scripts": ["01-rename-x.mjs", "02-move-y.mjs"]}
    01-rename-x.mjs
    02-move-y.mjs
```

- `manifest.json` : `{"scripts": [...]}` — exécutés **dans l'ordre** du
  tableau.
- Chaque script est un module Node (`.mjs`) lancé par
  `ROOT=<racine marque> node <script>` :
  - `ROOT` (env) = racine du clone marque à transformer (fichiers marque
    uniquement — jamais `vendor/`, que le sync écrase juste après) ;
  - **idempotent** : relancer le script sur une marque déjà migrée est un
    no-op vert (le sync peut être rejoué) ;
  - exit ≠ 0 = migration impossible → le sync s'arrête (la marque reste
    intacte, le codemod s'exécute AVANT toute copie vendor).

## Checklist bump `ARCHITECTURE_VERSION` (docs/CONTRIBUTING-BRANDS.md)

1. bump de la valeur dans `packages/platform-core/src/architecture-version.ts` ;
2. `scripts/codemods/<nouvelleVersion>/manifest.json` + scripts (la gate
   `scripts/test-phase-arch-codemod.mjs` REFUSE un bump sans manifest) ;
3. ADR dans `docs/adr/` expliquant le breaking change ;
4. push sur `main` → chaque app consommatrice verra le bump dans son rapport
   kit-compat (commit surligné ⚠️) et exécutera le codemod automatiquement
   lors de son `vendor-update` (le sync détecte l'écart de version et
   applique la migration).
