# AGENTS.md — @creezio/app-runtime

## Mission

Façade **unique** pour démarrer une marque desktop / harness Node.
Toute évolution Meili / HTTP kernel / session IPC se fait **ici** (ou dans
`electron-shell`) — jamais en dupliquant l'orchestration dans la marque.

## API publique

- `startBrandDesktop(config)` — Electron main mince
- `startBrandKernelHarness(config)` — smokes sans GUI

## Ne pas faire

- Pas de domaine métier (CHR, GED…) dans ce package.
- Pas de monolithe `installBrandDesktopRuntime` pour les sondes from-prd.
- La marque ne doit fournir que : `manifest`, `bootKernel`, `meiliFeed?`, `navItems?`.

## Consommation marque

```ts
import { startBrandDesktop } from "@creezio/app-runtime";
import { bootBrandKernel } from "./brand-runtime.js";

await startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  bootKernel: (o) => bootBrandKernel(o),
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
});
```
