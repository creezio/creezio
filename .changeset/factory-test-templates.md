---
"@creezio/factory": patch
---

Templates factory : les scripts/feeds générés substituent les entités RÉELLES du ProductModel — `test-metier-parcours.mjs` testait un hardcode `notes` (404 sur une app sans ce module — vécu foove2-admin), le feed Meili générique indexait la table `notes` (absente du schema généré), et `test-meili-config.mjs` résolvait `meili-launcher.js`/`generic-indexer.js` par sondage d'un chemin monorepo kit inexistant dans une app npm (helper `electronShellDist` node_modules-first, porté de winhub). Fixture Meili générique : INSERT dans la table de la première entité du spec.
