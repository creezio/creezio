export type SidebarNavItem = {
  href: string;
  label: string;
  icon: any;
  fromShell?: boolean;
  /**
   * Permission requise pour voir l'entrée primaire (ex. "nav.panier") —
   * filtrée sur me.permissions comme les entrées admin. Absente = visible.
   */
  permission?: string | null;
};

export type SidebarAdminItem = {
  href: string;
  label: string;
  icon: any;
  permission?: string | null;
};

export type SidebarHost = {
  /** Primary nav items (ordered). */
  getNavItems: () => SidebarNavItem[];
  /** Admin page links (Hermes/n8n added separately if tools enabled). */
  getAdminItems?: () => SidebarAdminItem[];
  /** ACL: return false to hide item. me from useSession. */
  canShowHref?: (href: string, me: any) => boolean;
  /** Forced active href for soft-ctx (product detail etc). */
  resolveForcedActiveHref?: (pathname: string, search: string) => string | null;
  /** Brand mark node factory (monogram). If absent, use productName initials. */
  renderBrandMark?: (props: { className?: string }) => any;
  /** Optional tools section renderer (Hermes/n8n links) - ReactNode or component. */
  renderTools?: (ctx: { collapsed: boolean; me: any }) => any;
  /** Optional plugins section. */
  renderPlugins?: (ctx: { collapsed: boolean; me: any }) => any;
  /** Plugin host optional (fetch + open). */
  plugins?: {
    changedEvent: string;
    fetchVisible: () => Promise<Array<{ id: string; label: string; href?: string }>>;
    openPanel: (id: string, opts: any) => void;
  };
  /** Extra footer actions (rechoose connection etc) - optional. */
  onLogoutExtra?: () => void | Promise<void>;
};

let host: SidebarHost | null = null;

export function configureSidebar(next: SidebarHost): void {
  host = next;
}

export function getSidebarHost(): SidebarHost {
  if (!host) throw new Error("@creezio/shell-ui: configureSidebar() requis");
  return host;
}

export function getSidebarHostOptional(): SidebarHost | null {
  return host;
}
