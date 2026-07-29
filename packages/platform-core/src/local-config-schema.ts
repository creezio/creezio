/**
 * Schéma minimal partagé de la config locale (userData/*-config.json).
 *
 * Les champs secrets restent opaque (`StoredValue`) — le chiffrement
 * safeStorage reste dans le runtime Electron (Phase B).
 *
 * Aligné sur les local-config.ts TF2 / Certivan / Fidu (noyau commun).
 */

export type StoredValue = { enc: string } | { plain: string };

export type LocalBindHost = "127.0.0.1" | "0.0.0.0";

export type ConnectionProfile = {
  mode: "local" | "remote";
  remoteUrl: string | null;
  localBind: LocalBindHost;
  chosen: boolean;
};

export type TunnelMetaStored = {
  slug: string;
  hostname: string;
  publicUrl: string;
  tunnelId: string;
  localPort: number;
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

/**
 * Version 1 du fichier — champs optionnels selon wizard / features.
 * Les extensions métier (Paperclip Fidu, etc.) restent hors kit.
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
  skipAutoLogin?: boolean;
  stayLoggedIn?: boolean;
  connectionProfile?: ConnectionProfile;
  hermes?: HermesEmbedConfig;
  n8n?: N8nEmbedConfig;
  closeToTray?: boolean;
  launchAtStartup?: boolean;
};

export const LOCAL_CONFIG_VERSION = 1 as const;

/** Stub : valide la forme minimale (version). */
export function isLocalConfigV1(raw: unknown): raw is LocalConfigFileV1 {
  if (!raw || typeof raw !== "object") return false;
  return (raw as LocalConfigFileV1).version === 1;
}

/** Config vide par défaut (premier lancement). */
export function emptyLocalConfig(): LocalConfigFileV1 {
  return { version: LOCAL_CONFIG_VERSION };
}
