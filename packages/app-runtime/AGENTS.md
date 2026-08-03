# AGENTS.md — @creezio/app-runtime

## Mission

Façade **unique** pour démarrer une marque desktop / harness Node.
Toute évolution Meili / HTTP kernel / session IPC se fait **ici** (ou dans
`electron-shell`) — jamais en dupliquant l'orchestration dans la marque.

## API publique

- `startBrandDesktop(config)` — Electron main mince
- `startBrandKernelHarness(config)` — smokes sans GUI
- `composeBrandOs` / `listenBrandOsHttp` / `warmBrandNativeHosts` — OS natif

## Défauts plug-and-play (kit)

- `desktopProfile=full`, `desktopShell=runtime`
- `ensureKitOsBinaries()` au boot (Meili/cloudflared sous `electron-shell/resources/bin`)
- Warm n8n (skip : `CREEZIO_NATIVE_WARM=0`) ; Hermes warm : `CREEZIO_NATIVE_WARM_HERMES=1`
- Surface MCP locale : `CREEZIO_TUNNEL_LOCAL` (défaut on)
- Sonde agrégée : `GET /api/v1/os/ready`
- Opt-out shell : `CREEZIO_DESKTOP_SHELL=window`
- Bind Docker/headless : `CREEZIO_HTTP_HOST=0.0.0.0` (ou `METIER_HOST`)
  — voir `docker/server/` + `creezio server-docker`

## Ne pas faire

- Pas de domaine métier (CHR, GED…) dans ce package.
- Pas de vendor Hermes/n8n/binaires dans `apps/<marque>/resources`.
- La marque ne doit fournir que : `manifest`, migrations/API métier, `meiliFeed?`, `navItems?`.

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
