/**
 * Contrats des launchers hôte (Hermes / n8n / tunnel) — Phase B.
 *
 * Les implémentations complètes (1000+ lignes, runtime bootstrap, pins npm)
 * restent dans les apps verticales jusqu'à Phase B.2. Le kit expose les
 * interfaces + helpers env pour éviter TEMPOFLOW_* hardcodé.
 */

import type { AppManifest } from "@creezio/brand-config";
import { envKey } from "@creezio/brand-config";
import { brandEnv } from "@creezio/platform-core";
import type { ChildProcess } from "node:child_process";

export type HostProcessHandle = {
  child: ChildProcess;
  stop: () => void;
};

export type HermesLaunchRequest = {
  manifest: AppManifest;
  hermesHome: string;
  crmBaseUrl: string;
  log?: (line: string) => void;
};

export type N8nLaunchRequest = {
  manifest: AppManifest;
  n8nHome: string;
  crmBaseUrl: string;
  log?: (line: string) => void;
};

export type TunnelLaunchRequest = {
  manifest: AppManifest;
  tunnelHome: string;
  localPort: number;
  slug?: string;
  log?: (line: string) => void;
};

/** Env générique pour un embed hôte (préfixe marque). */
export function buildEmbedHostEnv(
  manifest: AppManifest,
  extras: Record<string, string | undefined> = {},
): Record<string, string> {
  return {
    ...brandEnv(manifest, {
      DESKTOP: "1",
      BRAND_ID: manifest.brandId,
      ...extras,
    }),
  };
}

/** Clé override binaire cloudflared hors packagé. */
export function cloudflaredEnvKey(manifest: AppManifest): string {
  return envKey(manifest, "CLOUDFLARED_BINARY");
}

/**
 * Modules host-only exclus du paquet Client — réexport pour tooling.
 * @see @creezio/brand-config DEFAULT_HOST_ONLY_ELECTRON_MODULES
 */
export { DEFAULT_HOST_ONLY_ELECTRON_MODULES } from "@creezio/brand-config";
