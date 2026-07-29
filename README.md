# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu)
+ factory de nouvelles marques + propagation kit→marques.

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.

## Structure

```
packages/
  brand-config/      # AppManifest + createAppManifest + buildElectronBuilderConfig
  shell/             # IPC, DesktopBridge, createDesktopApi (preload)
  platform-core/     # paths, app-kind, connection, tunnel, updater-state, plugin grants…
  product-hub/       # Product Hub brand-agnostic (lifecycle, PRD, ACL, control plane)
  electron-shell/    # runtime Electron (boot, updater, tray, splash, host stack)
  desktop-tooling/   # publish-desktop, remote-build-win, after-pack, build-status
  factory/           # creezio new-app (Phase D)
  propagation/       # semver, impacts, canaux PR, registre L3, extension points (Phase F)
apps/
  console/           # Console ops parc + versions kit + liens gates G1/G2/G3
  demobrand/         # Sandbox factory DemoBrand Client+Serveur + stub Product Hub
docs/
  PHASE-A.md … PHASE-F.md
  PROPAGATION.md
  gates/G1-CERTIVAN.md G2-FIDU.md G3-TEMPOFLOW.md
  PLATFORM-VS-VERTICAL.md
```

## Quick start

```bash
cd /opt/docker/creezio
npm install
npm run build
npm test
```

### Propagation (Phase F)

```bash
# Dry-run impact d'un bump
npm run kit:impact -- --package=@creezio/platform-core

# Prévisualiser bump + release notes
npm run kit:version -- --package=@creezio/shell --bump=patch

# Appliquer (écrit package.json + CHANGELOG)
npm run kit:version -- --package=@creezio/shell --bump=patch --apply
```

Détails : [docs/PROPAGATION.md](docs/PROPAGATION.md), [docs/PHASE-F.md](docs/PHASE-F.md).

### Factory new-app

```bash
npm run factory:new-app -- \
  --name DemoBrand \
  --id demobrand \
  --domain demobrand.creez.io \
  --force
```

### Product Hub (Phase E)

```ts
import {
  productHubTokensFromManifest,
  pluginN8nTag,
  createMemoryProductHubStore,
} from "@creezio/product-hub";
import { startHostPluginControlPlane } from "@creezio/electron-shell";
```

### Console ops

```bash
npm run console:dev    # http://127.0.0.1:3080
# GET /api/kit-versions  — inventaire packages + gates
# GET /api/feeds
```

### Tooling publish (générique)

```bash
npm run desktop:resolve-config -- --brand=demobrand --kind=client --pretty
npm run desktop:publish -- --brand=certivan --kind=client --dry-run
npm run desktop:remote-build -- --brand=tempoflow --dry-run
```

## Modèle standard : Client + Serveur

Chaque `AppManifest` expose **toujours** `client` et `server` + `publish`.
Les sandboxes factory portent `sandbox: true` (feeds jetables).

## Phases

| Phase | Contenu |
|-------|---------|
| **A** | Contrats + manifests + docs + build vert |
| **B** | Runtime Electron générique (boot/preload/updater/meili) |
| **B.2** | Hermes / n8n / tunnel / local-config / plugins host |
| **C** | Tooling publish + console ops |
| **D** | Factory new-app + sandbox DemoBrand |
| **E** | Plugins / Product Hub généralisés |
| **F** (ici) | Propagation kit (semver, canaux, registre L3, console, gates docs) |
| **G** | Branchement runtime — G1 Certivan → G2 Fidu → G3 TempoFlow |

Voir [docs/PHASE-F.md](docs/PHASE-F.md) et [docs/PROPAGATION.md](docs/PROPAGATION.md).

## Hors scope

- Pas de modification Fidu / Certivan / tempoflow2 depuis ce repo (Phase F)
- Pas de bascule runtime apps prod (Phase G, gated)
