export type { PathsContext } from "./paths.js";
export {
  feedUrlForKind,
  meiliBinaryCandidates,
  resolveAssistantDbPath,
  resolveDbPath,
  resolveHermesHomeDir,
  resolveLocalConfigPath,
  resolveLogsDir,
  resolveMainLogPath,
  resolveMeiliDataDir,
  resolveN8nHomeDir,
  resolveNodeRuntimeDir,
  resolvePreloadPath,
  resolveResourcesRoot,
  resolveTunnelHomeDir,
  resolveUploadsDir,
  resolveUserDataDir,
  userDataDirForKind,
} from "./paths.js";

export type {
  ConnectionProfile,
  EmbedMode,
  HermesEmbedConfig,
  LocalBindHost as LocalBindHostSchema,
  LocalConfigFileV1,
  N8nEmbedConfig,
  StoredValue,
  TunnelMetaStored,
} from "./local-config-schema.js";
export {
  LOCAL_CONFIG_VERSION,
  emptyLocalConfig,
  isLocalConfigV1,
} from "./local-config-schema.js";

export type {
  BootBehavior,
  PickerVariant,
  RuntimeAppKind,
} from "./app-kind.js";
export {
  APP_KIND_FILENAME,
  appKindEnvValue,
  appKindFilePayload,
  appUserModelIdFor,
  bootBehaviorFor,
  displayNameFor,
  isAllowedServerCockpitPath,
  parseAppKind,
  readAppKindFile,
  resolveAppKind,
  userDataDirForAppKind,
} from "./app-kind.js";

export type {
  ConnectionMode,
  ConnectionProfile as ConnectionProfileRuntime,
  ConnectionProfilePublic,
  LocalBindHost,
} from "./connection-profile.js";
export {
  assertProfileReady,
  defaultLocalProfile,
  normalizeLocalBind,
  normalizeRemoteUrl,
  resolveBootProfile,
  sanitizeConnectionProfile,
  testRemoteHealth,
  unsetConnectionProfile,
} from "./connection-profile.js";

export type { ProfileLaunch, ProfileMode } from "./profile-launch.js";
export {
  parseJoinDeepLink,
  parseProfileArgv,
  profileArgFor,
  profileDirSegment,
  profileUserDataDir,
  sanitizeProfileSegment,
} from "./profile-launch.js";

export type { TunnelEmbedService, TunnelPublicUrls } from "./tunnel-urls.js";
export {
  TUNNEL_EMBED_SERVICES,
  buildTunnelPublicUrls,
  deriveTunnelServiceUrl,
  portFromLocalUrl,
  tunnelServiceHostname,
} from "./tunnel-urls.js";

export {
  factoryResetPartitionPrefixes,
  factoryResetTargets,
} from "./factory-reset.js";

export type { BindHost } from "./ports.js";
export {
  findFreePort,
  httpGetStatus,
  waitForHealth,
  waitForMeiliHealth,
} from "./ports.js";

export type {
  UpdateEvent,
  UpdateState,
  UpdateStatus,
} from "./updater-state.js";
export {
  initialUpdateStatus,
  reduceUpdateEvent,
} from "./updater-state.js";

export {
  brandEnv,
  buildNextHostEnv,
  nodeBinaryEnvKey,
} from "./env-brand.js";
