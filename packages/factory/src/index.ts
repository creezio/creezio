export type { NewAppOptions, ScaffoldResult } from "./scaffold.js";
export { scaffoldNewApp, renderManifestTs } from "./scaffold.js";
export { runCli, parseArgs } from "./cli.js";
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
  safeBrandId,
  assertProductModel,
  chrCatalogEntities,
  chrCatalogPages,
  chrOrderFlow,
  defaultPlatformNeeds,
  isChrModel,
} from "./product-model.js";
export { writeFromPrdArtifacts } from "./scaffold-from-prd.js";
