/**
 * @creezio/api-kernel — façade HTTP unique (Phase H1.1 / isolation H2).
 */

export type {
  ApiAuthorizePluginAccessFn,
  ApiHandlerContext,
  ApiKernelOptions,
  ApiMount,
  ApiMountHandler,
  ApiPluginAccessDecision,
  ApiRequest,
  ApiResponse,
  ApiSpace,
  MountedApiInfo,
} from "./types.js";

export type { DbAccessMode, ScopedDbAccess } from "./db-scope.js";
export {
  CrossLayerWriteDeniedError,
  createScopedDbAccess,
  mountLayerRef,
} from "./db-scope.js";

export type { ApiKernel } from "./kernel.js";
export {
  API_CORE_PREFIX,
  API_MODULES_PREFIX,
  API_PLUGINS_PREFIX,
  API_V1_PREFIX,
  createApiKernel,
} from "./kernel.js";
