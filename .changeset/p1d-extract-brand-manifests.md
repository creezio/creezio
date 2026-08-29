---
"@creezio/brand-config": minor
"@creezio/platform-core": minor
"@creezio/factory": minor
---

P1.d — le kit ne publie plus les manifests de ses marques (« le kit ne
connaît pas ses consommateurs », docs/PROPAGATION.md). Bump
`ARCHITECTURE_VERSION` H7 → **H8** (codemod
`scripts/codemods/H8/h8-materialize-brand-manifest.mjs`, ADR
`docs/adr/ADR-h8-extract-brand-manifests.md`).

- `tempoflow3Manifest` et `manifests/tempoflow3.ts` **supprimés** : le
  manifest vit dans le repo marque (`src/electron/app-manifest.{ts,json}`,
  résolu via `resolveManifest` / le JSON local des scripts
  `build-builder-config.mjs`).
- `demobrandManifest` (sandbox kit) reste.
- **Politique de dépréciation (une version)** : `tempoflowManifest`,
  `certivanManifest`, `fiduManifest` et leurs entrées du registre
  `manifests` restent publiés UNE version, marqués `@deprecated (P1.d — à
  matérialiser dans le repo marque via le codemod H8)` — retrait au
  prochain bump d'architecture, après passage du codemod H8 dans les repos
  marque concernés.
- Factory : `build-builder-config.mjs` généré résout désormais « manifest
  local d'abord » (`src/electron/app-manifest.json`), registre kit en
  fallback déprécié avec warning.
- Gate `test-phase-no-brand-vocab` renforcée : exclusion globale
  `brand-config/src/manifests/` remplacée par des entrées exactes (117
  occurrences comptées, 44 supprimées avec tempoflow3.ts) + NV4 : tout
  nouveau fichier `manifests/<marque>.ts` hors demobrand = rouge.
