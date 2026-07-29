# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu)
+ factory de nouvelles marques + propagation kit→marques.

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.  
> Cadre architecture : **`ARCHITECTURE_VERSION = "H0"`** — voir docs Phase H0 ci-dessous.

## Architecture (Phase H0)

| Doc | Contenu |
|-----|---------|
| [docs/ARCHITECTURE-INTENTION.md](docs/ARCHITECTURE-INTENTION.md) | Intention (non-dev + technique), 3 couches, décisions verrouillées |
| [docs/MATRICE-NATIVE-METIER-PLUGIN.md](docs/MATRICE-NATIVE-METIER-PLUGIN.md) | Cartographie Natif / Métier / Plugin + statuts ✅/🟡/❌ |
| [docs/BACKLOG-H1-PACKAGES.md](docs/BACKLOG-H1-PACKAGES.md) | Packages `@creezio/*` à créer en H1 |
| [docs/PHASE-H0.md](docs/PHASE-H0.md) | Sign-off H0 |

En bref : Creezio = **CMS stable** (SQLite `core`, API/MCP façade, nav + slots) ;
le **métier** vit dans le repo marque (SQLite `brand`) ; les **plugins** sont
d’organisation (SQLite `plugin/<id>` à l’install). Phases A→G = extraction +
gates marques — **terminées**.

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
  ARCHITECTURE-INTENTION.md   # cadre H0
  MATRICE-NATIVE-METIER-PLUGIN.md
  BACKLOG-H1-PACKAGES.md
  PHASE-H0.md
  PHASE-A.md … PHASE-F.md
  DOD-PHASE-A-G.md
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

| Phase | Contenu | Statut |
|-------|---------|--------|
| **A** | Contrats + manifests + docs + build vert | ✅ |
| **B** | Runtime Electron générique (boot/preload/updater/meili) | ✅ |
| **B.2** | Hermes / n8n / tunnel / local-config / plugins host | ✅ |
| **C** | Tooling publish + console ops | ✅ |
| **D** | Factory new-app + sandbox DemoBrand | ✅ |
| **E** | Plugins / Product Hub généralisés | ✅ |
| **F** | Propagation kit (semver, canaux, registre L3, console, gates docs) | ✅ |
| **G** | Branchement runtime — G1 Certivan → G2 Fidu → G3 TempoFlow | ✅ |
| **H0** (ici) | Cadre architecture + matrice + backlog packages H1 | ✅ |
| **H1** | Création packages natifs (`api-kernel`, `mcp-facade`, `auth`, `shell-ui`…) | 🔜 |

Voir [docs/PHASE-H0.md](docs/PHASE-H0.md), [docs/DOD-PHASE-A-G.md](docs/DOD-PHASE-A-G.md),
[docs/PROPAGATION.md](docs/PROPAGATION.md).

## Hors scope

- Pas de modification Fidu / Certivan / tempoflow2 depuis ce repo (H0/H1 kit)
- Pas d’extraction du métier marque dans `@creezio/*` (décision H0 verrouillée)
