export type { AppKind, AppManifest, ExeIdentity } from "./types.js";
export { envKey, exeForKind } from "./types.js";

export { tempoflowManifest } from "./manifests/tempoflow.js";
export { certivanManifest } from "./manifests/certivan.js";
export { fiduManifest } from "./manifests/fidu.js";

import { tempoflowManifest } from "./manifests/tempoflow.js";
import { certivanManifest } from "./manifests/certivan.js";
import { fiduManifest } from "./manifests/fidu.js";
import type { AppManifest } from "./types.js";

/** Registre des manifests connus (Phase A). */
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
