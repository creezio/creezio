# Propagation — contrat kit → marques

Comment un changement du kit atteint les marques (TempoFlow, Certivan,
Fidu, TempoFlow3…), et comment les innovations terrain remontent.

## Modèle

```
L1 cœur (@creezio/*)
  ↓ descente (sync vendor + PR marque)
L2 produit métier (marques)
  ↓
L3 organisation cliente (plugins / ACL org)
  ↓
L4 utilisateur (plugins personnels)
  ↑ remontée innovations terrain
```

## Chemin nominal

1. Modifier le kit ; `npm run build:packages` ; `npm run test:kit` vert.
2. Merge sur `main`.
3. Côté marque :
   `CREEZIO_KIT_ROOT=<kit> bash crm/scripts/electron/sync-creezio-vendor.sh`
   — contrat canonique : [`scripts/sync-creezio-vendor.sh`](../scripts/sync-creezio-vendor.sh)
   (copie les packages construits vers `crm/vendor/creezio`).
4. Adapter le wiring marque si l'API publique change ; gates marque.

Politique de republish des binaires desktop : voir
[archive/REPUBLISH-POLICY.md](./archive/REPUBLISH-POLICY.md) (politique
historique toujours applicable : republier tous les artefacts impactés d'une
marque, feeds `latest.yml` cohérents).

## Semver `@creezio/*`

| Commit (Conventional) | Bump |
|-----------------------|------|
| `feat!:` / `BREAKING CHANGE` | **major** |
| `feat:` | **minor** |
| `fix:` / `perf:` | **patch** |
| `docs` / `test` / `chore` / `ci` / `build` / `style` / `refactor` | **none** (ou patch via `--force-patch`) |

- Changelog racine : [`CHANGELOG.md`](../CHANGELOG.md).
- Tooling : `npm run kit:version` (dry-run par défaut, `--apply` pour écrire) ;
  policy code : `@creezio/propagation` → `SEMVER_POLICY_SUMMARY`.

```bash
npm run kit:version -- --package=@creezio/platform-core --bump=minor
npm run kit:version -- --package=product-hub --from-commits --since=HEAD~10
npm run kit:version -- --package=@creezio/shell --bump=patch --apply
```

## Impact d'un bump

```bash
npm run kit:impact -- --package=@creezio/platform-core
npm run kit:impact -- --package=electron-shell --bump=major --json
```

Surfaces typiquement touchées par package : `brand-config` (deps,
electron-builder), `shell` (preload/main), `platform-core` (SqliteRuntime,
`ARCHITECTURE_VERSION`), `api-kernel` (façade HTTP), `mcp-facade` (proxy MCP),
`shell-ui` (nav + chrome UI), `auth` (session), `assistant` / `tasks` /
`mails` (modules CMS), `electron-shell` (runtime), `app-runtime` (façade
boot), `os-ui` (pages OS à rematérialiser), `desktop-tooling` (publish),
`factory` / `propagation` (outillage).

## Canaux marque

Contrat **kit bump → PR par marque** (`buildAllBrandPrPayloads(impact)`,
template [`.github/PULL_REQUEST_TEMPLATE/kit-bump.md`](../.github/PULL_REQUEST_TEMPLATE/kit-bump.md)).
Les gates historiques de premier branchement (G1/G2/G3) sont signées et
archivées : [archive/gates/](./archive/gates/).

## Registre plugins org (L3)

Contrat dans `@creezio/propagation` :

- `OrgPluginRecord` + `createMemoryOrgPluginRegistry` /
  `createFileOrgPluginRegistry({ filePath })` (persistance JSON ops)
- Visibilités : `owner_only` → `pending_review` → `promoted_vertical` → `promoted_kit`
- Remontée : `submitForOrgReview` → `proposeVerticalPromotion` → `proposeKitPromotion`
- Console : `GET/POST /api/org-plugins` (fichier `var/org-plugin-registry.json`)
- Cloud registry / auto-promotion = hors scope

## Points d'extension

| Direction | Chaîne |
|-----------|--------|
| **Descente** | `kit.release.published` → `vertical.deps.bumped` → `org.feature.rolled_out` → `user.plugin.entitled` |
| **Remontée** | `user.plugin.created` → `org.plugin.reviewed` → `vertical.plugin.promoted` → `kit.plugin.accepted` |

Bus in-process : `createExtensionHookBus()`.

## Console ops

`apps/console` affiche versions kit, canaux et parc feeds :

```bash
npm run console:dev   # http://127.0.0.1:3080
curl -s http://127.0.0.1:3080/api/kit-versions | jq .
```
