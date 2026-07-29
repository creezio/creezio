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
  AiWorkspacePresentationSetting,
  BackgroundSettings,
  ConnectionProfile,
  EmbedMode,
  HermesEmbedConfig,
  LocalBindHost as LocalBindHostSchema,
  LocalConfigFileV1,
  N8nEmbedConfig,
  RememberedServer,
  StoredValue,
  TunnelConfigPublic,
  TunnelMetaStored,
  TunnelPublicUrlsStored,
  TunnelServicePorts,
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

/* ── Phase B.2 : embeds purs ── */
export type {
  EmbedHostGate,
  EmbedToolMode,
} from "./embeds/embed-stack-hooks.js";
export {
  EMBED_IPC,
  EMBED_TOOL_SITE_IDS,
  PLUGIN_SITE_ID_RANGE,
  normalizeEmbedHttpOrigin,
  shouldSpawnHostOnlyEmbed,
} from "./embeds/embed-stack-hooks.js";

export type {
  EmbedEnvPanel,
  EmbedEnvPanelVar,
  EmbedEnvService,
  EmbedEnvVarDef,
} from "./embeds/embed-env-catalog.js";
export {
  HERMES_ENV_CATALOG,
  HERMES_LOCKED_KEYS,
  N8N_ENV_CATALOG,
  N8N_LOCKED_KEYS,
  OS_SANDBOX_LOCKED_KEYS,
  buildEmbedEnvPanel,
  catalogFor,
  isEmbedEnvService,
  lockedKeySet,
  mergeEmbedUserEnv,
  sanitizeUserEnvOverlay,
} from "./embeds/embed-env-catalog.js";

export type {
  HermesEmbedConfig as HermesEmbedConfigPure,
  HermesEmbedMode,
  HermesRuntimeStatus,
  HermesWebuiStatus,
} from "./embeds/hermes-embed.js";
export {
  HERMES_DEFAULT_API_PORT,
  HERMES_DEFAULT_WEBUI_PORT,
  HERMES_DESKTOP_API_PORT,
  HERMES_DESKTOP_WEBUI_PORT,
  HERMES_EXE_BUNDLE_CEILING_MB,
  buildHermesHomeEnvFile,
  buildNextHermesEnv,
  hermesBinEnvKey,
  hermesBinaryCandidates,
  hermesPublicStatus,
  normalizeHttpOrigin,
  resolveHermesBinary,
  sanitizeHermesEmbedConfig,
  shouldSpawnEmbeddedHermes,
} from "./embeds/hermes-embed.js";

export type {
  N8nEmbedConfig as N8nEmbedConfigPure,
  N8nEmbedMode,
  N8nRuntimeStatus,
} from "./embeds/n8n-embed.js";
export {
  N8N_AUDIT,
  N8N_DEFAULT_PORT,
  N8N_DESKTOP_PORT,
  N8N_EXE_BUNDLE_CEILING_MB,
  buildN8nSpawnEnv,
  buildNextN8nEnv,
  describeN8nSpawnKind,
  isNodeSpawnableN8nEntry,
  n8nBinEnvKey,
  n8nEntryCandidates,
  n8nHomeLooksWarm,
  n8nPublicStatus,
  normalizeN8nPublicBaseUrl,
  resolveN8nEntry,
  sanitizeN8nEmbedConfig,
  shouldSpawnEmbeddedN8n,
} from "./embeds/n8n-embed.js";

export type {
  RecoveryEnvelope,
  RecoveryVerifier,
  RecoveryWrappedSecrets,
} from "./recovery-key.js";
export {
  createRecoveryVerifier,
  generateRecoveryKey,
  normalizeRecoveryKey,
  unwrapSecretsWithRecoveryKey,
  verifyRecoveryKey,
  wrapSecretsWithRecoveryKey,
} from "./recovery-key.js";

export {
  N8N_INSTALL_MIN_FREE_BYTES,
  WINDOWS_NPM_ENOSPC_EXIT,
  cleanupN8nInstallArtifacts,
  diskSpacePreflightMessage,
  formatBytesFr,
  formatN8nDiskSpaceError,
  getFreeDiskBytes,
  isDiskSpaceError,
} from "./disk-space.js";

/* ── Phase B.2 : plugins (contrats purs) ── */
export type {
  PluginRuntimeEntry,
  PluginRuntimeState,
} from "./plugins/plugin-events.js";
export {
  PLUGIN_RUNTIME_FILE,
  PLUGIN_SITE_ID_BASE,
  PLUGIN_SITE_ID_SPAN,
  pluginAcceptsHook,
  pluginHookUrl,
  pluginN8nWebhookUrl,
  pluginRuntimePath,
  pluginSiteId,
  readPluginRuntimeState,
  writePluginRuntimeState,
} from "./plugins/plugin-events.js";

export type {
  PluginExecutionGrantPayload,
  PluginGrantAction,
} from "./plugins/plugin-execution-grant.js";
export {
  issuePluginExecutionGrant,
  verifyPluginExecutionGrant,
} from "./plugins/plugin-execution-grant.js";

export type {
  DiscoveredPlugin,
  PluginAcceptance,
  PluginAcceptanceSmoke,
  PluginManifest,
  PluginPanelConfig,
  PluginPermission,
} from "./plugins/plugin-manifest.js";
export {
  PLUGIN_MANIFEST_FILE,
  discoverPlugins,
  hasPluginPermission,
  isValidPluginId,
  parsePluginManifest,
  pluginEnabledFlagPath,
  pluginsRootDir,
  setPluginEnabled,
} from "./plugins/plugin-manifest.js";
