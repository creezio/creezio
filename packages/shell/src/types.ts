/**
 * Types communs preload / renderer — abstraction des window.*Desktop.
 *
 * Intersection des API TempoFlow / Certivan / Fidu (noyau partagé).
 * Les extensions verticales restent dans chaque app jusqu'à Phase B/G.
 */

export type DesktopTabInfo = {
  tabId: string;
  fournisseurId: number;
  url: string;
  title: string;
  active: boolean;
};

export type DesktopContentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DesktopSupplierTabOpened = {
  tabId: string;
  fournisseurId: number;
  url: string;
  title: string;
};

export type DesktopTabLoadState = {
  tabId: string;
  fournisseurId: number;
  state: "loading" | "ready" | "error";
  error?: string;
  url?: string;
};

export type DesktopAppKind = "server" | "client" | "legacy";

export type DesktopInfo = {
  version: string;
  serverPort: number;
  license?: string;
  platform?: string;
  customWindowChrome?: boolean;
  connectionMode?: "local" | "remote";
  baseUrl?: string | null;
  localBind?: "127.0.0.1" | "0.0.0.0";
  /** Présent dès le split 0.10 (TF2 / Certivan) ; optionnel sur Fidu aujourd'hui. */
  appKind?: DesktopAppKind;
};

export type DesktopConnectionProfile = {
  mode: "local" | "remote";
  remoteUrl: string | null;
  localBind: "127.0.0.1" | "0.0.0.0";
  chosen: boolean;
  activeBaseUrl: string | null;
  serverPort: number | null;
};

export type DesktopUpdateState =
  | "disabled"
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "ready"
  | "error";

export type DesktopUpdateStatus = {
  state: DesktopUpdateState | string;
  currentVersion: string;
  availableVersion?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
  updateAvailable: boolean;
};

/**
 * Contrat générique exposé via contextBridge sous `window[bridgeName]`.
 * Méthodes marquées optionnelles = présentes selon la maturité de la marque.
 */
export type DesktopBridge = {
  isDesktop: true;
  customWindowChrome?: boolean;

  getInfo: () => Promise<DesktopInfo>;

  getConnectionProfile?: () => Promise<DesktopConnectionProfile>;
  testConnection?: (
    url: string,
  ) => Promise<{ ok: boolean; status: number; baseUrl?: string; error?: string }>;
  chooseConnection?: (profile: {
    mode: "local" | "remote";
    remoteUrl?: string;
    localBind?: "127.0.0.1" | "0.0.0.0";
    chosen?: boolean;
  }) => Promise<{ ok: true; profile: unknown } | { ok: false; error: string }>;
  applyConnection?: (profile: {
    mode: "local" | "remote";
    remoteUrl?: string;
    localBind?: "127.0.0.1" | "0.0.0.0";
    chosen?: boolean;
  }) => Promise<{ ok: true; relaunching?: boolean } | { ok: false; error: string }>;
  rechooseConnection?: () => Promise<
    { ok: true; relaunching?: boolean } | { ok: false; error: string }
  >;
  forgetRememberedServer?: (
    id: string,
  ) => Promise<{ ok: boolean; error?: string }>;

  minimizeWindow?: () => Promise<void>;
  toggleMaximizeWindow?: () => Promise<{ isMaximized: boolean }>;
  closeWindow?: () => Promise<void>;
  isWindowMaximized?: () => Promise<boolean>;
  onWindowMaximizedChanged?: (cb: (maximized: boolean) => void) => () => void;

  openTab: (
    fournisseurId: number,
    url: string,
  ) => Promise<{
    tabId: string;
    fournisseurId: number;
    loadState?: "loading" | "ready" | "error";
    url?: string;
  }>;
  closeTab: (tabId: string) => Promise<void>;
  activateTab: (
    tabId: string,
    rect?: DesktopContentRect,
  ) => Promise<{ ok: boolean; error?: string } | void>;
  activateSite?: (
    siteId: number,
    url: string,
    rect?: DesktopContentRect,
  ) => Promise<{
    ok: boolean;
    error?: string;
    tabId?: string;
    fournisseurId?: number;
    loadState?: "loading" | "ready" | "error";
    url?: string;
  }>;
  setContentRect: (rect: DesktopContentRect) => Promise<void>;
  showCrm: () => Promise<void>;
  listTabs: () => Promise<DesktopTabInfo[]>;
  onTabsChanged: (cb: (tabs: DesktopTabInfo[]) => void) => () => void;
  onTabLoadState?: (cb: (ev: DesktopTabLoadState) => void) => () => void;
  onSupplierTabOpened: (cb: (info: DesktopSupplierTabOpened) => void) => () => void;

  googleLogin: () => Promise<{ ok: boolean; error?: string }>;
  logout?: () => Promise<{ ok: boolean }>;
  retrySetup: () => void;

  getUpdateStatus?: () => Promise<DesktopUpdateStatus>;
  checkForUpdates?: () => Promise<DesktopUpdateStatus>;
  downloadAndInstallUpdate?: () => Promise<DesktopUpdateStatus>;
  onUpdateChanged?: (cb: (status: DesktopUpdateStatus) => void) => () => void;

  setAssistantChrome: (mode: "fab" | "hidden") => Promise<void>;
  onAssistantOpenRequest: (cb: () => void) => () => void;

  /** N2p — espaces collaborateurs IA (optionnel selon marque). */
  getAiWorkspaceIdentity?: () => Promise<{
    userId: string | null;
    label: string;
    active: boolean;
  }>;
  listAiWorkspaces?: () => Promise<
    Array<{
      userId: string;
      label: string;
      partition: string;
      ready: boolean;
      active: boolean;
    }>
  >;
  ensureAiWorkspace?: (opts: {
    userId: string;
    token: string;
    baseUrl?: string;
    label?: string;
    show?: boolean;
  }) => Promise<unknown>;
  showAiWorkspace?: (userId: string) => Promise<unknown>;
  showOwnerWorkspace?: () => Promise<{ ok: true }>;
  ackAiWorkspaceAction?: (
    actionId: string,
    result: Record<string, unknown>,
  ) => void;
};

/**
 * Accès typé au bridge selon le nom contextBridge (brand-config.bridgeName).
 * Ne dépend pas d'Electron — utilisable côté Next / tests.
 */
export function getDesktopBridge(
  bridgeName: string,
  win: Window & Record<string, unknown> = globalThis as unknown as Window &
    Record<string, unknown>,
): DesktopBridge | undefined {
  const api = win[bridgeName];
  if (api && typeof api === "object" && (api as DesktopBridge).isDesktop === true) {
    return api as DesktopBridge;
  }
  return undefined;
}
