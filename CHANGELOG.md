# Changelog


## [Unreleased]

### Added
- **Phase I4** — Control-plane unifié : `createPluginControlPlaneAclFromStore`,
  `buildPluginAclActorHeaders`, demobrand `controlPlaneAcl()`,
  doc `CONTROL-PLANE-BRAND-MIGRATION.md` ; tests `test-phase-i4.mjs`.
- **Phase I3** — Tasks/mails sqlite core : `createSqliteTasksStore`,
  `createSqliteMailsStore`, provider `file-sink` non-stub,
  demobrand mounts + migrations ; vendor sync élargi
  (assistant/tasks/mails) ; `docs/PHASE-I3.md` ; tests `test-phase-i3.mjs`.
- **Phase I2** — Assistant sqlite core : `createSqliteAssistantStore` +
  `ASSISTANT_CORE_SQL` (cible core.db ; `assistant_chats.db` legacy),
  demobrand migration `i2_001_assistant` ; `docs/PHASE-I2.md` ;
  tests `test-phase-i2.mjs`.
- **Phase I1** — Auth sqlite core : `createSqliteAuthStore` + driver
  injecté, demobrand sandbox branché, session persistée après restart ;
  `docs/PHASE-I1.md` ; tests `test-phase-i1.mjs`.
- **Phase I0** — Gouvernance post-H5 : `scripts/sync-creezio-vendor.sh`
  (assert `ARCHITECTURE_VERSION`, CJS, `SYNC.json`), wrappers sync
  TempoFlow / Certivan / Fidu, console + `GET /api/kit-versions`
  exposent `architectureVersion`, docs `PHASE-I0`, `REPUBLISH-POLICY`,
  `gates/POST-H5`, matrice/PROPAGATION H3–H5 ; tests `test-phase-i0.mjs`.
  Pas de republish exe ; `ARCHITECTURE_VERSION` reste `H5`.
- **Phase H5** — Harden plugins / ACL (`@creezio/product-hub`) :
  `decidePluginAccess` (see/install/execute), deny cross-org,
  `plugin_org_binding` + `plugin_acl_capability`, control-plane `acl`,
  api-kernel `authorizePluginAccess`, mcp
  `createDenyUnauthorizedPluginToolPolicy` + JWT `orgId`,
  `closePlugin` / `uninstallPlugin`, demobrand E2E ;
  `docs/BACKLOG-H5.md`, `docs/PHASE-H5.md` ; tests
  `scripts/test-phase-h5.mjs`.
- **Phase H4** — MCP proxy unifié durci (`@creezio/mcp-facade`) :
  namespaces, aliases legacy → canonique, `publicSurface: legacy-preferred`,
  `denyCrossLayerToolCall`, registry `registerTool`/`registerAlias`,
  tool admin `creezio.admin.list_aliases` ; `docs/BACKLOG-H4.md`,
  `docs/PHASE-H4.md` ; tests `scripts/test-phase-h4.mjs`.
  Consommation TF : aliases brand-runtime + catalogue Hono
  `list_tools_by_space` (pas de double exposition panier).
- **Phase H3** — modules métier TempoFlow dans le brand repo :
  contrats d’accueil consommés par tempoflow2 (`registerModuleApi`,
  MCP `space: module`, `registerBrandNav`) ; shell-ui accepte
  `brand.*` + href produit (`/panier`) ; `docs/BACKLOG-H3.md`,
  `docs/PHASE-H3.md` ; tests `scripts/test-phase-h3.mjs`.
  Implémentation marque : `/opt/docker/tempoflow2` (`electron/modules/`,
  `brand-runtime.ts`) — **aucun** code panier/dispatch dans `@creezio/*`.
- **Phase H2** — isolation DB/API runtime :
  `createSqliteRuntime` + `ensureMigrations` / `composeMigrations` ;
  `ScopedDbAccess` api-kernel (deny brand/plugin → core) ;
  MCP `listToolsBySpace` / `discoverToolsBySpace` ;
  demobrand `sandbox-runtime` preuve E2E ;
  `docs/BACKLOG-H2.md`, `docs/PHASE-H2.md` ; tests `scripts/test-phase-h2.mjs`.
- **Phase H1** — packages cœur CMS :
  `@creezio/api-kernel`, `@creezio/mcp-facade`, `@creezio/auth`,
  `@creezio/shell-ui`, `@creezio/assistant`, `@creezio/tasks`, `@creezio/mails` ;
  sqlite multi-fichiers (`resolveCoreDbPath` / `resolveBrandDbPath` /
  `resolvePluginDbPath` / `ensurePluginDb`) ; Product Hub
  `createSqliteProductHubStore` ; demobrand + factory branchés ;
  `docs/PHASE-H1.md` ; tests `scripts/test-phase-h1.mjs`.
- **Phase H0** — cadre architecture verrouillé :
  `docs/ARCHITECTURE-INTENTION.md`, `docs/MATRICE-NATIVE-METIER-PLUGIN.md`,
  `docs/BACKLOG-H1-PACKAGES.md`, `docs/PHASE-H0.md` ; liens README.

### Changed
- `@creezio/platform-core` : `ARCHITECTURE_VERSION = "H5"` (était `"H4"`).
- `@creezio/mcp-facade` : proxy H4 + policy plugin ACL H5.
- `@creezio/api-kernel` : garde `authorizePluginAccess` (H5).
- `@creezio/product-hub` : ACL L3 durcie + SQL H5.
- `@creezio/shell-ui` : guard nav — ids `brand.*` peuvent cibler les routes
  produit métier ; ids nus (`panier`) toujours refusés.
- Inventaire propagation : 15 packages `@creezio/*` (était 8).

### Fixed
- `publish-desktop.sh` : si le DL local est absent, publie via SSH sur
  `remoteBuildHost` (cas TempoFlow : feed sur hôte `crm.tempoflow.fr`).
- `buildElectronBuilderConfig` : ré-inclut les packages runtime `@creezio/*`
  (`brand-config`, `platform-core`, `product-hub`, `shell`, `electron-shell`)
  dans l'asar depuis `vendor/creezio/` quand `files` exclut `node_modules/**`.
  Corrige le crash packaged `Cannot find module '@creezio/brand-config'`
  (TempoFlow Server 0.10.27 / même trou latent Certivan & Fidu).

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
