/**
 * Paths marque — généré par factory (twin générique).
 * Ne contient aucun domaine métier.
 */
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
const ENV_PREFIX = "TEMPOFLOW3";
export function userDataDir() {
    return app.getPath("userData");
}
export function isPackaged() {
    return app.isPackaged;
}
export function resourcesRoot() {
    return isPackaged()
        ? process.resourcesPath
        : path.resolve(__dirname, "../../resources");
}
export function dbPath() {
    return path.join(userDataDir(), "tempoflow3.sqlite");
}
export function assistantDbPath() {
    return path.join(userDataDir(), "assistant.sqlite");
}
export function uploadsDir() {
    const dir = path.join(userDataDir(), "uploads");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}
export function meiliDataDir() {
    return path.join(userDataDir(), "meili");
}
export function nextServerEntry() {
    return path.join(isPackaged() ? process.resourcesPath : path.resolve(__dirname, "../.."), "server.js");
}
export function nodeBinary() {
    return process.execPath;
}
export function nodeScript(rel) {
    return path.join(path.resolve(__dirname, "../.."), rel);
}
export function nodeModulesPathForScripts() {
    const p = path.resolve(__dirname, "../../node_modules");
    return fs.existsSync(p) ? p : null;
}
export function preloadPath(name) {
    return path.join(__dirname, name);
}
export function portEnvKey() {
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
//# sourceMappingURL=paths.js.map