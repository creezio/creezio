export type {
  BrandKernelHandle,
  BootBrandKernelFn,
  BrandCatalogHost,
  StartBrandDesktopConfig,
  BrandDesktopHandle,
  StartBrandKernelHarnessConfig,
  BrandKernelHarnessHandle,
} from "./types.js";

export { startBrandDesktop } from "./start-brand-desktop.js";
export { startBrandKernelHarness } from "./start-brand-kernel-harness.js";
export {
  createBrandKernel,
  brandKernelBooter,
  type CreateBrandKernelOptions,
  type BrandKernelBoot,
} from "./create-brand-kernel.js";
export {
  composeBrandOs,
  type ComposeBrandOsOptions,
  type BrandOsComposition,
  type BrandOsStatus,
} from "./compose-brand-os.js";
export {
  listenBrandOsHttp,
  resolveBrandOsHttpHost,
  type BrandOsHttpHandle,
} from "./listen-brand-os-http.js";
export {
  startBrandUiPlane,
  type BrandUiPlaneHandle,
} from "./start-brand-ui-plane.js";
export {
  installBrandOsDesktop,
  brandPreloadPath,
  type InstallBrandOsDesktopOptions,
} from "./install-brand-os-desktop.js";
export {
  warmBrandNativeHosts,
  type WarmNativeHostsResult,
} from "./warm-brand-native-hosts.js";
export {
  mountBrandMcpSurface,
  mcpSurfaceHandlesPath,
  type BrandMcpSurface,
} from "./mount-brand-mcp-surface.js";
export {
  mountBrandEmailSurface,
  emailSurfaceHandlesPath,
  type BrandEmailSurface,
} from "./mount-brand-email-surface.js";
