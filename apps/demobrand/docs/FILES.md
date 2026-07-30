# Inventaire des fichiers - `apps/demobrand`

Inventaire des sources importantes de DemoBrand. Les dossiers générés ou
externes (`node_modules/`, `build/`, `dist-electron/`,
`dist-electron-server/`, données SQLite temporaires, logs) ne sont pas listés.

## Documentation et configuration package

| Fichier | Rôle |
| --- | --- |
| [`README.md`](../README.md) | Documentation fonctionnelle : rôle, lancement, env, architecture, packages et flux. |
| [`AGENTS.md`](../AGENTS.md) | Consignes pour agents de code : mission, interdits, points d'entrée et tests. |
| [`docs/FILES.md`](FILES.md) | Ce fichier, inventaire maintenu des sources importantes. |
| [`package.json`](../package.json) | Workspace `@creezio/app-demobrand`, scripts build/typecheck, publish dry-run et dépendances kit. |
| [`tsconfig.electron.json`](../tsconfig.electron.json) | Build TypeScript Electron : `src/electron` vers `build/electron`, types Node et shim Electron. |
| [`installer.nsh`](../installer.nsh) | Hooks NSIS placeholder pour install/uninstall. |

## Manifest et builder Electron

| Fichier | Rôle |
| --- | --- |
| [`src/electron/app-manifest.ts`](../src/electron/app-manifest.ts) | Manifest typé `AppManifest` utilisé au runtime : ids, feeds, DB, publish, sandbox. |
| [`src/electron/app-manifest.json`](../src/electron/app-manifest.json) | Copie JSON du manifest pour la génération et les outils sans import TS. |
| [`electron-builder.base.json`](../electron-builder.base.json) | Base commune electron-builder : fichiers, extraResources renderer, asar, NSIS, cible Windows. |
| [`electron-builder.client.json`](../electron-builder.client.json) | Config client générée depuis le manifest : appId, productName, GUID, icon, publish client. |
| [`electron-builder.server.json`](../electron-builder.server.json) | Config serveur générée depuis le manifest : appId serveur, output serveur, GUID, publish serveur. |
| [`scripts/build-builder-config.mjs`](../scripts/build-builder-config.mjs) | CLI qui résout le manifest (`@creezio/brand-config` ou JSON local) et régénère les configs builder. |

## Runtime Electron

| Fichier | Rôle |
| --- | --- |
| [`src/electron/main.ts`](../src/electron/main.ts) | Entrée Electron : `prepareDesktopBoot`, logs, kind file, sandbox runtime, nav model et `BrowserWindow`. |
| [`src/electron/preload.ts`](../src/electron/preload.ts) | Preload minimal : expose `window.demobrandDesktop` avec IPC génériques sans import `@creezio/*`. |
| [`src/electron/electron-shim.d.ts`](../src/electron/electron-shim.d.ts) | Déclarations minimales pour compiler sans installer le binaire Electron. |

## Sandbox DB/API/MCP

| Fichier | Rôle |
| --- | --- |
| [`src/electron/sandbox-runtime.ts`](../src/electron/sandbox-runtime.ts) | Coeur de la sandbox : migrations core/brand/plugin, `SqliteRuntime`, stores natifs, API Kernel, MCP, ACL, V1/V2/V3, install/uninstall plugins. |
| [`src/electron/admin-plugins-api.ts`](../src/electron/admin-plugins-api.ts) | Mount `/api/v1/modules/admin-plugins/*` : liste, upsert, preview, get/delete ACL plugins L3. |
| [`src/electron/plugin-factory-api.ts`](../src/electron/plugin-factory-api.ts) | Mount `/api/v1/modules/plugin-factory/*` : sessions, intention, clarification, approval, materialize, iterate. |
| [`src/electron/product-hub-stub.ts`](../src/electron/product-hub-stub.ts) | Tokens Product Hub dérivés du manifest, store injecté par runtime ou fallback SQLite/mémoire, création de demandes plugin. |

## Navigation et slot marque

| Fichier | Rôle |
| --- | --- |
| [`src/electron/nav-core.ts`](../src/electron/nav-core.ts) | Ré-export des items coeur `@creezio/shell-ui`, sans catalogue métier marque. |
| [`src/electron/nav-shell.ts`](../src/electron/nav-shell.ts) | Adapter shell-ui DemoBrand et registration de l'entrée métier sandbox `brand.notes`. |
| [`src/electron/vertical-slot.ts`](../src/electron/vertical-slot.ts) | Objet slot marque : brandId, items, registry, adapter shell et Product Hub sandbox. |

## Renderer statique de démo

| Fichier | Rôle |
| --- | --- |
| [`resources/renderer/index.html`](../resources/renderer/index.html) | Page DemoBrand statique chargée par `BrowserWindow`, liste bridge/env/deep-link et monte la nav. |
| [`resources/renderer/nav-shell-demo.js`](../resources/renderer/nav-shell-demo.js) | Miroir statique de la navigation coeur + `Notes`, preuve UI I7 sans backend. |
| [`resources/renderer/admin-plugins.html`](../resources/renderer/admin-plugins.html) | Page de maquette Admin Plugins L3 : formulaire upsert ACL, preview accès, tableau bindings. |
| [`resources/renderer/admin-plugins.js`](../resources/renderer/admin-plugins.js) | Client de la maquette : utilise `window.demobrandAdminPlugins` si présent, sinon fallback `localStorage`. |

## Sources générées non inventoriées

- `build/electron/**` est la sortie de `npm run build -w @creezio/app-demobrand`.
- `dist-electron/**` et `dist-electron-server/**` sont des sorties
  electron-builder.
- Les DB créées par `createDemobrandSandbox()` vivent sous le `userDataRoot`
  Electron ou un répertoire temporaire de test.
