/**
 * Paths marque — généré par factory (twin générique).
 * Ne contient aucun domaine métier.
 */
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";

const ENV_PREFIX = "TEMPOFLOW3";

export function userDataDir(): string {
  return app.getPath("userData");
}

export function isPackaged(): boolean {
  return app.isPackaged;
}

export function resourcesRoot(): string {
  return isPackaged()
    ? process.resourcesPath
    : path.resolve(__dirname, "../../resources");
}

export function dbPath(): string {
  return path.join(userDataDir(), "tempoflow3.sqlite");
}

export function assistantDbPath(): string {
  return path.join(userDataDir(), "assistant.sqlite");
}

export function uploadsDir(): string {
  const dir = path.join(userDataDir(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function meiliDataDir(): string {
  return path.join(userDataDir(), "meili");
}

export function nextServerEntry(): string {
  return path.join(
    isPackaged() ? process.resourcesPath : path.resolve(__dirname, "../.."),
    "server.js",
  );
}

export function nodeBinary(): string {
  return process.execPath;
}

export function nodeScript(rel: string): string {
  return path.join(path.resolve(__dirname, "../.."), rel);
}

export function nodeModulesPathForScripts(): string | null {
  const p = path.resolve(__dirname, "../../node_modules");
  return fs.existsSync(p) ? p : null;
}

export function preloadPath(name: string): string {
  return path.join(__dirname, name);
}

export function portEnvKey(): string {
  return `${ENV_PREFIX}_PORT`;
}

export const brandPaths = {
  userDataDir,
  isPackaged,
  resourcesRoot,
  dbPath,
  assistantDbPath,
  uploadsDir,
  meiliDataDir,
  meiliBinary: () => path.join(resourcesRoot(), "meili"),
  nextServerEntry,
  nodeBinary,
  nodeScript,
  nodeModulesPathForScripts,
  preloadPath,
  portEnvKey,
};
