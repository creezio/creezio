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

export {
  DEFAULT_HOST_ONLY_ELECTRON_MODULES,
  buildElectronBuilderConfig,
} from "./build-builder-config.js";
export type { BuildBuilderConfigOptions } from "./build-builder-config.js";

import { tempoflowManifest } from "./manifests/tempoflow.js";
import { certivanManifest } from "./manifests/certivan.js";
import { fiduManifest } from "./manifests/fidu.js";
import type { AppManifest } from "./types.js";

/** Registre des manifests connus. */
export const manifests = {
  tempoflow: tempoflowManifest,
  certivan: certivanManifest,
  fidu: fiduManifest,
} as const;

export type BrandId = keyof typeof manifests;

export function getManifest(brandId: BrandId): AppManifest {
  return manifests[brandId];
}

export function listBrandIds(): BrandId[] {
  return Object.keys(manifests) as BrandId[];
}
