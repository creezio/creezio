# @creezio/brand-config — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/brand-config/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/build-builder-config.ts`](../src/build-builder-config.ts) | 286 | `CREEZIO_ASAR_RUNTIME_PACKAGES`, `DEFAULT_HOST_ONLY_ELECTRON_MODULES`, `BuildBuilderConfigOptions`, `buildElectronBuilderConfig` |
| [`src/create-manifest.ts`](../src/create-manifest.ts) | 223 | `AppManifestSpec`, `defaultFeedToken`, `createAppManifest`, `validateAppManifest` |
| [`src/index.ts`](../src/index.ts) | 84 | `manifests`, `BrandId`, `getManifest`, `listBrandIds`, `listProductionBrandIds`, `isSandboxBrand`, `appKindEnvKey`, `appSessionPartition` |
| [`src/manifests/certivan.ts`](../src/manifests/certivan.ts) | 68 | `certivanManifest` |
| [`src/manifests/demobrand.ts`](../src/manifests/demobrand.ts) | 15 | `demobrandManifest` |
| [`src/manifests/fidu.ts`](../src/manifests/fidu.ts) | 69 | `fiduManifest` |
| [`src/manifests/tempoflow.ts`](../src/manifests/tempoflow.ts) | 67 | `tempoflowManifest` |
| [`src/nsis-guid.ts`](../src/nsis-guid.ts) | 53 | `ELECTRON_BUILDER_NS_OID`, `uuidV5`, `nsisGuidFromAppId` |
| [`src/types.ts`](../src/types.ts) | 223 | `AppKind`, `ExeIdentity`, `BrandFeatures`, `AppManifest`, `isFeatureEnabled`, `BrandPublishInfra`, `exeForKind`, `envKey` |

---

## Détail par fichier

### `src/build-builder-config.ts`

- **Lignes** : 286
- **Exports** : `CREEZIO_ASAR_RUNTIME_PACKAGES`, `DEFAULT_HOST_ONLY_ELECTRON_MODULES`, `BuildBuilderConfigOptions`, `buildElectronBuilderConfig`

Générateur de config electron-builder Client / Serveur à partir d'un AppManifest.
Port brand-agnostic de `crm/scripts/electron/build-builder-config.mjs` (TF2 0.10.26).
L'appelant fournit la config de base (YAML/JSON parsé) et reçoit les overrides.
Usage typique dans une app marque :
```ts
import { buildElectronBuilderConfig, tempoflowManifest } from "@creezio/brand-config";
const cfg = buildElectronBuilderConfig(tempoflowManifest, "server", baseYaml);
```

### `src/create-manifest.ts`

- **Lignes** : 223
- **Exports** : `AppManifestSpec`, `defaultFeedToken`, `createAppManifest`, `validateAppManifest`

Fabrique un AppManifest Client+Serveur à partir d'un spec minimal.
Utilisé par `@creezio/factory` (Phase D) — jamais pour écraser
les manifests prod TempoFlow / Certivan / Fidu.

### `src/index.ts`

- **Lignes** : 84
- **Exports** : `manifests`, `BrandId`, `getManifest`, `listBrandIds`, `listProductionBrandIds`, `isSandboxBrand`, `appKindEnvKey`, `appSessionPartition`, `distDirForKind`, `envKey`, `exeForKind`, `feedBaseUrl`, `isFeatureEnabled`, `latestYmlUrl`, `profileArgPrefix`, `profileDirArgPrefix`, `resolveArtifactFileName`, `resolveLatestAlias`, `serverPlatformEnvKey`, `tempoflowManifest`, `certivanManifest`, `fiduManifest`, `demobrandManifest`, `CREEZIO_ASAR_RUNTIME_PACKAGES`, `DEFAULT_HOST_ONLY_ELECTRON_MODULES`, `buildElectronBuilderConfig`, `ELECTRON_BUILDER_NS_OID`, `nsisGuidFromAppId`, `uuidV5`, `createAppManifest`, `defaultFeedToken`, `validateAppManifest`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/manifests/certivan.ts`

- **Lignes** : 68
- **Exports** : `certivanManifest`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/manifests/demobrand.ts`

- **Lignes** : 15
- **Exports** : `demobrandManifest`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/manifests/fidu.ts`

- **Lignes** : 69
- **Exports** : `fiduManifest`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/manifests/tempoflow.ts`

- **Lignes** : 67
- **Exports** : `tempoflowManifest`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/nsis-guid.ts`

- **Lignes** : 53
- **Exports** : `ELECTRON_BUILDER_NS_OID`, `uuidV5`, `nsisGuidFromAppId`

GUID NSIS déterministe — même algorithme qu'electron-builder
(`UUID.v5(appId, NAMESPACE_OID)`).
NAMESPACE_OID = `6ba7b812-9dad-11d1-80b4-00c04fd430c8`
(vérifié contre les GUID Fidu kit).

### `src/types.ts`

- **Lignes** : 223
- **Exports** : `AppKind`, `ExeIdentity`, `BrandFeatures`, `AppManifest`, `isFeatureEnabled`, `BrandPublishInfra`, `exeForKind`, `envKey`, `appSessionPartition`, `profileArgPrefix`, `profileDirArgPrefix`, `resolveArtifactFileName`, `resolveLatestAlias`, `feedBaseUrl`, `latestYmlUrl`, `appKindEnvKey`, `serverPlatformEnvKey`, `distDirForKind`

Schéma AppManifest — identité d'une marque desktop Creezio.
Le modèle standard est **toujours** multi-exe Client + Serveur
(deux appId, deux feeds, deux GUID NSIS, deux segments userData).
Ce n'est pas une option : brand-config l'exige pour chaque marque.

