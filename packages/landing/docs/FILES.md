# FILES — @creezio/landing

| Fichier | Rôle |
|---|---|
| `package.json` | Exports `.` (server ESM+CJS) et `./ui` (React source) |
| `tsconfig.json` / `tsconfig.cjs.json` | Build dual ESM/CJS (refs api-kernel, platform-core) |
| `src/index.ts` | Types, kinds préfabriqués, `defaultLandingSeed`, `buildLandingSeedSql`, `landingMigrations`, `createLandingMount` (CRUD + upload base64), `resolveLandingMediaDir`, `createLandingMediaGET` (route Next binaire) |
| `ui/index.ts` | Surface React publique |
| `ui/types.ts` | Vues sections/settings + registry `LandingComponents` (surcharge par kind) |
| `ui/prefabs.tsx` | Préfabriqués hero/features/pricing/cta/footer + `LANDING_PREFAB_COMPONENTS` |
| `ui/landing-public-page.tsx` | Rendu public (fetch `GET /api/v1/modules/landing/public`) |
| `ui/landing-admin-client.tsx` | Client d'édition admin (sections, settings, médias) |
| `ui/landing.css` | Styles `.lnd-*` du rendu public |
