# AGENTS — TempoFlow (sonde)

Marque légère sur **OS Creezio**.

- Desktop = `startBrandDesktop` (`@creezio/app-runtime`)
- Kernel = `bootBrandKernel` (SQLite + api-kernel)
- API métier = `/api/v1/modules/*`
- BrandSpec = `brand-spec/` (SoT déclarative)
- **Interdit** : `metier-api.mjs`, `store.json`, jumeau d'orchestration OS

```bash
npm test
npm run metier:api
creezio brand doctor --spec brand-spec
```
