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
  createFleetAccessMount,
  fleetStateFilePath,
  readFleetState,
  startFleetHeartbeat,
  type FleetAccessMountOptions,
  type FleetHeartbeatHandle,
  type FleetHeartbeatState,
  type StartFleetHeartbeatConfig,
} from "./fleet-heartbeat.js";
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
  createPluginToolsDiscovery,
  type CreatePluginToolsDiscoveryOptions,
  type PluginToolsHostLike,
} from "./plugin-tools-discovery.js";
export {
  createPluginProxyMount,
} from "./plugin-proxy-mount.js";
export {
  seedPluginsFromDirs,
  type SeedPluginsResult,
} from "./plugin-seed.js";
export {
  createPluginAclMcpWiring,
  type PluginAclMcpWiring,
} from "./plugin-acl-wiring.js";
export {
  listenBrandOsHttp,
  resolveBrandOsHttpHost,
  type BrandOsHttpHandle,
} from "./listen-brand-os-http.js";
export {
  CATALOG_INTERNAL_HEADER,
  PUBLIC_MODULE_PATHS,
  anyModuleMachineKeyVerifier,
  assertModuleMountSession,
  createBrandApiKeyModuleVerifier,
  createPluginDiskKeyModuleVerifier,
  isCatalogInternalBootPath,
  isModuleApiPath,
  isPublicModulePath,
  sessionFromNodeHeaders,
  type ModuleMachineKeyVerifier,
  type ModuleMountAuthDecision,
  type ModuleMountBrandDb,
  type PublicModulePathRule,
} from "./module-mount-auth.js";
export {
  startBrandUiPlane,
  hasBrandUiPlane,
  type BrandUiPlaneHandle,
} from "./start-brand-ui-plane.js";
export {
  createBootProgressReporter,
  type BootProgressReporter,
  type BootStepId,
} from "./boot-progress.js";
export {
  listenBrandBootHttp,
  type BrandBootHttpHandle,
} from "./listen-brand-boot-http.js";
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
  adminDatabaseHandlesPath,
  createBrandAdminDatabaseRoutes,
  registerRuntimeDatabaseStores,
} from "./mount-brand-admin-database.js";
export {
  mountBrandEmailSurface,
  emailSurfaceHandlesPath,
  type BrandEmailSurface,
} from "./mount-brand-email-surface.js";
export {
  mountBrandPlatformSurface,
  platformSurfaceHandlesPath,
  createPlatformTasksBrandAdapters,
  getBrandPlatformRuntime,
  type BrandPlatformSurface,
  type BrandPlatformRuntime,
  type DesktopPresenceRegistry,
} from "./mount-brand-platform-surface.js";
export {
  openBrandPlatformStore,
  PLATFORM_KANBAN_CORE_SQL,
  PLATFORM_USERS_CORE_SQL,
  type BrandPlatformStore,
} from "./brand-platform-store.js";
export {
  startBrandBrowserSidecar,
  browserSidecarRequested,
  SERVER_BROWSER_HOST_ID,
  type BrandBrowserSidecarHandle,
} from "./wire-brand-browser-sidecar.js";
export {
  createApiKeyBearerActorResolver,
  registerHermesHostMcpTools,
  type ApiKeyRow,
  type CreateApiKeyBearerActorResolverOptions,
  type RegisterHermesHostMcpToolsOptions,
} from "./hermes-mcp-host-tools.js";
export {
  handleMcpJsonRpcRequest,
  isJsonRpcBody,
  type McpJsonRpcResponse,
} from "./mcp-jsonrpc.js";
export {
  applyBrandCatalogEnvDefaults,
  applyStoredEmailEnv,
  applyStoredLlmEnv,
  harnessTunnelProvisionRequested,
  runHarnessCatalogImportPhase,
  runHarnessFleetPhase,
  runHarnessHermesBridgePhase,
  runHarnessPluginsPhase,
  runHarnessTunnelPhase,
  type HarnessTunnelPhaseResult,
} from "./harness-server-phases.js";
