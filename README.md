# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu).

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.

## Pourquoi ce repo ?

Les trois marques partagent le même shell Electron (Client + Serveur, feeds, preload, paths, splash, updater…).  
Ce kit isole les **contrats** (Phase A) et le **runtime générique** (Phase B) — sans toucher aux apps tant que la Phase G n'est pas lancée.

## Structure

```
packages/
  brand-config/     # AppManifest + manifests + buildElectronBuilderConfig
  shell/            # IPC, DesktopBridge, createDesktopApi (preload)
  platform-core/    # paths, app-kind, connection, tunnel, updater-state…
  electron-shell/   # runtime Electron (boot, updater, tray, splash, launchers)
apps/               # placeholder (consoles futures)
docs/
  PHASE-A.md
  PHASE-B.md
  PLATFORM-VS-VERTICAL.md
```

## Modèle standard : Client + Serveur

Chaque `AppManifest` expose **toujours** `client` et `server` :

- `appId` / `productName` / `executableName` / `artifactName`
- `feedUrl` (racine client, `/server/` pour le serveur)
- `nsisGuid` (mutex Uninstall distincts)
- `userDataSegment` / `packageName`
- `bridgeName`, `envPrefix`, `deepLinkProtocol`, `sessionPartition`, `tunnelRootDomain`

Ce n'est **pas** une option de configuration.

## Quick start

```bash
cd /opt/docker/creezio
npm install
npm run build
npm test
```

## Comment une app consommera le kit (Phase G)

Aujourd'hui **aucune** app ne dépend encore de ce repo.

Plus tard (workspace npm ou package GitHub) :

```json
{
  "dependencies": {
    "@creezio/brand-config": "0.1.0",
    "@creezio/shell": "0.1.0",
    "@creezio/platform-core": "0.1.0",
    "@creezio/electron-shell": "0.1.0"
  },
  "peerDependencies": {
    "electron": ">=28",
    "electron-updater": ">=6"
  }
}
```

```ts
import { certivanManifest } from "@creezio/brand-config";
import { createDesktopApi, exposeDesktopApi, IpcChannels } from "@creezio/shell";
import { resolveDbPath, feedUrlForKind } from "@creezio/platform-core";
import {
  prepareDesktopBoot,
  setupAutoUpdater,
  TrayController,
} from "@creezio/electron-shell";

const boot = await prepareDesktopBoot(certivanManifest);
await setupAutoUpdater({
  feedUrl: feedUrlForKind(
    certivanManifest,
    boot.appKind === "server" ? "server" : "client",
  ),
});
```

Les builds exe / publish des marques restent dans leurs repos respectifs.

## Phases

| Phase | Contenu |
|-------|---------|
| **A** | Contrats + manifests + docs + build vert |
| **B** | Runtime Electron générique (boot/preload/updater/meili) |
| **B.2** (ici) | Hermes / n8n / tunnel / local-config / plugins host |
| **C** | Tooling publish / after-pack |
| **G** | Branchement Fidu / Certivan / TF2 sur le kit |

Voir [docs/PHASE-B.md](docs/PHASE-B.md), [docs/PHASE-B2.md](docs/PHASE-B2.md) et [docs/PLATFORM-VS-VERTICAL.md](docs/PLATFORM-VS-VERTICAL.md).

## Hors scope

- Pas de publish npm / exe depuis ce repo
- Pas de modification Fidu / Certivan / tempoflow2
- Pas de consommation du kit par les apps (Phase G)
