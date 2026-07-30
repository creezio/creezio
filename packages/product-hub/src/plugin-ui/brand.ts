/**
 * Tokens marque pour admin plugins UI / desktop API (N6).
 */

export type ProductHubUiBrand = {
  /** Nom global window.*Desktop (ex. tempoflowDesktop). */
  desktopApiGlobal: string;
  /** Nom produit pour toasts / messages. */
  productName: string;
  /** Label app serveur (HostManagedNotice). */
  serverLabel: string;
  /** Event DOM plugins-changed. */
  pluginsChangedEvent: string;
};

const DEFAULT: ProductHubUiBrand = {
  desktopApiGlobal: "creezioDesktop",
  productName: "Creezio",
  serverLabel: "Creezio Server",
  pluginsChangedEvent: "creezio:plugins-changed",
};

let brand: ProductHubUiBrand = { ...DEFAULT };

export function configureProductHubUiBrand(
  next: Partial<ProductHubUiBrand>,
): void {
  brand = { ...brand, ...next };
}

export function getProductHubUiBrand(): ProductHubUiBrand {
  return brand;
}

export function resetProductHubUiBrandForTests(): void {
  brand = { ...DEFAULT };
}

/** Accès typé minimal au bridge desktop. */
export type DesktopApiBridge = {
  getConnectionProfile?: () => Promise<unknown>;
  getAppInfo?: () => Promise<{ kind?: string } | null>;
  getPluginsStatus?: (...args: unknown[]) => Promise<unknown>;
  resolvePluginPanel?: (
    pluginId: string,
  ) => Promise<
    | { ok: true; url: string; siteId: number; title: string }
    | { ok: false; error: string }
  >;
  setPluginEnabled?: (...args: unknown[]) => Promise<unknown>;
  removePlugin?: (...args: unknown[]) => Promise<unknown>;
  listPluginVersions?: (...args: unknown[]) => Promise<unknown>;
  restorePluginVersion?: (...args: unknown[]) => Promise<unknown>;
  runPluginAcceptCheck?: (...args: unknown[]) => Promise<unknown>;
  createPluginFromPrd?: (...args: unknown[]) => Promise<unknown>;
  runPluginTests?: (...args: unknown[]) => Promise<unknown>;
  updatePlugin?: (...args: unknown[]) => Promise<unknown>;
  archivePluginRuntime?: (...args: unknown[]) => Promise<unknown>;
  migratePluginData?: (...args: unknown[]) => Promise<unknown>;
  [key: string]: unknown;
};

type BrowserWindow = Record<string, unknown> & {
  dispatchEvent?: (ev: unknown) => boolean;
  open?: (...args: unknown[]) => unknown;
};

function browserWindow(): BrowserWindow | undefined {
  const g = globalThis as typeof globalThis & { window?: BrowserWindow };
  return g.window;
}

export function getDesktopApi(): DesktopApiBridge | undefined {
  const w = browserWindow();
  if (!w) return undefined;
  const key = getProductHubUiBrand().desktopApiGlobal;
  return w[key] as DesktopApiBridge | undefined;
}

export { browserWindow };

