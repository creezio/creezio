# `@creezio/platform-core`

Paths userData, local-config, embeds purs, plugins purs, **layout SQLite
multi-fichiers** (`core` / `brand` / `plugin/<id>`).

## SQLite (H1.0)

| Helper | Fichier | Quand |
|--------|---------|-------|
| `resolveCoreDbPath` | `{userData}/sqlite/core.db` | Jour 0 |
| `resolveBrandDbPath` | `{userData}/{manifest.dbFileName}` | Jour 0 (alias soft de `resolveDbPath`) |
| `resolvePluginDbPath(id)` | `{userData}/sqlite/plugin/<id>.db` | À l'install (`ensurePluginDb`) |

Migration : garder `resolveDbPath` (= brand) ; préférer `resolveBrandDbPath`
dans le code neuf. Constante `ARCHITECTURE_VERSION` (cadre H0/H1…).

## Export public (extrait)

```ts
import {
  ARCHITECTURE_VERSION,
  resolveCoreDbPath,
  resolveBrandDbPath,
  resolvePluginDbPath,
  ensurePluginDb,
  ensureDay0SqliteLayout,
} from "@creezio/platform-core";
```
