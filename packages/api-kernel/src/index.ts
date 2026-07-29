/**
 * @creezio/api-kernel — façade HTTP unique (Phase H1.1).
 */

export type {
  ApiHandlerContext,
  ApiKernelOptions,
  ApiMount,
  ApiMountHandler,
  ApiRequest,
  ApiResponse,
  ApiSpace,
  MountedApiInfo,
} from "./types.js";

export type { ApiKernel } from "./kernel.js";
export {
  API_CORE_PREFIX,
  API_MODULES_PREFIX,
  API_PLUGINS_PREFIX,
  API_V1_PREFIX,
  createApiKernel,
} from "./kernel.js";
