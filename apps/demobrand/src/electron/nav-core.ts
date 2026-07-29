/**
 * Navigation cœur plateforme (placeholder).
 * PAS de catalogue TempoFlow ni d'entrées métier marque.
 */
export type NavItem = {
  id: string;
  label: string;
  href: string;
};

/** Entrées shell génériques — communes à toute marque kit. */
export const coreNavItems: NavItem[] = [
  { id: "home", label: "Accueil", href: "/" },
  { id: "settings", label: "Réglages", href: "/settings" },
  { id: "about", label: "À propos", href: "/about" },
];
