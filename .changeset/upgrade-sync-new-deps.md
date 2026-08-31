---
"@creezio/factory": patch
---

`creezio upgrade` synchronise désormais la LISTE des deps `@creezio/*` des manifests marque avec la SoT du kit (`SERVER/UI/CLIENT_CREEZIO_DEPS`) : les deps requises manquantes sont ajoutées en `^<lockstep>` (trou systémique — os-ui@0.20.0 matérialise `/granola` et `/grokbot` sur une marque sans ces deps → build cassé), jamais de suppression (dep hors SoT = warning listé). Nouveau module partagé `sync-creezio-deps.ts` (`planCreezioManifestSync` / `applyCreezioManifestSync`) consommé aussi par `scripts/propagate-brands.mjs` ; `renderUiPackageJson` consomme la nouvelle SoT `UI_CREEZIO_DEPS` (plus de liste inline parallèle).
