# Propagation — contrat kit → marques (Notion §3–4)

> Phase F du kit `creezio/creezio`. **Ne bascule pas** les apps prod
> (Certivan / Fidu / TempoFlow) — voir [PHASE-F.md](PHASE-F.md) et gates
> [G1](gates/G1-CERTIVAN.md) / [G2](gates/G2-FIDU.md) / [G3](gates/G3-TEMPOFLOW.md).

## Modèle (rappel architecture)

```
L1 cœur (@creezio/*)
  ↓ descente
L2 produit métier (Certivan / Fidu / TempoFlow)
  ↓
L3 organisation cliente (plugins / ACL org)
  ↓
L4 utilisateur (plugins personnels)
  ↑ remontée innovations terrain
```

## Semver `@creezio/*`

| Commit (Conventional) | Bump |
|-----------------------|------|
| `feat!:` / `BREAKING CHANGE` | **major** |
| `feat:` | **minor** |
| `fix:` / `perf:` | **patch** |
| `docs` / `test` / `chore` / `ci` / `build` / `style` / `refactor` | **none** (ou patch via `--force-patch`) |

- Changelog racine : [`CHANGELOG.md`](../CHANGELOG.md) (Keep a Changelog sections).
- Tooling : `npm run kit:version` (dry-run par défaut, `--apply` pour écrire).
- Policy code : `@creezio/propagation` → `SEMVER_POLICY_SUMMARY`.

```bash
# Prévisualiser bump + release notes
npm run kit:version -- --package=@creezio/platform-core --bump=minor

# Déduire depuis commits
npm run kit:version -- --package=product-hub --from-commits --since=HEAD~10

# Appliquer (package.json + CHANGELOG)
npm run kit:version -- --package=@creezio/shell --bump=patch --apply
```

## Canaux de mise à jour

Contrat **kit bump → PR automatisable par marque** :

| Canal | Cible | Automatisable | Gate |
|-------|-------|---------------|------|
| `kit-workspace` | `creezio/creezio` | oui (`kit:version`) | — |
| `brand-pr-certivan` | `/opt/docker/certivan-app` | oui (Phase G) | G1 |
| `brand-pr-fidu` | `/opt/docker/fidu` | oui (Phase G) | G2 |
| `brand-pr-tempoflow` | `creezio/tempoflow2` | oui (Phase G) | G3 |
| `brand-pr-demobrand` | `apps/demobrand` | oui (kit) | — |
| `console-ops` | `apps/console` | lecture | — |

Templates PR : [`.github/PULL_REQUEST_TEMPLATE/kit-bump.md`](../.github/PULL_REQUEST_TEMPLATE/kit-bump.md).

Payloads générés par `buildAllBrandPrPayloads(impact)` — **aucune écriture**
dans les repos marques en Phase F.

## Mapping packages → surfaces

| Package | Surfaces typiques |
|---------|-------------------|
| `brand-config` | deps, electron-builder, main, desktop-scripts |
| `shell` | deps, preload, main |
| `platform-core` | deps, main, next-host-env |
| `product-hub` | deps, product-hub, main |
| `electron-shell` | deps, main, product-hub, next-host-env |
| `desktop-tooling` | deps, desktop-scripts, electron-builder |
| `factory` | sandbox demobrand |
| `propagation` | *(aucune surface marque)* |

Dry-run impacts :

```bash
npm run kit:impact -- --package=@creezio/platform-core
npm run kit:impact -- --package=electron-shell --bump=major --json
```

## Registre plugins org (L3)

Contrat dans `@creezio/propagation` :

- `OrgPluginRecord` + `createMemoryOrgPluginRegistry`
- Visibilités : `owner_only` → `pending_review` → `promoted_vertical` → `promoted_kit`
- Remontée : `submitForOrgReview` → `proposeVerticalPromotion` → `proposeKitPromotion`
- Persistance SQLite / UI = **vertical** (Phase G) — le kit expose le schéma + store mémoire

La console peut afficher un snapshot (mémoire / seed) via l'API kit.

## Points d'extension

| Direction | Chaîne |
|-----------|--------|
| **Descente** | `kit.release.published` → `vertical.deps.bumped` → `org.feature.rolled_out` → `user.plugin.entitled` |
| **Remontée** | `user.plugin.created` → `org.plugin.reviewed` → `vertical.plugin.promoted` → `kit.plugin.accepted` |

Bus in-process : `createExtensionHookBus()` — les apps brancheront leurs
adapters en Phase G.

## Console

`apps/console` affiche :

1. Versions packages kit (inventaire local workspace)
2. Liens docs gates G1 / G2 / G3
3. Parc feeds Client+Serveur (Phase C)

```bash
npm run console:dev   # http://127.0.0.1:3080
curl -s http://127.0.0.1:3080/api/kit-versions | jq .
```

## Checklist avant bascule (Phase G)

Ordre **strict** : G1 Certivan → G2 Fidu → G3 TempoFlow.

Pour chaque gate (détail dans `docs/gates/`) :

- [ ] Bump deps `@creezio/*` dans le `package.json` marque
- [ ] Remplacer modules dupliqués listés dans [PLATFORM-VS-VERTICAL.md](PLATFORM-VS-VERTICAL.md)
- [ ] `npm run build` + smoke Client (+ Serveur si applicable)
- [ ] Feeds `latest.yml` OK
- [ ] Runtime legacy encore disponible jusqu'à validation gate
- [ ] PR avec template kit-bump

## Hors scope Phase F

- Commit / push sur fidu, certivan-app, tempoflow2
- Publish npm registry privé
- Exécution réelle des gates G1–G3
