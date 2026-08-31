---
"@creezio/platform-core": major
"@creezio/brand-config": major
"@creezio/search": major
"@creezio/host-runtime": major
"@creezio/electron-shell": major
"@creezio/product-hub": major
"@creezio/app-runtime": major
"@creezio/factory": major
---

H11 — purge de la compat TF2-era (`ARCHITECTURE_VERSION` H10 → **H11**,
ADR `docs/adr/ADR-h11-purge-tf2-compat.md`).

Dual-reads `TEMPOFLOW_*` retirés (env canonique = `envKey` / envPrefix
du manifest). Manifests kit `tempoflow` / `certivan` / `fidu` et leurs
entrées de registre supprimés (`demobrand` reste).
`createChrCatalogMeiliFeed` et l'alias `sites` → `fournisseurs` de
`fingerprintCountKey` retirés. Alias
`clearTempoflowGeneratedWebuiPassword` retiré ; le workspace IA exige
`preload.js` (échec explicite si absent). Fallback registre kit des
`build-builder-config.mjs` générés retiré.

**Breaking** : une marque qui s'appuie encore sur `TEMPOFLOW_*`, un
manifest kit, `createChrCatalogMeiliFeed`, l'alias Tempoflow du password
WebUI ou `preload-app.js` casse au boot / à l'import. Migration
automatique via `creezio upgrade` (codemod `scripts/codemods/H11/`,
idempotent, fail-closed).
