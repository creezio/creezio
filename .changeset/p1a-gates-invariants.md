---
"@creezio/brand-spec": patch
"@creezio/electron-shell": patch
---

P1.a — invariants d'architecture gravés en gates. brand-spec : le doctor rapporte `CREEZIO_MANIFEST_MISALIGNED` (error fail-closed) quand une dep `@creezio/*` a des specs divergentes entre les manifests d'une app marque (racine/server/server/ui/client — incident réel login 0.6.0, règle d'or docs/PROPAGATION.md). electron-shell : suppression des 2 derniers imports statiques d'`electron` dans `src/host/browser-tabs` (chrome-ua, browser-tab-manager) au profit de `loadElectron()` — `src/host/**` reste chargeable en Node pur (gate `test-phase-host-no-electron`).
