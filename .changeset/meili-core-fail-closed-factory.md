---
"@creezio/factory": patch
---

Meili core fail-closed dans le scaffold :

- `createSearchMount` généré : Meili KO = 503 `meili_unavailable` (SQL borné
  uniquement sous `CREEZIO_ALLOW_NO_MEILI=1`), `engine:"indexing"` pendant
  l'indexation initiale.
- Smokes générées (`harnessPrelude`) + workflow CI marque : posent
  `CREEZIO_ALLOW_NO_MEILI=1` (harness métier hors-browse — le boot
  fail-closed exige sinon un binaire Meili).
