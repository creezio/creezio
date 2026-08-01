/**
 * Preload — bridge desktop OS kit (setup / auth / connexion / apiBaseUrl).
 * Généré par creezio new-app --from-prd.
 */
import { contextBridge, ipcRenderer } from "electron";

const BRIDGE_NAME = "tempoflow3Desktop";

const api = {
  isDesktop: true as const,
  getInfo: () => ipcRenderer.invoke("desktop:info"),
  getConnectionProfile: () => ipcRenderer.invoke("connection:get"),
  chooseConnection: (profile: unknown) =>
    ipcRenderer.invoke("connection:choose", profile),
  getSetupStatus: () => ipcRenderer.invoke("setup:status"),
  completeSetup: (payload: unknown) =>
    ipcRenderer.invoke("setup:complete", payload),
  login: (payload: unknown) => ipcRenderer.invoke("auth:login", payload),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getSession: () => ipcRenderer.invoke("auth:session"),
};

contextBridge.exposeInMainWorld(BRIDGE_NAME, api);
contextBridge.exposeInMainWorld("creezioDesktop", api);
