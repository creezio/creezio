/**
 * Host marque pour le tab-workspace (nav / surfaces métier reste marque).
 * O9 — injection ; pas de jumeau.
 *
 * Capacité native = ouvrir un **site externe** (onglet), pas un « fournisseur ».
 * Les libellés métier (Fournisseur, Outil, …) = config/UI marque.
 */

/** Options d’ouverture d’un site externe (partition /site/<id>). */
export type OpenExternalSiteOpts = {
  url: string;
  title?: string;
  /** Id de partition persistante (0 = générique / hash host). */
  siteId?: number;
  electronTabId?: string;
  navigateUrl?: boolean;
  [key: string]: unknown;
};

/**
 * @deprecated Utiliser `OpenExternalSiteOpts` + `siteId`.
 * Alias temporaire : `fournisseurId` → `siteId`.
 */
export type OpenSupplierSiteOpts = OpenExternalSiteOpts & {
  /** @deprecated → `siteId` */
  fournisseurId?: number;
};

export type TabWorkspaceHost = {
  useTabWorkspace: () => any;
  useOpenTab?: () => (...args: any[]) => any;
};

let host: TabWorkspaceHost | null = null;

export function configureTabWorkspaceHost(next: TabWorkspaceHost): void {
  host = next;
}

export function useTabWorkspace(): any {
  if (!host?.useTabWorkspace) {
    throw new Error(
      "@creezio/shell-ui: configureTabWorkspaceHost() requis avant useTabWorkspace",
    );
  }
  return host.useTabWorkspace();
}

export function useOpenTab(): any {
  if (host?.useOpenTab) return host.useOpenTab();
  return () => {};
}

export function useTabWorkspaceOptional(): any {
  if (!host?.useTabWorkspace) return null;
  try {
    return host.useTabWorkspace();
  } catch {
    return null;
  }
}

/** Normalise opts marque (fournisseurId legacy → siteId). */
export function normalizeOpenExternalSiteOpts(
  opts: OpenExternalSiteOpts | OpenSupplierSiteOpts,
): OpenExternalSiteOpts {
  const siteId =
    opts.siteId ??
    (opts as OpenSupplierSiteOpts).fournisseurId ??
    0;
  const { fournisseurId: _drop, ...rest } = opts as OpenSupplierSiteOpts;
  return { ...rest, siteId };
}

/**
 * Ouvre un site externe via le host workspace (API générique).
 * Accepte `openExternalSite` (SoT) ou `openSupplierSite` (alias déprécié marque).
 */
export function openExternalSiteFromWorkspace(
  workspace: any,
  opts: OpenExternalSiteOpts | OpenSupplierSiteOpts,
): void {
  if (!workspace) return;
  const normalized = normalizeOpenExternalSiteOpts(opts);
  const open =
    workspace.openExternalSite ??
    workspace.openSupplierSite;
  if (typeof open === "function") open(normalized);
}
