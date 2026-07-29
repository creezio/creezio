/**
 * Utilitaires de chemins génériques — paramétrés par AppManifest.
 *
 * Pas d'import Electron ici (testable depuis Node). L'appelant fournit
 * `userDataRoot` (ex. `app.getPath("userData")`) et `isPackaged`.
 *
 * Source d'abstraction : electron/paths.ts (TF2 0.10.26 / Certivan / Fidu).
 */

import path from "node:path";
import type { AppManifest } from "@creezio/brand-config";
import { envKey } from "@creezio/brand-config";

export type PathsContext = {
  manifest: AppManifest;
  /** Racine userData déjà résolue (Electron ou override). */
  userDataRoot: string;
  /** true = build packagé → ignore les overrides d'env. */
  isPackaged: boolean;
  /** process.env (injectable pour tests). */
  env?: NodeJS.ProcessEnv;
};

function readEnvOverride(ctx: PathsContext, suffix: string): string {
  if (ctx.isPackaged) return "";
  const env = ctx.env ?? process.env;
  return (env[envKey(ctx.manifest, suffix)] || "").trim();
}

/** Racine userData effective (honore `{PREFIX}_USER_DATA_OVERRIDE` hors packagé). */
export function resolveUserDataDir(ctx: PathsContext): string {
  const override = readEnvOverride(ctx, "USER_DATA_OVERRIDE");
  return override || ctx.userDataRoot;
}

/** Chemin SQLite principal. */
export function resolveDbPath(ctx: PathsContext): string {
  const override = readEnvOverride(ctx, "DB_PATH_OVERRIDE");
  if (override) return override;
  return path.join(resolveUserDataDir(ctx), ctx.manifest.dbFileName);
}

/** Config locale JSON. */
export function resolveLocalConfigPath(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), ctx.manifest.localConfigFileName);
}

/** Base conversations assistant (nom commun aux 3 marques). */
export function resolveAssistantDbPath(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), "assistant_chats.db");
}

export function resolveUploadsDir(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), "uploads", "img");
}

export function resolveMeiliDataDir(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), "meili");
}

export function resolveHermesHomeDir(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), "hermes-home");
}

export function resolveN8nHomeDir(ctx: PathsContext): string {
  return path.join(resolveUserDataDir(ctx), "n8n-home");
}

/**
 * Calcule le userData cible pour un kind packagé (client/server).
 * Pure — l'appelant crée le dossier et appelle `app.setPath`.
 */
export function userDataDirForKind(
  manifest: AppManifest,
  kind: "client" | "server",
  currentUserData: string,
): string {
  const parent = path.dirname(currentUserData);
  const segment =
    kind === "server"
      ? manifest.server.userDataSegment
      : manifest.client.userDataSegment;
  return path.join(parent, segment);
}

/** Feed auto-update pour un kind. */
export function feedUrlForKind(
  manifest: AppManifest,
  kind: "client" | "server",
): string {
  return kind === "server" ? manifest.server.feedUrl : manifest.client.feedUrl;
}
