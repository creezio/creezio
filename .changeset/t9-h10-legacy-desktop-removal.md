---
"@creezio/electron-shell": minor
"@creezio/platform-core": minor
"@creezio/factory": minor
---

T9 — retrait de la compat desktop legacy (`ARCHITECTURE_VERSION` H9 →
**H10**, ADR `docs/adr/ADR-p2a-desktop-legacy-freeze.md` note de clôture).

Le module gelé `electron-shell/src/desktop/legacy-brand-compat.ts` est
supprimé, avec sa gate `test-phase-legacy-desktop-frozen` et l'empreinte
`scripts/legacy-desktop-frozen.json`. Le moteur desktop
(`installBrandDesktopRuntime`) applique des défauts génériques :
`<PREFIX>_PLUGINS_DIR`, `<brandId>fid`, `<PREFIX>_API_KEY`, preload unique
`preload.js`, contrat host `ensureDesktopNode` (sans alias).

**Breaking pour les clients desktop legacy** (repos hors kit appelant
`installBrandDesktopRuntime` directement avec un envPrefix historique) :
les valeurs d'env implicites et le basename preload historique ne sont
plus sondés. Migration automatique via `creezio upgrade` (codemod
`scripts/codemods/H10/`, idempotent, fail-closed) : injection des deps
explicites aux valeurs historiques, renommage `ensureTempoflowNode` →
`ensureDesktopNode`, rebascule `preload-app.js` → `preload.js`. Aucun
geste pour les marques modernes (`startBrandDesktop`).
