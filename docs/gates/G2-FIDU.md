# Gate G2 — Fidu (Phase G)

> **Statut** : bascule code OK (2026-07-29) — Fidu **0.1.52** consomme `@creezio/*`
> via `vendor/creezio` ; dual Client+Serveur (`buildServerArtifact: true`).
> Publish feeds en cours / à valider ci-dessous.
> Ordre : **G1 Certivan → G2 Fidu → G3 TempoFlow**.

## Cible

| Champ | Valeur |
|-------|--------|
| Marque | Fidu |
| Repo / chemin | `/opt/docker/fidu` (`crm/`) |
| Manifest kit | `fiduManifest` (`@creezio/brand-config`) |
| envPrefix | `FIDU` |
| Client+Serveur | oui (`buildServerArtifact: true`) |
| Version app (G2) | `0.1.52` |
| userData client | `Fidu` (continuité `%APPDATA%/Fidu`) |
| clientSlim | **false** (pas encore host-stack lazy — stack locale dans les 2 exe) |

## Prérequis

- [x] G1 Certivan sign-off
- [x] Kit Phase F/G + dual CJS + `clientSlim` option + `fiduManifest` dual
- [x] Pipeline ship Fidu respectée (`fidu-desktop-ship-pipeline`) **après** verts

## Checklist bascule (Phase G)

### 1. Dépendances

- [x] Ajouter dans `crm/package.json` :
  - `@creezio/brand-config`
  - `@creezio/shell`
  - `@creezio/platform-core`
  - `@creezio/product-hub`
  - `@creezio/electron-shell`
  - `@creezio/desktop-tooling`
- [x] Vendor `crm/vendor/creezio/*` + `sync-creezio-vendor.sh`
- [x] Scripts npm → wrappers `desktop-tooling` (`electron:publish`, `remote-build`)
- [x] Commit type : `chore(deps): consume @creezio/* — kit creezio [fidu]`

### 2. Remplacements code

- [x] Manifest / builder → `buildElectronBuilderConfig` + `fiduManifest` (`clientSlim: false`)
- [x] Preload bridge → `exposeDesktopApi` / `FIDU_BRIDGE_NAME` (`window.fiduDesktop`)
- [x] Boot partiel → `applyFiduDesktopBoot` (avant `requestSingleInstanceLock`)
- [x] app-kind / profile façades kit
- [x] Dual `electron:build:win` + `electron:build:win:server`
- [x] **Rester vertical** : Paperclip, GED, seeds cabinet, Pennylane, UI CRM
- [x] **Ne pas purger** catalogue TF orphelin « pour nettoyer »
- [ ] Product Hub / control plane runtime *(tokens prêts via `fiduProductHubTokens`)*

### 3. Validation

- [x] `npm run build` + `npm run electron:compile`
- [x] `npm run test:app-kind` + `npm run test:shell`
- [x] `npm run test:fidu` (GED, dépôt, Meili, Pennylane, users, …)
- [ ] Feed client : `https://fidu.creez.io/dl-e660352fb04dbd5e2519f0e60897c548/latest.yml`
- [ ] Feed serveur : `…/server/latest.yml` (première publication)
- [ ] `remote-build-win.sh --publish` vert (Client + Serveur)

### 4. Coupure legacy

- [x] Runtime legacy encore dispo (façades + modules non basculés ; `clientSlim: false`)
- [ ] Publish feed uniquement après verts (règle ship pipeline)
- [ ] Sign-off G2 avant d'ouvrir G3

### 5. Sign-off G2

- [ ] Console / feeds Client + Serveur Fidu OK
- [ ] Exe publiés 0.1.52
- [ ] **Autorisation explicite** pour G3 TempoFlow

## Interdits

- ❌ Skip G1
- ❌ Publish sans tests verts
- ❌ Modifier tempoflow2 / certivan pendant G2 sauf hotfix hors kit
- ❌ Purger métier cabinet / catalogue TF orphelin « pour nettoyer »

## Références

- [PROPAGATION.md](../PROPAGATION.md)
- [PHASE-C.md](../PHASE-C.md) (publish tooling)
- Pipeline : `crm/docs/REMOTE-BUILD.md` (repo fidu)
