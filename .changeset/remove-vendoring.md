---
"@creezio/factory": minor
---

Suppression définitive du vendoring : les artefacts générés par la factory ne référencent plus `vendor/creezio` — le proxy `creezio-cli.mjs` résout `CREEZIO_KIT_ROOT` → `node_modules/@creezio/factory` → chemin VPS, les wrappers desktop-tooling ne résolvent plus que via `node_modules`, et le test généré n'exclut plus de dossier `vendor`. Les gates de synchronisation de l'ère vendoring (O0, O5p, O9p, O10, O11, M1p, P0-intention) et la lib `intention-twins` sont retirées de la suite.
