import type { CoreNavItem } from "./types.js";

/**
 * Entrées nav natives Creezio — aucune entrée métier marque
 * (panier, dispatch, GED, RTI…).
 */
export const CORE_NAV_ITEMS: readonly CoreNavItem[] = [
  { id: "core.home", label: "Accueil", href: "/", group: "core" },
  { id: "core.settings", label: "Réglages", href: "/settings", group: "core" },
  {
    id: "core.assistant",
    label: "Assistant",
    href: "/assistant",
    group: "core",
  },
  { id: "core.tasks", label: "Tâches", href: "/taches", group: "core" },
  { id: "core.mails", label: "Mails", href: "/mails", group: "core" },
  { id: "core.setup", label: "Setup", href: "/setup", group: "core" },
  { id: "core.login", label: "Login", href: "/login", group: "core" },
  {
    id: "core.developers",
    label: "Developers",
    href: "/developers",
    group: "core",
  },
  { id: "core.about", label: "À propos", href: "/about", group: "core" },
] as const;

/** Alias factory / demobrand. */
export const coreNavItems: CoreNavItem[] = CORE_NAV_ITEMS.map((i) => ({
  ...i,
}));
