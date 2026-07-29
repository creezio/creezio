# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu)
+ factory de nouvelles marques + propagation kit→marques.

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.  
> Cadre architecture : **`ARCHITECTURE_VERSION = "H6"`** — H0–H5 + freeze I0–I8.

## Architecture (Phases H0 → H5 + I0…)

| Doc | Contenu |
|-----|---------|
| [docs/ARCHITECTURE-INTENTION.md](docs/ARCHITECTURE-INTENTION.md) | Intention (non-dev + technique), 3 couches, décisions verrouillées |
| [docs/MATRICE-NATIVE-METIER-PLUGIN.md](docs/MATRICE-NATIVE-METIER-PLUGIN.md) | Cartographie Natif / Métier / Plugin + statuts ✅/🟡/❌ |
| [docs/BACKLOG-H1-PACKAGES.md](docs/BACKLOG-H1-PACKAGES.md) | Packages `@creezio/*` H1 |
| [docs/BACKLOG-H2.md](docs/BACKLOG-H2.md) | Isolation DB/API runtime H2 |
| [docs/BACKLOG-H3.md](docs/BACKLOG-H3.md) | Modules métier TempoFlow (brand repo) H3 |
| [docs/BACKLOG-H4.md](docs/BACKLOG-H4.md) | MCP proxy unifié H4 |
| [docs/BACKLOG-H5.md](docs/BACKLOG-H5.md) | Harden plugins / ACL H5 |
| [docs/PHASE-H0.md](docs/PHASE-H0.md) … [PHASE-H5.md](docs/PHASE-H5.md) | Sign-offs H0–H5 |
| [docs/PHASE-I0.md](docs/PHASE-I0.md) … [PHASE-I18.md](docs/PHASE-I18.md) | Sign-offs I0–I8 (kit H6) + I9–I18 conso 3 marques |
| [docs/PHASE-D0.md](docs/PHASE-D0.md) | Dette post-I18 — D0 docs/matrice → D1…D6 |
| [docs/PHASE-C0.md](docs/PHASE-C0.md) | Correction post-audit — C0 docs → C1…C8 |
| [docs/PHASE-R0.md](docs/PHASE-R0.md) | Gel inventions — V1–V3 prototypes ≠ SoT |
| [docs/PHASE-R1.md](docs/PHASE-R1.md) | Database TF → `@creezio/database` (natif) |
| [docs/PHASE-R2.md](docs/PHASE-R2.md) | Product Hub SoT unique `core.db` |
| [docs/FEATURE-PARITY-DEMOBRAND-H6.md](docs/FEATURE-PARITY-DEMOBRAND-H6.md) | Checklist parity demobrand avant I9 |
| [docs/REPUBLISH-POLICY.md](docs/REPUBLISH-POLICY.md) | Politique republish (I*/D*/C* — republish C* en C8) |
| [docs/gates/POST-H5.md](docs/gates/POST-H5.md) | Checklist gates post-H5 + backlog C* |

En bref : Creezio = **CMS stable** (SQLite `core`, API/MCP façade, nav + slots) ;
le **métier** vit dans le repo marque (SQLite `brand`) ; les **plugins** sont
d’organisation (SQLite `plugin/<id>` à l’install). Phases A→G = extraction +
gates — **terminées**. H1 = packages natifs. H2 = **isolation runtime**.
H3 = **modules TempoFlow** montés dans le brand repo (pas dans le kit).
H4 = **MCP proxy unifié** (aliases anti-doublon, deny cross-layer).
H5 = **ACL plugins L3** (see/install/execute, deny cross-org).
I0 = **gouvernance** sync vendor + console `ARCHITECTURE_VERSION` + politique republish.

## Structure

```
packages/
  brand-config/      # AppManifest + createAppManifest + buildElectronBuilderConfig
  shell/             # IPC, DesktopBridge, createDesktopApi (preload)
  shell-ui/          # Nav Creezio + slots métier (H1.4)
  platform-core/     # paths, SqliteRuntime H2, migrations, app-kind…
  product-hub/       # Product Hub + ACL L3 H5 (see/install/execute)
  api-kernel/        # Façade HTTP /api/v1 + ScopedDbAccess H2 + ACL plugin H5
  mcp-facade/        # MCP proxy unifié H4 + deny plugin ACL H5
  auth/              # Session native (H1.3)
  assistant/         # Chat plateforme (H1.5)
  tasks/             # Tâches plateforme (H1.6)
  mails/             # Mails plateforme (H1.7)
  observability/     # Activité / usages plugins / control-plane (V2)
  automations/       # Lifecycle-only plugins/org/factory (V3 prototype ≠ Database)
  database/          # Admin Database + automations row-level (R1, SoT TF)
  electron-shell/    # runtime Electron (boot, updater, tray, splash, host stack)
  desktop-tooling/   # publish-desktop, remote-build-win, after-pack, build-status
  factory/           # creezio new-app (Phase D + wiring H1.9)
  propagation/       # semver, impacts, canaux PR, registre L3, extension points
apps/
  console/           # Console ops parc + versions kit + liens gates G1/G2/G3
  demobrand/         # Sandbox H2 multi-DB + shell-ui / api-kernel
docs/
  ARCHITECTURE-INTENTION.md
  MATRICE-NATIVE-METIER-PLUGIN.md
  BACKLOG-H1-PACKAGES.md BACKLOG-H2.md
  PHASE-H0.md PHASE-H1.md PHASE-H2.md
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
| **H0** | Cadre architecture + matrice + backlog packages H1 | ✅ |
| **H1** | Packages natifs (`api-kernel`, `mcp-facade`, `auth`, `shell-ui`…) | ✅ |
| **H2** | Isolation multi-DB / ScopedDb / MCP by space | ✅ |
| **H3** | Modules métier TF (brand repo) | ✅ |
| **H4** | MCP proxy unifié (aliases, policies) | ✅ |
| **H5** | Harden plugins / ACL | ✅ |
| **I0–I8** | Gouvernance + persistance + freeze H6 | ✅ |
| **I9–I18** | Conso TempoFlow / Certivan / Fidu + republish | ✅ |
| **D0** | Alignement docs / matrice post-I18 | ✅ |
| **D1–D3** | TF MCP / stores / scan + republish **0.10.31** | ✅ |
| **D4–D5** | Fidu CP HTTP **0.1.56** + ADR clientSlim false | ✅ |
| **D6** | Certivan polish aliases | ✅ |
| **V1** | Fabrique plugins conversationnelle (demobrand E2E) | ✅ socle / 🟡 produit → **C3** |
| **V2** | Observabilité native (activité / usages / control-plane) | ✅ socle / 🟡 persist+vendor → **C4** |
| **V3** | Automations lifecycle-only (prototype ≠ Database) | ✅ socle / C4 |
| **C0** | Alignement docs / gates / backlog correction | ✅ |
| **C1** | Cutover stores TF SoT kit (zéro dual-write) | ✅ |
| **C2** | Certivan MCP+stores fermés en code | ✅ |
| **C3–C8** | V1 réel, V2/V3, mounts, CP, republish | ✅ |
| **R0** | Gel inventions — V1–V3 prototypes ≠ SoT | ✅ |
| **R1** | Database TF → `@creezio/database` (natif) | ✅ |

Voir [docs/PHASE-R0.md](docs/PHASE-R0.md), [docs/PHASE-R1.md](docs/PHASE-R1.md),
[docs/PHASE-C0.md](docs/PHASE-C0.md), [docs/PHASE-D0.md](docs/PHASE-D0.md),
[docs/PHASE-V1.md](docs/PHASE-V1.md), [docs/PHASE-V2.md](docs/PHASE-V2.md),
[docs/PHASE-V3.md](docs/PHASE-V3.md), [docs/VISION-V1-V3.md](docs/VISION-V1-V3.md),
[docs/PHASE-H5.md](docs/PHASE-H5.md),
[docs/DOD-PHASE-A-G.md](docs/DOD-PHASE-A-G.md), [docs/PROPAGATION.md](docs/PROPAGATION.md).

## Hors scope

- Pas d’extraction du métier marque dans `@creezio/*` (décision H0 verrouillée)
- Auto-promotion plugin→module, univers perso, cloud registry (volontaire)
