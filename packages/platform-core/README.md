# `@creezio/platform-core`

Paths userData, local-config, embeds purs, plugins purs, **layout SQLite
multi-fichiers** (`core` / `brand` / `plugin/<id>`) + **runtime H2**.

## SQLite paths (H1.0)

| Helper | Fichier | Quand |
|--------|---------|-------|
| `resolveCoreDbPath` | `{userData}/sqlite/core.db` | Jour 0 |
| `resolveBrandDbPath` | `{userData}/{manifest.dbFileName}` | Jour 0 (alias soft de `resolveDbPath`) |
| `resolvePluginDbPath(id)` | `{userData}/sqlite/plugin/<id>.db` | À l'install (`ensurePluginDb`) |

## Runtime multi-DB (H2.0) + migrations (H2.1 / M11)

```ts
import {
  ARCHITECTURE_VERSION,
  createSqliteRuntime,
  platformCoreMigrations,
  composeMigrations,
} from "@creezio/platform-core";

const runtime = createSqliteRuntime({
  ctx,
  // M11 — cœur plateforme (auth + Product Hub) SoT kit
  coreMigrations: platformCoreMigrations(),
  // marque = métier only
  brandMigrations: composeMigrations({ id: "h2_brand_001", sql: BRAND_SQL }),
});
// jour 0 : core + brand ouverts ; aucun plugin
runtime.openPlugin("meteo", pluginMigrations); // à l'install
```

`platformCoreMigrations()` charge `@creezio/auth` + `@creezio/product-hub`
au runtime (peer optionnels) — IDs stables `PLATFORM_CORE_MIGRATION_IDS`.

Chaque fichier DB a sa table `_creezio_schema_migrations`.  
Constante `ARCHITECTURE_VERSION` (cadre H0/H1/H2/H3…).
