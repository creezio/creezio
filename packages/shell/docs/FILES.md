# @creezio/shell — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/shell/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/create-crm-host-preload.ts`](../src/create-crm-host-preload.ts) | 319 | `createCrmHostPreloadExtensions`, `CrmHostPreloadExtensions`, `buildCrmHostDesktopApi`, `CrmHostDesktopApi`, `PreloadTelemetryOptions`, `installPreloadTelemetry`, `wireCrmHostPreload` |
| [`src/create-desktop-api.ts`](../src/create-desktop-api.ts) | 243 | `IpcRendererLike`, `ContextBridgeLike`, `createDesktopApi`, `exposeDesktopApi` |
| [`src/index.ts`](../src/index.ts) | 34 | `IpcChannels`, `getDesktopBridge`, `createDesktopApi`, `exposeDesktopApi`, `buildCrmHostDesktopApi`, `createCrmHostPreloadExtensions`, `installPreloadTelemetry`, `wireCrmHostPreload` |
| [`src/ipc-channels.ts`](../src/ipc-channels.ts) | 109 | `IpcChannels`, `IpcChannelGroup` |
| [`src/types.ts`](../src/types.ts) | 232 | `DesktopTabInfo`, `DesktopContentRect`, `DesktopExternalTabOpened`, `DesktopSupplierTabOpened`, `DesktopTabLoadState`, `DesktopAppKind`, `DesktopInfo`, `DesktopConnectionProfile` |

---

## Détail par fichier

### `src/create-crm-host-preload.ts`

- **Lignes** : 319
- **Exports** : `createCrmHostPreloadExtensions`, `CrmHostPreloadExtensions`, `buildCrmHostDesktopApi`, `CrmHostDesktopApi`, `PreloadTelemetryOptions`, `installPreloadTelemetry`, `wireCrmHostPreload`

Extensions preload CRM hôte (Hermes / n8n / plugins / flotte / setup…) +
télémétrie renderer — extrait gold preload-app ×3 (O7).
Les canaux restent les littéraux historiques (handlers main), pas une
renumérotation IpcChannels partielle.

### `src/create-desktop-api.ts`

- **Lignes** : 243
- **Exports** : `IpcRendererLike`, `ContextBridgeLike`, `createDesktopApi`, `exposeDesktopApi`

Fabrique l'objet exposé via contextBridge sous `window[bridgeName]`.
Port structurel de electron/preload-app.ts (TF2 0.10.26) — sans hardcoder
le nom du bridge.
⚠️ Préload packagé via extraResources (hors asar) : NE PAS `require`
`@creezio/shell` ni le manifest depuis le preload compilé — Node ne
résout pas `node_modules` depuis `resources/electron/`. Préférer un
littéral `contextBridge.exposeInMainWorld("…Desktop", api)` dans le
preload de l'app, ou bundler le preload (esbuild) pour inliner ce module.

### `src/index.ts`

- **Lignes** : 34
- **Exports** : `IpcChannels`, `getDesktopBridge`, `createDesktopApi`, `exposeDesktopApi`, `buildCrmHostDesktopApi`, `createCrmHostPreloadExtensions`, `installPreloadTelemetry`, `wireCrmHostPreload`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/ipc-channels.ts`

- **Lignes** : 109
- **Exports** : `IpcChannels`, `IpcChannelGroup`

Canaux IPC communs aux shells desktop Creezio.
Extraits des preload-app.ts (TF2 0.10.26, Certivan, Fidu) — contrat
de nommage partagé. Le runtime Electron (handlers) sera porté en Phase B.

### `src/types.ts`

- **Lignes** : 232
- **Exports** : `DesktopTabInfo`, `DesktopContentRect`, `DesktopExternalTabOpened`, `DesktopSupplierTabOpened`, `DesktopTabLoadState`, `DesktopAppKind`, `DesktopInfo`, `DesktopConnectionProfile`, `DesktopUpdateState`, `DesktopUpdateStatus`, `DesktopBridge`, `getDesktopBridge`

Types communs preload / renderer — abstraction des window.*Desktop.
Intersection des API TempoFlow / Certivan / Fidu (noyau partagé).
Les extensions verticales restent dans chaque app jusqu'à Phase B/G.

