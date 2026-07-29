export type { PathsContext } from "./paths.js";
export {
  feedUrlForKind,
  resolveAssistantDbPath,
  resolveDbPath,
  resolveHermesHomeDir,
  resolveLocalConfigPath,
  resolveMeiliDataDir,
  resolveN8nHomeDir,
  resolveUploadsDir,
  resolveUserDataDir,
  userDataDirForKind,
} from "./paths.js";

export type {
  ConnectionProfile,
  EmbedMode,
  HermesEmbedConfig,
  LocalBindHost,
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
