# @creezio/app-runtime

## Rôle

`@creezio/app-runtime` est la **façade n°1 des marques** : elle orchestre le
boot complet d'un OS Creezio, en desktop Electron (`startBrandDesktop`) comme
en serveur headless (`startBrandKernelHarness`). La marque fournit son
manifest, ses migrations, son API métier, éventuellement un feed Meili et une
nav — tout le reste (paths, SQLite, embeds, auth, API `/api/v1`, MCP, splash,
updater, crash-reporter, sidecar navigateur) est composé ici.

## API publique

| Export | Rôle |
|--------|------|
| `startBrandDesktop(config)` | Boot desktop Electron complet (main mince côté marque) |
| `startBrandKernelHarness(config)` | Boot OS sans GUI (serveur Docker, smokes) |
| `composeBrandOs` | Composition de l'OS natif (kernel, stores, surfaces) |
| `listenBrandOsHttp` / `listenBrandBootHttp` | Serveurs HTTP OS + endpoint boot précoce |
| `createBootProgress` (`boot-progress.ts`) | Progression de boot headless : `GET /api/v1/os/boot-status`, JSONL stdout, journal ops |
| `warmBrandNativeHosts` | Préchauffage embeds (n8n, Hermes) |
| `wireBrandBrowserSidecar` | Sidecar navigateur IA (Chromium CDP, `CREEZIO_BROWSER_PROXY`) |
| `mountBrandEmailSurface` / `mountBrandMcpSurface` / `mountBrandPlatformSurface` | Surfaces optionnelles |

## Consommation marque

```ts
import { startBrandDesktop } from "@creezio/app-runtime";

await startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
});
```

## Comportements clés

- **Crash early writer** : `installEarlyCrashWriter()` est posé dès l'entrée
  de `startBrandDesktop`, avant toute résolution de chemins — un crash au
  tout début du boot laisse un `early-*.json` à côté de l'exécutable.
- **Data layout packagé** : toutes les données vivent sous
  `{installDir}/data/` (voir `resolvePackagedDataDir`, `@creezio/platform-core`).
- **Fleet** : sans `CREEZIO_FLEET_ENDPOINT`, l'endpoint par défaut est la
  sentinelle `…/ingest-disabled` — l'agent fleet ne fait alors **aucun**
  appel réseau.
- **Env utiles** : `CREEZIO_HTTP_HOST=0.0.0.0` (Docker), `CREEZIO_NATIVE_WARM=0`,
  `CREEZIO_DESKTOP_SHELL=window`, `CREEZIO_BROWSER_PROXY`.

## Liens

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md)
- [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
