# @creezio/factory — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/factory/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`bin/creezio.js`](../bin/creezio.js) | 8 | — |
| [`src/cli.ts`](../src/cli.ts) | 136 | `CliArgs`, `parseArgs`, `runCli` |
| [`src/index.ts`](../src/index.ts) | 4 | `scaffoldNewApp`, `renderManifestTs`, `runCli`, `parseArgs` |
| [`src/minimal-png.ts`](../src/minimal-png.ts) | 7 | `MINIMAL_PNG_BASE64` |
| [`src/scaffold.ts`](../src/scaffold.ts) | 758 | `NewAppOptions`, `ScaffoldResult`, `renderManifestTs`, `app`, `BrowserWindow`, `contextBridge`, `ipcRenderer`, `get` |

---

## Détail par fichier

### `bin/creezio.js`

- **Lignes** : 8

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/cli.ts`

- **Lignes** : 136
- **Exports** : `CliArgs`, `parseArgs`, `runCli`

CLI `creezio new-app` — factory Phase D.
Usage:
  creezio new-app --name DemoBrand --id demobrand --domain demobrand.creez.io
  npm run factory:new-app -- --name DemoBrand --id demobrand

### `src/index.ts`

- **Lignes** : 4
- **Exports** : `scaffoldNewApp`, `renderManifestTs`, `runCli`, `parseArgs`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/minimal-png.ts`

- **Lignes** : 7
- **Exports** : `MINIMAL_PNG_BASE64`

PNG 1×1 vert minimal (valide pour electron-builder icons placeholder).
Remplacer par de vraies icônes marque avant publish.

### `src/scaffold.ts`

- **Lignes** : 758
- **Exports** : `NewAppOptions`, `ScaffoldResult`, `renderManifestTs`, `app`, `BrowserWindow`, `contextBridge`, `ipcRenderer`, `get`, `createDemoPluginRequest`, `VerticalSlot`, `verticalSlot`, `scaffoldNewApp`, `CORE_NAV_ITEMS`, `coreNavItems`

Scaffold d'une app marque Client+Serveur consommant @creezio.
Pas de catalogue TempoFlow — nav core placeholder + slot métier vide.

