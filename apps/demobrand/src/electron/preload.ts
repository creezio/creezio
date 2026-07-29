/**
 * Preload — bridge générique @creezio/shell (pas d'API catalogue TF).
 */
import { contextBridge, ipcRenderer } from "electron";
import { createDesktopApi, exposeDesktopApi } from "@creezio/shell";
import { demobrandManifest as manifest } from "./app-manifest.js";

const api = createDesktopApi(ipcRenderer);
exposeDesktopApi(contextBridge, manifest.bridgeName, api);
