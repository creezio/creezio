/**
 * Schéma local-config (userData/*-config.json) — aligné TF2 0.10.26.
 * Le chiffrement safeStorage est dans @creezio/electron-shell.
 */

import type {
  RecoveryEnvelope,
  RecoveryVerifier,
} from "./recovery-key.js";

export type StoredValue = { enc: string } | { plain: string };

export type LocalBindHost = "127.0.0.1" | "0.0.0.0";

export type ConnectionProfile = {
  mode: "local" | "remote";
  remoteUrl?: string | null;
  localBind?: LocalBindHost;
  chosen?: boolean;
};

export type TunnelServicePorts = {
  n8n: number | null;
  hermes: number | null;
};

export type TunnelPublicUrlsStored = {
  crm: string;
  n8n: string;
  hermes: string;
};

export type TunnelMetaStored = {
  slug: string;
  hostname: string;
  publicUrl: string;
  tunnelId: string;
  localPort: number;
  servicePorts?: TunnelServicePorts;
  publicUrls?: TunnelPublicUrlsStored;
  emailDomain?: string;
};

export type EmbedMode = "embedded" | "remote" | "off";

export type HermesEmbedConfig = {
  mode: EmbedMode;
  remoteApiUrl?: string;
  remoteWebuiUrl?: string;
  chosen?: boolean;
};

export type N8nEmbedConfig = {
  mode: EmbedMode;
  remoteUiUrl?: string;
  chosen?: boolean;
};

export type BackgroundSettings = {
  closeToTray: boolean;
  launchAtStartup: boolean;
};

export type RememberedServer = {
  id: string;
  url: string;
  label: string;
  lastUsedAt: string;
};

export type AiWorkspacePresentationSetting = "window" | "embedded";

/**
 * Version 1 du fichier — champs optionnels selon wizard / features.
 * Extensions métier (Paperclip Fidu, fleet vertical…) hors kit ou injectées.
 */
export type LocalConfigFileV1 = {
  version: 1;
  setupComplete?: boolean;
  authUser?: StoredValue;
  authPassword?: StoredValue;
  authSecret?: StoredValue;
  mcpJwtSecret?: StoredValue;
  openaiApiKey?: StoredValue;
  anthropicApiKey?: StoredValue;
  googleTokens?: StoredValue;
  tunnelMeta?: TunnelMetaStored;
  tunnelToken?: StoredValue;
  emailInboundSecret?: StoredValue;
  skipAutoLogin?: boolean;
  stayLoggedIn?: boolean;
  recoveryVerifier?: RecoveryVerifier;
  recoveryEnvelope?: RecoveryEnvelope;
  connectionProfile?: ConnectionProfile;
  hermesEmbed?: HermesEmbedConfig;
  n8nEmbed?: N8nEmbedConfig;
  /** @deprecated alias schéma court Phase A — migrer vers hermesEmbed */
  hermes?: HermesEmbedConfig;
  /** @deprecated alias schéma court Phase A — migrer vers n8nEmbed */
  n8n?: N8nEmbedConfig;
  embedEnv?: {
    n8n?: Record<string, string>;
    hermes?: Record<string, string>;
  };
  background?: {
    closeToTray?: boolean;
    launchAtStartup?: boolean;
  };
  /** Alias plats Phase A/B tray */
  closeToTray?: boolean;
  launchAtStartup?: boolean;
  profiles?: {
    servers?: RememberedServer[];
  };
  aiWorkspacePresentation?: AiWorkspacePresentationSetting;
};

export const LOCAL_CONFIG_VERSION = 1 as const;

export function isLocalConfigV1(raw: unknown): raw is LocalConfigFileV1 {
  if (!raw || typeof raw !== "object") return false;
  return (raw as LocalConfigFileV1).version === 1;
}

export function emptyLocalConfig(): LocalConfigFileV1 {
  return { version: LOCAL_CONFIG_VERSION };
}

export type TunnelConfigPublic = {
  configured: boolean;
  slug: string | null;
  hostname: string | null;
  publicUrl: string | null;
  publicUrls?: TunnelPublicUrlsStored | null;
};
