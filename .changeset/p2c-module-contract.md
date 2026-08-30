---
"@creezio/app-runtime": minor
"@creezio/api-kernel": minor
"@creezio/brand-spec": minor
"@creezio/factory": minor
"@creezio/platform-core": minor
---

P2.c — le contrat de module `BrandModuleDef` devient un type importé du kit,
jamais copié (`ARCHITECTURE_VERSION` H8 → **H9**, codemod
`scripts/codemods/H9/`, ADR `docs/adr/ADR-p2c-module-contract.md`).

- `@creezio/app-runtime` : nouvelle SoT `BrandModuleDef` / `BrandNavItem` /
  `BrandMeiliIndex` + `createBrandModuleRegistry(modules)` (collecteurs
  génériques du registre marque).
- `@creezio/factory` : `modules/types.ts` généré = simple ré-export du kit ;
  `modules/index.ts` généré délègue ses collecteurs au kit.
- `@creezio/api-kernel` : `ApiMount.accessJustification` (justification
  explicite d'un mount sans `permission`) ; `EntitySpec.permission` /
  `.accessJustification` threadés sur le mount CRUD généré.
- `@creezio/brand-spec` doctor (seuil pin 0.16.0, mécanique
  `MODULE_MEILI_MISSING`) : `MODULE_TYPES_DIVERGENT` (redéclaration locale
  du contrat), `MODULE_PERMISSION_MISSING` (apiMount manuscrit sans
  `permission` ni `accessJustification` — règle d'or n°7, audit F3.4),
  `MODULE_PERMISSION_UNQUALIFIED` (warn sur la dette `"à qualifier"` posée
  par le codemod H9).
