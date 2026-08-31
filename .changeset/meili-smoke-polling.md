---
"@creezio/desktop-tooling": patch
"@creezio/factory": patch
---

Smokes compatibles cohérence éventuelle Meili (contrat kit : pas de write-through, liste servie `engine:"indexing"` + 0 item pendant l'indexation initiale). Nouveau helper SoT `@creezio/desktop-tooling/scripts/meili-list-poll.mjs` (`assertModuleRowHydratedById` via `GET ?ids=<id>` — hydratation PK, chemin SQL légitime — + `pollModuleListUntilVisible` : polling borné 60 s, échec explicite immédiat si `engine:"meili"` sans le doc). `e2e-browser-parcours.mjs` l'utilise (fini l'assertion naïve GET liste immédiat post-create) et indexe par défaut (`MEILI_SKIP_INDEX` passe de `"1"` à `"0"` — sinon la liste d'une entité indexée reste `engine:"indexing"` indéfiniment). Templates factory (`renderMetierParcoursSmoke` générique + CHR, `renderMiniPrdCoreSmoke`) régénérés sur le même pattern ; assertions d'origine conservées. Gate : `test-phase-meili-smoke-polling`.
