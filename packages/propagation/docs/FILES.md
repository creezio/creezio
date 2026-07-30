# @creezio/propagation — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/propagation/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/brand-surfaces.ts`](../src/brand-surfaces.ts) | 174 | `BrandSurfaceId`, `BrandSurface`, `BRAND_SURFACES`, `ProductionBrandGate`, `PRODUCTION_BRAND_GATES`, `PACKAGE_SURFACE_MAP`, `brandsImpactedBySurfaces`, `surfaceMeta` |
| [`src/channels.ts`](../src/channels.ts) | 154 | `UpdateChannelId`, `UpdateChannel`, `UPDATE_CHANNELS`, `BrandPrPayload`, `buildBrandPrPayload`, `buildAllBrandPrPayloads` |
| [`src/extension-points.ts`](../src/extension-points.ts) | 205 | `PropagationDirection`, `ExtensionPointId`, `ExtensionHookPayload`, `ExtensionHookHandler`, `ExtensionPointDef`, `EXTENSION_POINTS`, `getExtensionPoint`, `ExtensionHookBus` |
| [`src/impact.ts`](../src/impact.ts) | 162 | `PackageBumpImpact`, `impactForPackageBump`, `formatImpactReport` |
| [`src/index.ts`](../src/index.ts) | 136 | `PHASE_G_GATES`, `KIT_PACKAGES`, `KIT_PACKAGE_NAMES`, `assertKitPackage`, `directDependents`, `getKitPackage`, `transitiveDependents`, `SEMVER_POLICY_SUMMARY` |
| [`src/kit-inventory.ts`](../src/kit-inventory.ts) | 101 | `KitPackageVersionRow`, `KitInventory`, `collectKitInventory`, `PublishedKitHint`, `publishedHintsFromInventory` |
| [`src/org-plugin-registry-file.ts`](../src/org-plugin-registry-file.ts) | 107 | `CreateFileOrgPluginRegistryOptions`, `createFileOrgPluginRegistry` |
| [`src/org-plugin-registry.ts`](../src/org-plugin-registry.ts) | 157 | `PropagationLevel`, `OrgPluginVisibility`, `OrgPluginRecord`, `OrgPluginRegistry`, `createMemoryOrgPluginRegistry`, `OrgPluginRegistrySnapshot`, `snapshotOrgPluginRegistry` |
| [`src/packages.ts`](../src/packages.ts) | 207 | `CreezioPackageName`, `KitPackageMeta`, `KIT_PACKAGES`, `KIT_PACKAGE_NAMES`, `getKitPackage`, `assertKitPackage`, `directDependents`, `transitiveDependents` |
| [`src/release-notes.ts`](../src/release-notes.ts) | 122 | `ChangelogSection`, `ChangelogEntry`, `sectionForCommit`, `entriesFromCommits`, `renderChangelogMarkdown`, `prependChangelog` |
| [`src/semver-policy.ts`](../src/semver-policy.ts) | 157 | `BumpKind`, `ConventionalCommitType`, `ParsedConventionalCommit`, `parseConventionalCommit`, `bumpKindFromCommit`, `bumpKindFromCommits`, `parseSemver`, `formatSemver` |

---

## Détail par fichier

### `src/brand-surfaces.ts`

- **Lignes** : 174
- **Exports** : `BrandSurfaceId`, `BrandSurface`, `BRAND_SURFACES`, `ProductionBrandGate`, `PRODUCTION_BRAND_GATES`, `PACKAGE_SURFACE_MAP`, `brandsImpactedBySurfaces`, `surfaceMeta`

Mapping packages kit → surfaces apps marques (contrat canal de mise à jour).
Phase F : contrat uniquement — pas de modification des repos marques.
Phase G : les PR automatisables consomment ce mapping.

### `src/channels.ts`

- **Lignes** : 154
- **Exports** : `UpdateChannelId`, `UpdateChannel`, `UPDATE_CHANNELS`, `BrandPrPayload`, `buildBrandPrPayload`, `buildAllBrandPrPayloads`

Contrat « kit bump → PR automatisable par marque ».
Phase F livre le contrat + templates ; l'automation GitHub Actions
côté repos marques est Phase G (gated).

### `src/extension-points.ts`

- **Lignes** : 205
- **Exports** : `PropagationDirection`, `ExtensionPointId`, `ExtensionHookPayload`, `ExtensionHookHandler`, `ExtensionPointDef`, `EXTENSION_POINTS`, `getExtensionPoint`, `ExtensionHookBus`, `createExtensionHookBus`, `DOWNWARD_CHAIN`, `UPWARD_CHAIN`

Points d'extension — descente (cœur→métier→org→user) et remontée
(plugin terrain→review→kit). Notion §3–4.
Contrats purs : les apps / console s'y branchent en Phase G.

### `src/impact.ts`

- **Lignes** : 162
- **Exports** : `PackageBumpImpact`, `impactForPackageBump`, `formatImpactReport`

Dry-run d'impact : bump package → packages dépendants + surfaces + marques.

### `src/index.ts`

- **Lignes** : 136
- **Exports** : `PHASE_G_GATES`, `KIT_PACKAGES`, `KIT_PACKAGE_NAMES`, `assertKitPackage`, `directDependents`, `getKitPackage`, `transitiveDependents`, `SEMVER_POLICY_SUMMARY`, `applyBump`, `bumpKindFromCommit`, `bumpKindFromCommits`, `compareSemver`, `formatSemver`, `parseConventionalCommit`, `parseSemver`, `BRAND_SURFACES`, `PACKAGE_SURFACE_MAP`, `PRODUCTION_BRAND_GATES`, `brandsImpactedBySurfaces`, `surfaceMeta`, `formatImpactReport`, `impactForPackageBump`, `UPDATE_CHANNELS`, `buildAllBrandPrPayloads`, `buildBrandPrPayload`, `createMemoryOrgPluginRegistry`, `snapshotOrgPluginRegistry`, `createFileOrgPluginRegistry`, `DOWNWARD_CHAIN`, `EXTENSION_POINTS`, `UPWARD_CHAIN`, `createExtensionHookBus`, `getExtensionPoint`, `entriesFromCommits`, `prependChangelog`, `renderChangelogMarkdown`, `sectionForCommit`, `collectKitInventory`, `publishedHintsFromInventory`

@creezio/propagation — Phase F
Semver / impacts / canaux PR / registre plugins org (L3) / extension points.
Aucune écriture dans les repos marques (fidu, certivan-app, tempoflow2).

### `src/kit-inventory.ts`

- **Lignes** : 101
- **Exports** : `KitPackageVersionRow`, `KitInventory`, `collectKitInventory`, `PublishedKitHint`, `publishedHintsFromInventory`

Inventaire versions packages kit (local workspace + métadonnées).
Utilisé par la console et `kit:version`.

### `src/org-plugin-registry-file.ts`

- **Lignes** : 107
- **Exports** : `CreateFileOrgPluginRegistryOptions`, `createFileOrgPluginRegistry`

Registre org plugins **persisté fichier JSON** (Phase I6).
Survives restart — console ops / dry-run remontée.
Pas de cloud multi-tenant ; pas d'auto-promotion.

### `src/org-plugin-registry.ts`

- **Lignes** : 157
- **Exports** : `PropagationLevel`, `OrgPluginVisibility`, `OrgPluginRecord`, `OrgPluginRegistry`, `createMemoryOrgPluginRegistry`, `OrgPluginRegistrySnapshot`, `snapshotOrgPluginRegistry`

Registre plugins organisation (contrat L3 — Notion §2–4).
- Mémoire : tests / dry-run
- Fichier : `createFileOrgPluginRegistry` (Phase I6) — console ops
Cloud registry / auto-promotion = hors scope.

### `src/packages.ts`

- **Lignes** : 207
- **Exports** : `CreezioPackageName`, `KitPackageMeta`, `KIT_PACKAGES`, `KIT_PACKAGE_NAMES`, `getKitPackage`, `assertKitPackage`, `directDependents`, `transitiveDependents`

Catalogue des packages @creezio et graphe de dépendances internes.
Source de vérité pour impacts de bump et canaux de mise à jour.

### `src/release-notes.ts`

- **Lignes** : 122
- **Exports** : `ChangelogSection`, `ChangelogEntry`, `sectionForCommit`, `entriesFromCommits`, `renderChangelogMarkdown`, `prependChangelog`

Helpers changelog / release notes (Keep a Changelog + Conventional Commits).

### `src/semver-policy.ts`

- **Lignes** : 157
- **Exports** : `BumpKind`, `ConventionalCommitType`, `ParsedConventionalCommit`, `parseConventionalCommit`, `bumpKindFromCommit`, `bumpKindFromCommits`, `parseSemver`, `formatSemver`, `applyBump`, `compareSemver`, `SEMVER_POLICY_SUMMARY`

Policy semver @creezio — Conventional Commits → bump.
Convention changelog : voir docs/PROPAGATION.md § Semver.

