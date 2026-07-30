/**
 * Host marque pour le tab-workspace (dépend supplier-surface / nav métier).
 * O9 — injection ; pas de jumeau.
 */

export type OpenSupplierSiteOpts = {
  url: string;
  title?: string;
  siteId?: number;
  [key: string]: unknown;
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
