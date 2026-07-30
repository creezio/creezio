/**
 * Contrat `activeSurface` — source de vérité unique :
 * « que regarde l'utilisateur ? » (CRM React vs onglet site fournisseur).
 *
 * Module sans alias @/ / sans React — importable par les tests Node et le
 * serveur assistant.
 */

/**
 * Empreinte approx. du FAB (marge + bouton ≈ 20+56+shadow).
 * Ne pilote plus un padding shell permanent : en Electron le FAB est une
 * WebContentsView topmost ; ContentRect site reste full-bleed panel fermé.
 */
export const ASSISTANT_FAB_SAFE_PX = 88;

/** Taille du bouton FAB (équiv. h-14). */
export const ASSISTANT_FAB_SIZE_PX = 56;
/** Marge bas/droite du FAB (équiv. bottom-5 / right-5). */
export const ASSISTANT_FAB_MARGIN_PX = 20;

export type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Bounds écran du FAB overlay (coin bas-droit). */
export function assistantFabScreenRect(
  windowWidth: number,
  windowHeight: number,
): ScreenRect {
  return {
    x: Math.max(0, windowWidth - ASSISTANT_FAB_MARGIN_PX - ASSISTANT_FAB_SIZE_PX),
    y: Math.max(0, windowHeight - ASSISTANT_FAB_MARGIN_PX - ASSISTANT_FAB_SIZE_PX),
    width: ASSISTANT_FAB_SIZE_PX,
    height: ASSISTANT_FAB_SIZE_PX,
  };
}

export function rectsOverlap(a: ScreenRect, b: ScreenRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export type ActiveSurfaceCrm = {
  kind: "crm";
  href: string;
  title: string;
};

export type ActiveSurfaceSupplier = {
  kind: "supplier";
  /** Id runtime Electron (`tab-…`) — peut être "" si pas encore ouvert. */
  tabId: string;
  fournisseurId: number;
  url: string;
  title: string;
};

export type ActiveSurface = ActiveSurfaceCrm | ActiveSurfaceSupplier;

export type SupplierTabSummary = {
  tabId: string;
  fournisseurId: number;
  url: string;
  title: string;
  active?: boolean;
};

export type ActiveSurfaceTabLike = {
  href: string;
  title: string;
  supplier?: {
    fournisseurId: number;
    url: string;
    electronTabId?: string;
  } | null;
};

/** Href workspace `/site/<id>` ? */
export function isSupplierSurfaceHref(href: string): boolean {
  const path = (href.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === "/site" || path.startsWith("/site/");
}

export function fournisseurIdFromSurfaceHref(href: string): number | null {
  const path = (href.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const m = path.match(/^\/site\/(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Résout la surface active depuis l'onglet workspace (source de vérité UI).
 * Enrichissement URL/titre Electron possible via `desktopTab`.
 */
export function resolveActiveSurface(opts: {
  activeTab: ActiveSurfaceTabLike | null | undefined;
  /** Fallback si pas d'onglet (hors workspace). */
  href?: string;
  title?: string;
  desktopTab?: {
    tabId?: string;
    url?: string;
    title?: string;
    fournisseurId?: number;
  } | null;
}): ActiveSurface {
  const tab = opts.activeTab;
  const href = tab?.href || opts.href || "/";
  const title = (tab?.title || opts.title || "").trim() || href;

  if (tab?.supplier || isSupplierSurfaceHref(href)) {
    const fournisseurId =
      tab?.supplier?.fournisseurId ??
      opts.desktopTab?.fournisseurId ??
      fournisseurIdFromSurfaceHref(href) ??
      0;
    return {
      kind: "supplier",
      tabId:
        tab?.supplier?.electronTabId ||
        opts.desktopTab?.tabId ||
        "",
      fournisseurId,
      url: opts.desktopTab?.url || tab?.supplier?.url || "",
      title: (opts.desktopTab?.title || title).trim() || "Site fournisseur",
    };
  }

  return { kind: "crm", href, title };
}

export function parseActiveSurface(raw: unknown): ActiveSurface | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind === "crm") {
    const href = typeof o.href === "string" ? o.href : "/";
    const title = typeof o.title === "string" ? o.title : href;
    return { kind: "crm", href, title };
  }
  if (o.kind === "supplier") {
    const tabId = typeof o.tabId === "string" ? o.tabId : "";
    const fournisseurId = Number(o.fournisseurId) || 0;
    const url = typeof o.url === "string" ? o.url : "";
    const title = typeof o.title === "string" ? o.title : "Site fournisseur";
    return { kind: "supplier", tabId, fournisseurId, url, title };
  }
  return null;
}

export function parseSupplierTabSummaries(raw: unknown): SupplierTabSummary[] {
  if (!Array.isArray(raw)) return [];
  const out: SupplierTabSummary[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const tabId = typeof o.tabId === "string" ? o.tabId : "";
    if (!tabId) continue;
    out.push({
      tabId,
      fournisseurId: Number(o.fournisseurId) || 0,
      url: typeof o.url === "string" ? o.url : "",
      title: typeof o.title === "string" ? o.title : "",
      active: Boolean(o.active),
    });
  }
  return out;
}

/**
 * Bloc system/runtime injecté à chaque tour chat — surface + outils autorisés.
 */
export function formatActiveSurfaceRuntimeBlock(
  surface: ActiveSurface,
  supplierTabs?: SupplierTabSummary[],
): string {
  const lines: string[] = [
    "## Surface active (runtime — OBLIGATOIRE)",
    "Ceci décrit ce que l'utilisateur REGARDE maintenant. Base toute observation/action UI dessus.",
  ];

  if (surface.kind === "supplier") {
    lines.push(
      `- **kind** : \`supplier\` (site externe dans WebContentsView Electron)`,
      `- **tabId** : \`${surface.tabId || "(inconnu — appeler supplier_list_tabs)"}\``,
      `- **fournisseurId** : ${surface.fournisseurId || "?"}`,
      `- **url** : ${surface.url || "(chargement…)"}`,
      `- **title** : ${surface.title}`,
      "",
      "### Outils autorisés pour OBSERVER / AGIR sur cette page",
      "- Utilise **`surface_list_targets` / `surface_click` / `surface_type` / `surface_scroll` / `surface_read`** (routage auto vers le driver fournisseur).",
      "- Équivalents acceptés : `supplier_*` avec le `tabId` ci-dessus.",
      "- **INTERDIT** d'utiliser `ui_*` pour lire ou piloter cette page : `ui_*` ne voit que le shell CRM (slot `/site/<id>` vide), PAS le site externe.",
      "- Pour savoir « où suis-je ? » : `surface_list_targets` (ou `supplier_list_targets`) — le résultat contient url/title du site.",
      "- Login : champs email/password **natifs** = autorisés si l'utilisateur demande de les remplir. CAPTCHA / challenge Cloudflare = laisser à l'humain.",
    );
  } else {
    lines.push(
      `- **kind** : \`crm\` (interface React TempoFlow)`,
      `- **href** : ${surface.href}`,
      `- **title** : ${surface.title}`,
      "",
      "### Outils autorisés pour OBSERVER / AGIR sur cette page",
      "- Utilise **`surface_*`** (routage auto vers `ui_*`) ou directement `ui_list_targets` / `ui_click` / `ui_type` / `ui_scroll`.",
      "- Les outils `supplier_*` ciblent uniquement les onglets sites externes, pas cette page CRM.",
    );
  }

  if (supplierTabs && supplierTabs.length > 0) {
    lines.push("", "### Onglets sites ouverts");
    for (const t of supplierTabs.slice(0, 12)) {
      const mark = t.active || t.tabId === (surface.kind === "supplier" ? surface.tabId : "")
        ? " ← actif"
        : "";
      lines.push(
        `- \`${t.tabId}\` f=${t.fournisseurId} ${t.title || t.url}${mark}`,
      );
    }
  }

  return lines.join("\n");
}

/** Demande d'action / observation sur la page visible (souris). */
export function looksLikeSurfaceCommand(userMessage: string): boolean {
  const t = userMessage.toLowerCase();
  if (
    /\b(va|vas|aller|ouvre|ouvrir|affiche|afficher|montre|montrer|navigue|naviguer|clique|cliquer|filtre|filtrer|s[ée]lectionne|coche|page)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(remplis|remplir|rentre|rentrer|saisis|saisir|tape|taper|inscris|inscrire|entre|entrer)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(email|e-mail|mail|mot\s+de\s+passe|password|login|connexion|champ)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (/\b(o[uù]\s+suis[- ]je|quelle\s+page|sur\s+quelle\s+page)\b/.test(t)) {
    return true;
  }
  return false;
}
