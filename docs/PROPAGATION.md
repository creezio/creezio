# Propagation — contrat kit → marques

Comment un changement du kit atteint les marques (TempoFlow, Certivan,
Fidu, TempoFlow3…), et comment les innovations terrain remontent.


> **DOCTRINE CIBLE (2026-08) — distribution npm versionnée.** Les packages
> `@creezio/*` sont désormais publiés sur GitHub Packages avec des versions
> semver en lockstep ([NPM-DISTRIBUTION.md](./NPM-DISTRIBUTION.md)). Les apps
> migrent vers `npm update @creezio/…`. Le mécanisme vendor décrit ci-dessous
> est **DÉPRÉCIÉ** : il reste documenté et fonctionnel le temps de la
> migration, puis sera retiré.
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

## Chemin nominal — modèle PULL (open source)

Le kit est open source : il aura potentiellement 100+ apps consommatrices,
dont des apps d'autres développeurs. **Le kit ne connaît pas ses
consommateurs** — pas de registre, pas de notification, pas de test des
apps dans la CI kit. La propagation est à l'initiative de CHAQUE app
(gouvernance complète : [CONTRIBUTING-BRANDS.md](./CONTRIBUTING-BRANDS.md)) :

1. **Le kit publie** : modifier le kit ; `npm run build:packages` ;
   `npm run test:kit` vert ; push/merge sur `main`. Le kit se protège avec
   SES gates — dont `test-phase-arch-codemod` : un bump
   `ARCHITECTURE_VERSION` sans codemod de migration est ROUGE
   ([`scripts/codemods/README.md`](../scripts/codemods/README.md)). C'est ce
   contrat (changelog + versioning + codemods) qui protège les apps.
2. **L'app mesure quand elle veut** : distribution npm — la marque
   consomme `@creezio/*` en versions publiées (`^<lockstep>`). Vérifier une
   montée = `npm update "@creezio/*"` sur une branche + suite complète CI.
   Le changelog kit (changesets) liste les breaking `feat!`/`fix!` et les
   bumps `ARCHITECTURE_VERSION`.
3. **Le développeur de l'app décide** : merge de la branche de bump
   (lockfile commité — CI + deploy de l'app suivent).
4. Breaking change (`ARCHITECTURE_VERSION`) : codemods de migration
   obligatoires, livrés dans le MÊME commit kit que le bump (gate
   `test-phase-arch-codemod`) et appliqués par la marque lors de la
   montée de version.

`node_modules/` côté app est GÉNÉRÉ — jamais de patch manuel d'un package
`@creezio/*` installé (écrasé au prochain `npm ci`).

## Topologie multi-serveurs

Chaque app est indépendante : **un serveur par app**, avec son runner
self-hosted pour ses workflows lourds (kit-compat, vendor-update, deploy).
Une app SANS runner (serveur pas encore câblé, ou dev tiers sans infra)
tourne intégralement sur GitHub-hosted : générer ses workflows avec
`githubHosted: true` (factory) + secret repo `CREEZIO_CI_TOKEN` (token
lisant le repo kit) — seuls kit-compat et vendor-update en ont besoin ; le
deploy, lui, exige toujours le runner du serveur de l'app.

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
