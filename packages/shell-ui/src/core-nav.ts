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
  { id: "core.tasks", label: "Tâches", href: "/tasks", group: "core" },
  { id: "core.mails", label: "Mails", href: "/mails", group: "core" },
  { id: "core.about", label: "À propos", href: "/about", group: "core" },
] as const;

/** Alias factory / demobrand. */
export const coreNavItems: CoreNavItem[] = CORE_NAV_ITEMS.map((i) => ({
  ...i,
}));
