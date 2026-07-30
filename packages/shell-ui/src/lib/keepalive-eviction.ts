/**
 * Politique d'éviction keep-alive (pur / testable).
 * Les panes fullscreen (/site/*, optimiser canvas…) ne sont jamais évincées.
 */

const DASHBOARD_PATH = "/dashboard";
const OPTIMISER_PATH = "/optimiser";

function normalizeHref(href: string): string {
  try {
    const url = new URL(href, "http://local.invalid");
    const path = url.pathname === "/" ? DASHBOARD_PATH : url.pathname || "/";
    const search = url.search || "";
    return `${path}${search}`;
  } catch {
    return href.split("#")[0] || "/";
  }
}

function isOptimiserCanvasHref(href: string): boolean {
  const normalized = normalizeHref(href);
  try {
    const url = new URL(normalized, "http://local.invalid");
    if (url.pathname !== OPTIMISER_PATH) return false;
    return url.searchParams.has("commande");
  } catch {
    return false;
  }
}

function isSupplierHref(href: string): boolean {
  const path = normalizeHref(href).split("?")[0] || "/";
  return path === "/site" || path.startsWith("/site/");
}

function isFullscreenHref(href: string): boolean {
  return isOptimiserCanvasHref(href) || isSupplierHref(href);
}

export function isKeepAliveProtectedKey(key: string): boolean {
  return isFullscreenHref(normalizeHref(key));
}

/**
 * Clés évinçables (plus anciennes d'abord), hors display/route et hors protégées.
 */
export function rankKeepAliveEvictionKeys(
  keys: string[],
  lastActiveAt: Record<string, number>,
  opts: { displayKey: string; routeKey: string },
): string[] {
  return keys
    .filter(
      (key) =>
        key !== opts.displayKey &&
        key !== opts.routeKey &&
        !isKeepAliveProtectedKey(key),
    )
    .sort((a, b) => (lastActiveAt[a] || 0) - (lastActiveAt[b] || 0));
}
