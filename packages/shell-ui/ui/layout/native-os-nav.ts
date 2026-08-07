"use client";

/**
 * Nav OS native Creezio — entrées sidebar partagées (mails, tâches, admin…).
 *
 * La marque déclare sa nav métier ; elle compose avec ces listes via
 * `configureSidebar({ getNavItems: () => [...brand, ...defaultOsPrimaryNavItems()] })`.
 * Hermes / n8n restent injectés par la sidebar kit (Admin → Outils).
 *
 * Feature-off plugins (Fidu) : passer `{ includePlugins: false }` à
 * `defaultOsAdminNavItems` — ne pas lister `/admin/plugins`.
 */
import {
  Activity,
  Braces,
  Cable,
  Database,
  KeyRound,
  ListTodo,
  Mail,
  Package,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import type { SidebarAdminItem, SidebarNavItem } from "./sidebar-host";

/** Pages OS utilisateur (hors métier marque). */
export function defaultOsPrimaryNavItems(): SidebarNavItem[] {
  return [
    { href: "/taches", label: "Tâches", icon: ListTodo, fromShell: true },
    { href: "/mails", label: "Mails", icon: Mail, fromShell: true },
    {
      href: "/parametres",
      label: "Préférences",
      icon: SlidersHorizontal,
      fromShell: true,
    },
    {
      href: "/collaborateurs",
      label: "Collaborateurs",
      icon: Shield,
      fromShell: true,
    },
  ];
}

export type OsAdminNavOptions = {
  /**
   * Inclure `/admin/plugins`. Défaut `true`.
   * Mettre `false` si `manifest.features.plugins === false` (Fidu).
   */
  includePlugins?: boolean;
};

/** Liens Admin OS (Hermes/n8n ajoutés à part par la sidebar kit). */
export function defaultOsAdminNavItems(
  opts?: OsAdminNavOptions,
): SidebarAdminItem[] {
  const includePlugins = opts?.includePlugins !== false;
  const items: SidebarAdminItem[] = [
    { href: "/configuration", label: "Configuration", icon: Settings },
    { href: "/admin/analytics", label: "Analytics", icon: Activity },
  ];
  if (includePlugins) {
    items.push({ href: "/admin/plugins", label: "Plugins", icon: Package });
  }
  items.push(
    { href: "/admin/database", label: "Database", icon: Database },
    { href: "/admin/integrations", label: "Intégrations", icon: KeyRound },
    { href: "/admin/api", label: "API", icon: Braces },
    { href: "/admin/mcp", label: "MCP", icon: Cable },
    {
      href: "/admin/request-logs",
      label: "Logs API / MCP",
      icon: ScrollText,
    },
  );
  return items;
}
