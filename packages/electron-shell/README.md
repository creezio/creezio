# @creezio/electron-shell

## Rôle

`@creezio/electron-shell` est le runtime Electron plateforme Creezio. Il concentre le boot desktop, les fenetres, le tray, l'updater, la splash, la stack host locale, les sidecars Hermes/n8n/Meili/tunnel, le runtime plugins, les browser-tabs et les workspaces IA.

Ce package est volontairement brand-agnostic : les marques fournissent leur `AppManifest`, leurs chemins, leurs stores locaux, leurs prefixes d'env et leurs hooks verticaux.

## Périmètre

Inclus :

- runtime desktop complet via `installBrandDesktopRuntime` ;
- host stack lazy via `createHostStack`, `createBrandHostStack` et `createBrandHostRuntime` ;
- launchers Next, Meilisearch, Hermes Agent/WebUI, n8n, Cloudflare tunnel ;
- runtime plugins : discovery, scaffold, start/stop/restart, git versions, control plane, grants, accept-check, tests, data migrations ;
- bindings marque pour plugins (`configurePluginHost`) et workspaces IA (`configureAiWorkspaceHost`) ;
- browser-tabs exporte separement via `@creezio/electron-shell/browser-tabs` ;
- bridge client, crash reporter, safe storage, local config, node/npm runtime, sandbox OS ;
- overlays desktop : assistant chrome, profile picker, error page, OAuth loopback.

Hors perimetre :

- logique metier verticale ;
- UI admin metier ;
- secrets hardcodes ;
- choix d'auth, d'ACL et de provisioning propres a une marque.

## Installation/build

```bash
npm install
npm run build -w @creezio/electron-shell
npm run typecheck -w @creezio/electron-shell
```

Le package publie :

- `@creezio/electron-shell` : barrel principal runtime/host ;
- `@creezio/electron-shell/browser-tabs` : sous-export a privilegier pour les tests Node et les imports qui ne doivent pas tirer tout le barrel principal.

`electron` et `electron-updater` sont des peer dependencies optionnelles, chargees seulement par les chemins host/runtime concernes.

## Configuration

### HostRuntimeContext

Le contexte host est le noyau commun des launchers :

```ts
import { createBrandHostRuntime } from "@creezio/electron-shell";

const hostRuntime = createBrandHostRuntime({
  manifest,
  store: () => localConfigStore,
  paths,
  hermesCrm,
  n8nApiKey,
  n8nAgent,
  tunnel: {
    envBaseUrlKey: "MYBRAND_TUNNEL_PROVISIONER_URL",
    defaultBaseUrl: "https://tunnel.example.test",
    envTokenKey: "MYBRAND_TUNNEL_PROVISIONER_TOKEN",
    defaultToken: "",
    mailRootDomain: "mail.example.test",
  },
  npmUserDataSegment: "mybrand-npm",
  secretFilePrefix: "mybrand",
  hermesBridge: "full",
  nodeEnsure: "desktop",
  ensureDbScriptPath: () => brandEnsureCrmKeyDbScript(__dirname),
  log: (scope, line) => log(scope, line),
});
```

`createBrandHostRuntime` fournit des singletons Hermes, n8n, tunnel, fleet et ensure Node. `createBrandHostRuntimeContext` reste disponible si une marque veut composer elle-meme.

### Host stack

`createHostStack({ ctx, store })` construit directement :

- `hermes`
- `n8n`
- `tunnel`
- `plugins`
- `startMeili`
- `startNextServerCore`

`createBrandHostStack(cfg)` ajoute une couche de wiring marque : ports, paths, env, sandbox, feature-off, catalogue, fleet, factory reset et getters lazy compatibles avec `installBrandDesktopRuntime`.

### Bindings plugins marque

Le runtime riche des plugins exige `configurePluginHost(bindings)` avant usage :

```ts
import {
  configurePluginHost,
  buildPluginControlPlaneAdapters,
} from "@creezio/electron-shell";

configurePluginHost({
  envPrefix: "MYBRAND",
  productName: "MyBrand",
  brandId: "mybrand",
  userDataDir: paths.userDataDir,
  isPackaged: paths.isPackaged,
  nodeBinary: paths.nodeBinary,
  nodeScript: paths.nodeScript,
  gitBinary: paths.gitBinary,
  n8nHomeDir: paths.n8nHomeDir,
  dbPath: paths.dbPath,
  ensureDesktopNode: hostRuntime.ensureNode,
  nodeMinForEmbeds: "22.15.0",
  getN8nBridgeEnv,
  n8nDesktopPort: 5678,
  getLlmKeys: () => store.getLlmKeys(),
  hostRuntimeContext: () => hostRuntime.hostRuntimeContext(),
  manifest,
  buildControlPlaneAdapters: () => buildPluginControlPlaneAdapters(),
  createControlPlaneAcl: () => acl,
  ensureProductHubStore: () => productHubStore,
  closeProductHubStore: () => productHubStore.close(),
  apiKeyPrefix: "mybrand_live_",
});
```

Les variables plugins sont posees sur `${envPrefix}_*` et, si configure, sur les aliases legacy (`legacyEnvAliases`). Les permissions du manifest plugin pilotent l'injection CRM, n8n et LLM.

### Bindings ai-workspace

```ts
import { configureAiWorkspaceHost } from "@creezio/electron-shell";

configureAiWorkspaceHost({
  productName: "MyBrand",
  sessionCookieName: "mybrand_session",
  aiPartitionSlug: "mybrand-ai",
  shareWebSessionsEnvKey: "MYBRAND_AI_SHARE_WEB_SESSIONS",
  sessionStoragePrefix: "mybrand-ai-workspace",
  preloadPath: paths.preloadPath,
  createSupplierTabs,
  reportCrash,
  instrumentWebContents,
});
```

Chaque IA obtient une partition `persist:{aiPartitionSlug}-{userId}`, une vue CRM et son manager d'onglets isole.

## API publique + exemples

### Runtime desktop

```ts
import { installBrandDesktopRuntime } from "@creezio/electron-shell";

installBrandDesktopRuntime({
  manifest,
  bridgeName: manifest.bridgeName,
  accentColor: "#1967d2",
  cssPrefix: "mybrand",
  envPrefix: manifest.envPrefix,
  sessionCookieName: "mybrand_session",
  profileArgPrefix: "--mybrand-profile=",
  defaultDesktopPort: 18790,
  appKind: "client",
  bootBehavior,
  bootProfileLaunch,
  sessionPartition: "persist:mybrand",
  deepLinkProtocol: manifest.deepLinkProtocol,
  store: () => localConfigStore,
  hosts,
  paths,
  vertical,
  createLocalSplashSteps,
  electron,
});
```

Le runtime installe les handlers Electron, gere le boot local/remote, lance les sidecars, maintient le bridge, recharge Next lors des changements BYOK et garde le tray/updater coherent.

### Server launcher

```ts
import { startBrandNextServer } from "@creezio/electron-shell";

const server = await startBrandNextServer(deps, {
  meiliHost: meili?.host,
  meiliMasterKey: meili?.masterKey,
  bindHost: "127.0.0.1",
  extraEnv: {
    APP_PUBLIC_URL: tunnel.publicUrlForServer() ?? "",
  },
  onLog: (line) => log("next", line),
});
```

### Hermes / n8n / Meili / tunnel

```ts
const hermes = await hosts.hermes().startHermes({
  connectionMode: "local",
  crmPort: server.port,
  autoBootstrap: true,
});

const n8n = await hosts.n8n().startN8n({
  connectionMode: "local",
  publicBaseUrl: hosts.tunnel().publicUrlForEmbedService("n8n"),
});

const meili = await hosts.meili().startMeili((line) => log("meili", line));

await hosts.tunnel().configureTunnelIngress({
  crmPort: server.port,
  n8nPort: 5678,
  hermesPort: 7860,
});
```

### Plugins launcher/restart

```ts
import {
  startEnabledPlugins,
  restartPlugin,
  pluginsStatusPayloadWithGit,
} from "@creezio/electron-shell";

setPluginsCrmPort(server.port);
await startEnabledPlugins({ onLog: (line) => log("plugins", line) });
await restartPlugin("my-plugin");
const status = await pluginsStatusPayloadWithGit();
```

`restartPlugin` tue l'ancien child, attend la sortie, relance les plugins actives et attend un port si le plugin expose un panel.

### Control plane plugins

```ts
import { startHostPluginControlPlane } from "@creezio/electron-shell";

const state = await startHostPluginControlPlane({
  ctx: hostRuntime.hostRuntimeContext(),
  productHubStore,
  acl,
  preHandle: handleBrandExtras,
});
```

Le control plane loopback expose status, creation, ecriture de fichiers, enable/restart/delete et fetch Product Hub. Le token vient de `ensurePluginControlToken`.

### Browser tabs

Importer depuis le sous-export :

```ts
import {
  BrowserTabManager,
  configureBrowserTabs,
  executeSupplierAction,
} from "@creezio/electron-shell/browser-tabs";

configureBrowserTabs({
  resolvePreloadPath: () => paths.preloadPath("browser-tab-preload.js"),
});
```

Les onglets externes utilisent des `WebContentsView`, des partitions persistantes par site et des actions CDP trusted (`external_*`, alias legacy `supplier_*`).

### AI workspace

```ts
import { AiWorkspaceManager } from "@creezio/electron-shell";

const manager = new AiWorkspaceManager(mainWindow, ownerView, ownerTabs, {
  defaultPresentation: () => "window",
});

await manager.ensure({
  userId: "ai_1",
  token: sessionJwt,
  baseUrl: server.baseUrl,
  label: "Assistant IA",
});
manager.show("ai_1");
```

## Flux

### Boot local

1. La marque prepare `AppManifest`, chemins, store local et host runtime.
2. `installBrandDesktopRuntime` installe les handlers Electron apres le single instance lock.
3. La splash suit Node, catalogue, Meili, Hermes, n8n, tunnel et serveur Next.
4. `startBrandNextServer` spawn Next avec auth, secrets MCP, BYOK, Meili, embeds et env plugins.
5. Le bridge client se connecte au CRM local.
6. Le tunnel synchronise les ports CRM/n8n/Hermes si configure.
7. Les plugins actives sont demarrees et leur runtime state est ecrit.

### Mode remote

En mode remote, les modules host-only lourds ne sont pas lances. Les payloads de statut Hermes/n8n sont derives de l'origine distante pour garder les formes UI compatibles.

### Plugins

1. `configurePluginHost` injecte les chemins, env et adapters.
2. `discoverPlugins` lit les manifests.
3. `startEnabledPlugins` assure Node, cree les cles CRM plugin si permission, injecte n8n/LLM selon permissions et spawn le main plugin.
4. Les logs et ports detectes alimentent le runtime state.
5. Le control plane autorise scaffold, write files, enable, restart, delete, git versions et grants.

### Browser-tabs / AI workspace

Les browser-tabs servent a afficher et piloter des sites externes dans des `WebContentsView` isolees. L'AI workspace cree une vue CRM par persona IA et son propre manager d'onglets ; le mode `window` ouvre une fenetre parallele, le mode `embedded` remplace temporairement la vue owner.

## Intégration marques

La marque doit fournir :

- `AppManifest` et `envPrefix` ;
- chemins absolus : userData, resources, DB, Next standalone, Node, Meili, preloads ;
- store local : auth, LLM keys, tunnel config, embed configs, setup state ;
- hooks verticals : Product Hub store, ACL, extras control plane, catalogue, fleet si actif ;
- `configurePluginHost` avant tout usage du runtime plugins riche ;
- `configureAiWorkspaceHost` avant creation de workspaces IA ;
- `configureBrowserTabs` si le preload par defaut ne suffit pas.

Pour une marque sans plugins/flotte, utiliser `pluginsFeatureOff` / `createFeatureOffHost` afin de conserver les contrats UI sans lancer de sidecars.

## Dépendances

- `@creezio/brand-config` : `AppManifest`, host-only modules, env keys ;
- `@creezio/platform-core` : paths, plugins purs, embeds status, tunnel URLs, runtime helpers ;
- `@creezio/product-hub` : control plane plugins et tokens ;
- `@creezio/observability` : crash/fleet/ops journal ;
- `@creezio/shell` : contrats bridge ;
- peer deps `electron` et `electron-updater`.

## Voir aussi

- `AGENTS.md`
- `docs/FILES.md`
- sous-export `@creezio/electron-shell/browser-tabs`
- `packages/desktop-tooling/README.md` pour publish/remote-build
