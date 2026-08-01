# AGENTS — TempoFlow (sonde)

Marque légère sur **OS Creezio**.

- Desktop = `startBrandDesktop` (`@creezio/app-runtime`)
- Déclaration = migrations + `registerModuleApi` + feed + nav
- Métier = `brand-module-api.ts` + `brand-bonus-api.ts` + `brand-spec/`
- **Interdit** : glue OS (`src/lib/*`, `brand-runtime`), sidecar JSON

```bash
npm test
npm run metier:api
creezio brand doctor --spec brand-spec
```
