---
"@creezio/electron-shell": minor
---

P2.a — desktop legacy : gel partiel à périmètre exact. La cartographie
prouve que `brand-desktop-runtime.ts` est le moteur desktop PARTAGÉ
(`startBrandDesktop` → `installBrandOsDesktop` l'appelle, shell `runtime`
par défaut) — un package `@creezio/legacy-desktop` gelé est écarté sur
preuve (ADR `docs/adr/ADR-p2a-desktop-legacy-freeze.md`). La compat marque
héritée fonctionnelle (défauts d'env legacy, query param SiteLink, ordre
des preloads historiques, alias `ensureTempoflowNode`) est extraite dans le
module feuille `desktop/legacy-brand-compat.ts`, GELÉ fail-closed : gate
`test-phase-legacy-desktop-frozen` (empreinte SHA-256 versionnée +
consommateurs verrouillés) ; fixes sécurité uniquement, retrait prévu au
bump H9 avec codemod clients legacy. Aucun changement d'API publique ni de
comportement — aucun geste requis côté marque (pas de bump
`ARCHITECTURE_VERSION`). Allowlist vocab F1.7 : périmètre desktop 33 → 21.
