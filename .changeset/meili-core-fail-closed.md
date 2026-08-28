---
"@creezio/electron-shell": patch
"@creezio/api-kernel": patch
"@creezio/app-runtime": patch
"@creezio/brand-spec": patch
---

Meili = composant CORE fail-closed (décision plateforme 2026-08-28) :

- `maybeBootBrandMeili` : feed avec ≥ 1 index + binaire absent / start KO =
  **throw `MeiliRequiredError`** (échec de boot explicite, comme une DB
  absente). Échappatoire unique `CREEZIO_ALLOW_NO_MEILI=1` (dev/tests
  hors-browse, warning bruyant). Plus de `engine:"sql-fallback"` par défaut.
- Entity-list (`createEntityApiMount`) : entité indexée + Meili KO =
  **503 `{error:"meili_unavailable"}`** (ou `engine:"indexing"` pendant
  l'indexation initiale) — zéro LIKE SQL de secours sur le catalogue. SQL
  reste légitime hors index (entité non indexée, filtre hors index visible,
  `?ids=`, archives).
- Nouveau `browseMeiliIndexOutcome` (api-kernel + electron-shell/meili) :
  issue discriminée `ok / empty_index / index_missing / filter_rejected /
  unavailable / unconfigured` ; `browseMeiliIndex` conservé (compat `null`).
- Doctor brand-spec : `MODULE_MEILI_MISSING` fail-closed (0.10.13+) — chaque
  module métier avec entité listable déclare `meiliIndexes` (schéma data +
  index) ou `horsIndexJustification` explicite.
- `startBrandDesktop` propage `MeiliRequiredError` (plus de swallow).
