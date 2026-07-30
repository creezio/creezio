/**
 * Chemin absolu du preload onglet kit (O1 — plus de façade marque).
 * Consommé en CJS Electron (`dist-cjs`) — `__dirname` = dossier émis.
 */
import path from "node:path";

declare const __dirname: string;

export function browserTabPreloadPath(): string {
  return path.join(__dirname, "browser-tab-preload.js");
}
