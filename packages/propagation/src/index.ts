/**
 * @creezio/propagation — Phase F
 *
 * Semver / impacts / canaux PR / registre plugins org (L3) / extension points.
 * Aucune écriture dans les repos marques (fidu, certivan-app, tempoflow2).
 */

export type { CreezioPackageName, KitPackageMeta } from "./packages.js";
export {
  KIT_PACKAGES,
  KIT_PACKAGE_NAMES,
  assertKitPackage,
  directDependents,
  getKitPackage,
  transitiveDependents,
} from "./packages.js";

export type {
  BumpKind,
  ConventionalCommitType,
  ParsedConventionalCommit,
} from "./semver-policy.js";
export {
  SEMVER_POLICY_SUMMARY,
  applyBump,
  bumpKindFromCommit,
  bumpKindFromCommits,
  compareSemver,
  formatSemver,
  parseConventionalCommit,
  parseSemver,
} from "./semver-policy.js";

export type {
  BrandSurface,
  BrandSurfaceId,
  ImpactBrandId,
  ProductionBrandGate,
} from "./brand-surfaces.js";
export {
  BRAND_SURFACES,
  PACKAGE_SURFACE_MAP,
  PRODUCTION_BRAND_GATES,
  brandsImpactedBySurfaces,
  surfaceMeta,
} from "./brand-surfaces.js";

export type { PackageBumpImpact } from "./impact.js";
export { formatImpactReport, impactForPackageBump } from "./impact.js";

export type {
  BrandChannelConfig,
  BrandPrPayload,
  UpdateChannel,
  UpdateChannelId,
} from "./channels.js";
export {
  UPDATE_CHANNELS,
  brandPrChannelId,
  buildAllBrandPrPayloads,
  buildBrandPrPayload,
  configureBrandChannels,
  listUpdateChannels,
  resetBrandChannelsForTests,
} from "./channels.js";

export type {
  OrgPluginRecord,
  OrgPluginRegistry,
  OrgPluginRegistrySnapshot,
  OrgPluginVisibility,
  PropagationLevel,
} from "./org-plugin-registry.js";
export {
  createMemoryOrgPluginRegistry,
  snapshotOrgPluginRegistry,
} from "./org-plugin-registry.js";
export type { CreateFileOrgPluginRegistryOptions } from "./org-plugin-registry-file.js";
export { createFileOrgPluginRegistry } from "./org-plugin-registry-file.js";

export type {
  ExtensionHookBus,
  ExtensionHookHandler,
  ExtensionHookPayload,
  ExtensionPointDef,
  ExtensionPointId,
  PropagationDirection,
} from "./extension-points.js";
export {
  DOWNWARD_CHAIN,
  EXTENSION_POINTS,
  UPWARD_CHAIN,
  createExtensionHookBus,
  getExtensionPoint,
} from "./extension-points.js";

export type {
  ChangelogEntry,
  ChangelogSection,
} from "./release-notes.js";
export {
  entriesFromCommits,
  prependChangelog,
  renderChangelogMarkdown,
  sectionForCommit,
} from "./release-notes.js";

export type {
  KitInventory,
  KitPackageVersionRow,
  PublishedKitHint,
} from "./kit-inventory.js";
export {
  collectKitInventory,
  publishedHintsFromInventory,
} from "./kit-inventory.js";

/** Gates Phase G (docs prêtes, non exécutées en F). */
export const PHASE_G_GATES = [
  {
    id: "G1",
    brandId: "certivan",
    label: "Certivan",
    doc: "docs/archive/gates/G1-CERTIVAN.md",
    order: 1,
  },
  {
    id: "G2",
    brandId: "fidu",
    label: "Fidu",
    doc: "docs/archive/gates/G2-FIDU.md",
    order: 2,
  },
  {
    id: "G3",
    brandId: "tempoflow",
    label: "TempoFlow",
    doc: "docs/archive/gates/G3-TEMPOFLOW.md",
    order: 3,
  },
] as const;
