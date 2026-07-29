/**
 * Contexte runtime hôte injecté dans tous les launchers B.2.
 * Remplace les singletons TF2 (userDataDir(), paths.ts, logger).
 */

import type { AppManifest } from "@creezio/brand-config";
import { displayNameFor, type RuntimeAppKind } from "@creezio/platform-core";

export type HostLogFn = (scope: string, line: string) => void;

export type TunnelProvisionConfig = {
  /** Base URL provisioner (sans slash final). */
  baseUrl: string;
  /** Bearer token. */
  token: string;
  /** Domaine mail catch-all : `{slug}.mail.{mailRootDomain}`. */
  mailRootDomain?: string;
};

export type HostRuntimeContext = {
  manifest: AppManifest;
  userDataDir: string;
  resourcesRoot: string;
  isPackaged: boolean;
  appKind?: RuntimeAppKind;
  log?: HostLogFn;
  /** Provisioner tunnel (marque). */
  tunnelProvision?: TunnelProvisionConfig;
  /** Install ID pour reserve tunnel. */
  getInstallId?: () => string;
  /**
   * Seed skills Hermes vertical (marque) — optionnel.
   * Appelé après création HERMES_HOME.
   */
  seedHermesSkills?: (hermesHome: string) => void | Promise<void>;
  /**
   * Bridge CRM key pour Hermes (insertion DB verticale).
   * Si absent, le launcher n'injecte que n8n bridge.
   */
  getHermesBridgeEnv?: (opts?: {
    crmPort?: number | null;
  }) => Record<string, string>;
  /** Env bridge plugins control plane. */
  getPluginControlBridgeEnv?: () => Record<string, string>;
  /** Binaire git emballé (MinGit) pour PATH confiné Hermes/outils. */
  getGitBinary?: () => string | null;
  /**
   * Après owner n8n silencieux — provision clé API Product Hub / Hermes.
   * Vertical (n8n-api-key) reste hors kit.
   */
  onN8nReady?: (opts: {
    uiUrl: string;
    homeDir: string;
    email: string;
    password: string;
    log: (line: string) => void;
  }) => void | Promise<void>;
  /** Extra env Next pour n8n (N8N_API_KEY bridge, etc.). */
  getN8nNextEnvExtra?: (opts: {
    connectionMode: "local" | "remote";
    homeDir: string;
    localUiUrl: string | null;
  }) => Record<string, string>;
  /** Segment userData npm (`tempoflow-npm` / `desktop-npm`). */
  npmUserDataSegment?: string;
  /** Prefixe fichiers secrets n8n/hermes (dual-read legacy `.tempoflow-*`). */
  secretFilePrefix?: string;
};

export function hostProductName(ctx: HostRuntimeContext): string {
  const kind = ctx.appKind === "server" ? "server" : "client";
  return displayNameFor(ctx.manifest, kind);
}

export function hostLog(
  ctx: HostRuntimeContext,
  scope: string,
  line: string,
): void {
  if (ctx.log) ctx.log(scope, line);
  else console.log(`[${scope}] ${line}`);
}
