# Changelog


## [Unreleased]

### Changed
- Phase G3 TempoFlow : `tempoflowManifest.defaultAppRoot` → `/opt/docker/tempoflow2/crm` ; gate G3 sign-off (TF 0.10.27).
- DoD A→G documenté (`docs/DOD-PHASE-A-G.md`).

Toutes les versions notables des packages `@creezio/*` sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/) ;
bumps via Conventional Commits (`npm run kit:version`).

## Kit — Phase G2 prep (2026-07-29)

### Changed

- `fiduManifest` : `buildServerArtifact: true`, `userDataSegment` client = `Fidu`
  (continuité `%APPDATA%/Fidu`)
- `buildElectronBuilderConfig` : option `clientSlim` (défaut `true`) +
  `nsisInclude: false` pour apps sans include NSIS custom

### Added

- Gate **G2 Fidu** sign-off : app 0.1.52 consomme `@creezio/*` via vendor ;
  feeds Client + Serveur publiés (voir `docs/gates/G2-FIDU.md`)

## Kit — Phase G1 prep (2026-07-29)

### Added

- Dual build **CJS** (`dist-cjs/` + `exports.require`) pour consommation depuis
  Electron CommonJS (Certivan / Fidu / TempoFlow) — `npm run build:cjs`
- Gate **G1 Certivan** exécutée : app consomme `@creezio/*` via `file:` (voir
  `docs/gates/G1-CERTIVAN.md`)

## @creezio/propagation@0.1.0 (2026-07-29) — minor

### Added

- **propagation**: Phase F — semver policy, impacts, canaux PR, registre plugins org L3, extension points descente/remontée
- **console**: panel versions kit + liens gates G1/G2/G3 + API `/api/kit-versions`
- **docs**: PROPAGATION.md, PHASE-F.md, checklists gates (non exécutées)

## Kit 0.1.0 — Phases A–E

### Added

- Packages brand-config, shell, platform-core, product-hub, electron-shell, desktop-tooling, factory
- Console ops parc desktop (Phase C)
- Factory new-app + demobrand (Phase D)
- Product Hub brand-agnostic (Phase E)
