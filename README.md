# Creezio kit (`@creezio/*`)

Monorepo **plateforme** pour les desktops Creezio (TempoFlow, Certivan, Fidu).

> Chemin canonique sur le VPS : **`/opt/docker/creezio`**  
> Source d'extraction (lecture seule) : `/opt/docker/creezio-kit-src` = `creezio/tempoflow2` @ **v0.10.26**.

## Pourquoi ce repo ?

Les trois marques partagent le même shell Electron (Client + Serveur, feeds, preload, paths, splash, updater…).  
Ce kit isole les **contrats**, le **runtime générique**, le **tooling publish** et une **console ops**.

## Structure

```
packages/
  brand-config/      # AppManifest + manifests + buildElectronBuilderConfig + publish infra
  shell/             # IPC, DesktopBridge, createDesktopApi (preload)
  platform-core/     # paths, app-kind, connection, tunnel, updater-state…
  electron-shell/    # runtime Electron (boot, updater, tray, splash, host stack)
  desktop-tooling/   # publish-desktop, remote-build-win, after-pack, build-status
apps/
  console/           # Console ops parc (feeds, versions, dry-run remote-build)
docs/
  PHASE-A.md … PHASE-C.md
  PLATFORM-VS-VERTICAL.md
```

## Modèle standard : Client + Serveur

Chaque `AppManifest` expose **toujours** `client` et `server` + `publish` (DL, remote-build, statut).

## Quick start

```bash
cd /opt/docker/creezio
npm install
npm run build
npm test
```

### Console ops

```bash
npm run console:dev    # http://127.0.0.1:3080
```

Détails : [apps/console/README.md](apps/console/README.md).

### Tooling publish (générique)

```bash
npm run desktop:resolve-config -- --brand=certivan --kind=server --pretty
npm run desktop:build-status -- --brand=tempoflow
npm run desktop:publish -- --brand=fidu --dry-run
npm run desktop:remote-build -- --brand=certivan --dry-run
```

## Comment une app consommera le kit (Phase G)

Aujourd'hui **aucune** app ne dépend encore de ce repo pour son runtime.
Les scripts génériques sont prêts à être branchés :

```json
{
  "dependencies": {
    "@creezio/brand-config": "0.1.0",
    "@creezio/shell": "0.1.0",
    "@creezio/platform-core": "0.1.0",
    "@creezio/electron-shell": "0.1.0",
    "@creezio/desktop-tooling": "0.1.0"
  }
}
```

## Phases

| Phase | Contenu |
|-------|---------|
| **A** | Contrats + manifests + docs + build vert |
| **B** | Runtime Electron générique (boot/preload/updater/meili) |
| **B.2** | Hermes / n8n / tunnel / local-config / plugins host |
| **C** (ici) | Tooling publish + console ops |
| **D** | Factory new-app |
| **G** | Branchement Fidu / Certivan / TF2 sur le kit |

Voir [docs/PHASE-C.md](docs/PHASE-C.md) et [docs/PLATFORM-VS-VERTICAL.md](docs/PLATFORM-VS-VERTICAL.md).

## Hors scope

- Pas de modification Fidu / Certivan / tempoflow2 depuis ce repo
- Pas de consommation runtime du kit par les apps (Phase G)
