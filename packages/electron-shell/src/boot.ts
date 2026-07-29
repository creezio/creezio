/**
 * Façade boot Electron plateforme — structure générique (pas le métier).
 *
 * Les apps marques appellent `prepareDesktopBoot(manifest)` **avant**
 * `app.requestSingleInstanceLock()` pour isoler userData Client/Serveur.
 *
 * Le monolithe main.ts (catalogue, tabs fournisseurs, Hermes…) reste vertical.
 */

import fs from "node:fs";
import path from "node:path";
import type { AppManifest } from "@creezio/brand-config";
import { appSessionPartition, envKey } from "@creezio/brand-config";
import {
  APP_KIND_FILENAME,
  appKindEnvValue,
  appUserModelIdFor,
  bootBehaviorFor,
  displayNameFor,
  parseProfileArgv,
  readAppKindFile,
  resolveAppKind,
  userDataDirForAppKind,
  type BootBehavior,
  type ProfileLaunch,
  type RuntimeAppKind,
} from "@creezio/platform-core";

export type DesktopBootContext = {
  manifest: AppManifest;
  appKind: RuntimeAppKind;
  bootBehavior: BootBehavior;
  profileLaunch: ProfileLaunch;
  sessionPartition: string;
  /** userData effectif après éventuel setPath. */
  userDataDir: string;
};

export type PrepareDesktopBootOptions = {
  /** Dossiers candidats pour app-kind.json (à côté du main compilé). */
  appKindDirs?: string[];
  argv?: string[];
  env?: NodeJS.ProcessEnv;
};

/**
 * Résout kind + profil + comportement de boot, applique userData / AppUserModelId.
 * À appeler tôt dans main (après import electron, avant single-instance lock).
 */
export async function prepareDesktopBoot(
  manifest: AppManifest,
  options: PrepareDesktopBootOptions = {},
): Promise<DesktopBootContext> {
  const { app } = await import("electron");
  const env = options.env ?? process.env;
  const argv = options.argv ?? process.argv;

  const fileKind = readAppKindFile(
    options.appKindDirs ?? [
      path.dirname(process.execPath),
      path.join(process.resourcesPath || "", "app"),
      path.join(process.resourcesPath || "", "build", "electron"),
    ],
  );
  const appKind = resolveAppKind({
    env: appKindEnvValue(manifest, env) || env[envKey(manifest, "APP_KIND")],
    fileKind,
  });

  const profileLaunch = parseProfileArgv(argv, manifest);
  const bootBehavior = bootBehaviorFor(appKind, profileLaunch);

  let userData = app.getPath("userData");
  if (appKind === "server" || appKind === "client") {
    const target = userDataDirForAppKind(manifest, appKind, userData);
    if (target && path.resolve(target) !== path.resolve(userData)) {
      fs.mkdirSync(target, { recursive: true });
      app.setPath("userData", target);
      userData = target;
    }
    app.setName(displayNameFor(manifest, appKind));
    try {
      app.setAppUserModelId(appUserModelIdFor(manifest, appKind));
    } catch {
      /* non-Windows */
    }
  }

  return {
    manifest,
    appKind,
    bootBehavior,
    profileLaunch,
    sessionPartition: appSessionPartition(manifest),
    userDataDir: userData,
  };
}

/** Écrit `app-kind.json` à côté du main packagé (outil build). */
export function writeAppKindFile(
  outDir: string,
  kind: "server" | "client",
): string {
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, APP_KIND_FILENAME);
  fs.writeFileSync(out, JSON.stringify({ kind }, null, 2) + "\n", "utf8");
  return out;
}
