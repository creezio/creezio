# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu)
+ factory de nouvelles marques.

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
apps/
  console/           # Console ops parc (feeds, versions, dry-run remote-build)
  demobrand/         # Sandbox factory DemoBrand Client+Serveur + stub Product Hub
docs/
  PHASE-A.md … PHASE-E.md
  PLATFORM-VS-VERTICAL.md
```

## Quick start

```bash
cd /opt/docker/creezio
npm install
npm run build
npm test
```

### Factory new-app

```bash
npm run factory:new-app -- \
  --name DemoBrand \
  --id demobrand \
  --domain demobrand.creez.io \
  --force
```

Détails : [docs/PHASE-D.md](docs/PHASE-D.md).

### Product Hub (Phase E)

```ts
import {
  productHubTokensFromManifest,
  pluginN8nTag,
  createMemoryProductHubStore,
} from "@creezio/product-hub";
import { startHostPluginControlPlane } from "@creezio/electron-shell";
```

Détails : [docs/PHASE-E.md](docs/PHASE-E.md).

### Console ops

```bash
npm run console:dev    # http://127.0.0.1:3080
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
| **E** (ici) | Plugins / Product Hub généralisés |
| **F** | Propagation kit → apps marques |
| **G** | Branchement runtime Fidu / Certivan / TF2 |

Voir [docs/PHASE-E.md](docs/PHASE-E.md) et [docs/PLATFORM-VS-VERTICAL.md](docs/PLATFORM-VS-VERTICAL.md).

## Hors scope

- Pas de modification Fidu / Certivan / tempoflow2 depuis ce repo
- Pas de consommation runtime du kit par les apps prod (Phase F/G)
