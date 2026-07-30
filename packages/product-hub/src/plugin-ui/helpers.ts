/**
 * Ouverture panel plugin / sidebar items (port TempoFlow — N6).
 */

import { browserWindow, getDesktopApi, getProductHubUiBrand } from "./brand.js";

export type PluginPanelOpenTarget = {
  url: string;
  siteId: number;
  title: string;
  pluginId: string;
};

export type PluginPanelOpenFail = {
  ok: false;
  error: string;
};

export type PluginStatusSnapshot = {
  plugins: Array<{
    manifest: {
      id: string;
      name: string;
      permissions: string[];
      panel?: { title?: string; path?: string };
    };
    enabled: boolean;
    error?: string;
  }>;
};

export type PluginSidebarItem = {
  id: string;
  label: string;
};

/**
 * Ne garde que les plugins activés qui exposent une UI directement ouvrable.
 * `allowedIds` (ACL) : null/undefined = pas de filtre ; liste = filtre.
 */
export function pluginSidebarItems(
  status: PluginStatusSnapshot | null | undefined,
  allowedIds?: string[] | null,
): PluginSidebarItem[] {
  const allowed = Array.isArray(allowedIds) ? new Set(allowedIds) : null;
  return (status?.plugins || [])
    .filter(
      (plugin) =>
        plugin.enabled &&
        !plugin.error &&
        plugin.manifest.permissions?.includes("ui:panel") &&
        (!allowed || allowed.has(plugin.manifest.id)),
    )
    .map((plugin) => ({
      id: plugin.manifest.id,
      label: plugin.manifest.panel?.title?.trim() || plugin.manifest.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/** Informe les autres vues React qu'une mutation de plugins vient d'aboutir. */
export function notifyPluginsChanged(): void {
  const w = browserWindow();
  if (w?.dispatchEvent) {
    const Ev = (globalThis as { Event?: new (type: string) => object }).Event;
    if (Ev) w.dispatchEvent(new Ev(getProductHubUiBrand().pluginsChangedEvent) as never);
  }
}

/** Résout l’URL panel d’un plugin running. */
export async function resolvePluginPanelOpenTarget(
  pluginId: string,
): Promise<PluginPanelOpenTarget | PluginPanelOpenFail> {
  const api = getDesktopApi();
  const product = getProductHubUiBrand().productName;
  if (!api?.resolvePluginPanel) {
    return {
      ok: false,
      error: `Panels plugins disponibles uniquement dans ${product} Desktop.`,
    };
  }
  try {
    const r = await api.resolvePluginPanel(pluginId);
    if (!r.ok) return r;
    return {
      url: r.url,
      siteId: r.siteId,
      title: r.title,
      pluginId,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Panel introuvable",
    };
  }
}

export function isPluginPanelOpenTarget(
  v: PluginPanelOpenTarget | PluginPanelOpenFail,
): v is PluginPanelOpenTarget {
  return Boolean(v && "url" in v && typeof v.url === "string");
}

export async function openPluginPanelInWorkspace(opts: {
  pluginId: string;
  openExternalSite?: (o: {
    siteId: number;
    url: string;
    title: string;
  }) => void;
}): Promise<{ ok: true } | PluginPanelOpenFail> {
  const target = await resolvePluginPanelOpenTarget(opts.pluginId);
  if (!isPluginPanelOpenTarget(target)) return target;
  if (opts.openExternalSite) {
    opts.openExternalSite({
      siteId: target.siteId,
      url: target.url,
      title: target.title,
    });
    return { ok: true };
  }
  browserWindow()?.open?.(target.url, "_blank", "noreferrer");
  return { ok: true };
}

export async function isRemoteDesktopClient(): Promise<boolean> {
  const api = getDesktopApi();
  if (!api?.getConnectionProfile) return false;
  try {
    const [profile, info] = await Promise.all([
      api.getConnectionProfile(),
      api.getAppInfo?.() ?? Promise.resolve(null),
    ]);
    const p = profile as { mode?: string } | null;
    const kind = info?.kind;
    const remote =
      p?.mode === "remote" || kind === "client";
    return Boolean(api && remote);
  } catch {
    return false;
  }
}
