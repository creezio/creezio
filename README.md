# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu).

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.

## Pourquoi ce repo ?

Les trois marques partagent le même shell Electron (Client + Serveur, feeds, preload, paths).  
Ce kit isole les **contrats** et, plus tard, le **runtime** — sans toucher aux apps tant que la Phase G n'est pas lancée.

## Structure

```
packages/
  brand-config/   # AppManifest + manifests tempoflow / certivan / fidu
  shell/          # IPC, DesktopBridge, types window.*Desktop
  platform-core/  # paths / local-config schema (paramétrés par manifest)
apps/             # placeholder (consoles futures)
docs/
  PHASE-A.md
  PLATFORM-VS-VERTICAL.md
```

## Modèle standard : Client + Serveur

Chaque `AppManifest` expose **toujours** `client` et `server` :

- `appId` / `productName` / `executableName` / `artifactName`
- `feedUrl` (racine client, `/server/` pour le serveur)
- `nsisGuid` (mutex Uninstall distincts)
- `userDataSegment` / `packageName`
- `bridgeName`, `envPrefix`, `dbFileName`, `localConfigFileName`

Ce n'est **pas** une option de configuration.

## Quick start

```bash
cd /opt/docker/creezio
npm install
npm run build
```

## Comment une app consommera le kit (Phase G)

Aujourd'hui **aucune** app ne dépend encore de ce repo.

Plus tard (workspace npm ou package GitHub) :

```json
{
  "dependencies": {
    "@creezio/brand-config": "0.1.0",
    "@creezio/shell": "0.1.0",
    "@creezio/platform-core": "0.1.0"
  }
}
```

```ts
import { certivanManifest } from "@creezio/brand-config";
import { IpcChannels, getDesktopBridge } from "@creezio/shell";
import { resolveDbPath, resolveLocalConfigPath } from "@creezio/platform-core";

const ctx = {
  manifest: certivanManifest,
  userDataRoot: "/tmp/demo-userdata",
  isPackaged: false,
};

console.log(resolveDbPath(ctx));
// …/certivan.db

const api = getDesktopBridge(certivanManifest.bridgeName);
```

Les builds exe / publish des marques restent dans leurs repos respectifs.

## Phases

| Phase | Contenu |
|-------|---------|
| **A** (ici) | Contrats + manifests + docs + build vert |
| **B** | Runtime Electron générique (main/preload/launchers/updater) |
| **G** | Branchement Fidu / Certivan / TF2 sur le kit |

Voir [docs/PHASE-A.md](docs/PHASE-A.md) et [docs/PLATFORM-VS-VERTICAL.md](docs/PLATFORM-VS-VERTICAL.md).

## Hors scope Phase A

- Pas de publish npm / exe
- Pas de modification Fidu / Certivan / tempoflow2
- Pas de consommation du kit par les apps
