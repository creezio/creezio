export type {
  AppKind,
  AppManifest,
  BrandPublishInfra,
  ExeIdentity,
} from "./types.js";
export {
  appKindEnvKey,
  appSessionPartition,
  distDirForKind,
  envKey,
  exeForKind,
  feedBaseUrl,
  latestYmlUrl,
  profileArgPrefix,
  profileDirArgPrefix,
  resolveArtifactFileName,
  resolveLatestAlias,
  serverPlatformEnvKey,
} from "./types.js";

export { tempoflowManifest } from "./manifests/tempoflow.js";
export { certivanManifest } from "./manifests/certivan.js";
export { fiduManifest } from "./manifests/fidu.js";
export { demobrandManifest } from "./manifests/demobrand.js";

export {
  DEFAULT_HOST_ONLY_ELECTRON_MODULES,
  buildElectronBuilderConfig,
} from "./build-builder-config.js";
export type { BuildBuilderConfigOptions } from "./build-builder-config.js";

export {
  ELECTRON_BUILDER_NS_OID,
  nsisGuidFromAppId,
  uuidV5,
} from "./nsis-guid.js";
export {
  createAppManifest,
  defaultFeedToken,
  validateAppManifest,
} from "./create-manifest.js";
export type { AppManifestSpec } from "./create-manifest.js";

import { tempoflowManifest } from "./manifests/tempoflow.js";
import { certivanManifest } from "./manifests/certivan.js";
import { fiduManifest } from "./manifests/fidu.js";
import { demobrandManifest } from "./manifests/demobrand.js";
import type { AppManifest } from "./types.js";

/** Registre des manifests connus (prod + sandboxes factory). */
export const manifests = {
  tempoflow: tempoflowManifest,
  certivan: certivanManifest,
  fidu: fiduManifest,
  demobrand: demobrandManifest,
} as const;

export type BrandId = keyof typeof manifests;

export function getManifest(brandId: BrandId): AppManifest {
  return manifests[brandId];
}

export function listBrandIds(opts?: { includeSandbox?: boolean }): BrandId[] {
  const ids = Object.keys(manifests) as BrandId[];
  if (opts?.includeSandbox === false) {
    return ids.filter((id) => !manifests[id].sandbox);
  }
  return ids;
}

/** Marques parc prod uniquement (feeds live). */
export function listProductionBrandIds(): BrandId[] {
  return listBrandIds({ includeSandbox: false });
}

export function isSandboxBrand(brandId: BrandId): boolean {
  return Boolean(manifests[brandId]?.sandbox);
}
