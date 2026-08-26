export type { NewAppOptions, ScaffoldResult } from "./scaffold.js";
export { scaffoldNewApp, renderManifestTs } from "./scaffold.js";
export { runCli, parseArgs } from "./cli.js";
export { runBrandCli, parseBrandArgs } from "./brand-cli.js";
export type {
  ProductModel,
  ProductEntity,
  ProductPage,
  ProductFlow,
  ProductField,
  PlatformNeeds,
  FieldType,
} from "./product-model.js";
export {
  parseProductPrd,
  isProductSpecStub,
  safeBrandId,
  assertProductModel,
  corePurchaseEntities,
  corePurchasePages,
  coreOrderFlow,
  chrCatalogEntities,
  chrCatalogPages,
  chrOrderFlow,
  defaultPlatformNeeds,
  isChrModel,
} from "./product-model.js";
export { writeFromPrdArtifacts } from "./scaffold-from-prd.js";
export {
  scaffoldAdminRepo,
  type AdminRepoOptions,
  type AdminRepoResult,
} from "./admin-repo.js";
export {
  resolveGithubToken,
  createPrivateRepo,
  deleteRepo,
  pushInitialCommit,
  createBrandGithubRepos,
  maybePushBrandRepos,
  type GithubRepoSpec,
  type CreateRepoResult,
} from "./github-repos.js";
export {
  isPackageLockInSync,
  ensureBrandPackageLocks,
  type PkgJson,
} from "./package-lock.js";
export { prepareBrandDistribution } from "./prepare-brand-distribution.js";
export {
  loadServerRegistry,
  saveServerRegistry,
  allocateServerPort,
  buildDockerRunArgs,
  serverImageName,
  serverContainerName,
  validInstanceName,
  registryPath,
  type ServerRegistry,
  type ServerRegistryInstance,
} from "./server-docker-registry.js";
export {
  CREATE_CF_ENV_KEYS,
  CREATE_TUNNEL_ENV_KEYS,
  RESERVED_SLUGS_FALLBACK,
  deriveCreateTunnelSlug,
  formatMissingProvisionerError,
  isExplicitTunnelLocal,
  loadReservedSlugs,
  resolveCreateTunnelPolicy,
  resolveMigrateStackPlan,
  type CreateTunnelPolicy,
  type CreateTunnelPolicyInput,
} from "./server-docker-tunnel.js";
export {
  CREATE_OWNER_ENV_KEYS,
  E2E_OWNER_ENV_KEYS,
  applyFirstRunOwner,
  defaultE2eEmail,
  formatMissingOwnerError,
  formatOwnerLoginLog,
  generateOwnerPassword,
  resolveCreateOwnerPolicy,
  resolveEnsureOwnerCreds,
  type CreateOwnerPolicy,
  type CreateOwnerPolicyInput,
} from "./server-docker-owner.js";
export {
  writeAppFile,
  isOwnedByBrand,
  OWNED_BY_BRAND_MARKER,
} from "./write-app-file.js";
export {
  kitPluginTemplatesDir,
  listKitPluginTemplates,
  installKitPluginTemplate,
  type InstallKitPluginTemplateResult,
} from "./plugin-templates.js";
