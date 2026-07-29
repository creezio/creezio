export type CoreNavItem = {
  id: string;
  label: string;
  href: string;
  /** Groupe UI optionnel. */
  group?: "core" | "brand" | "plugin";
  icon?: string;
};

/** Alias historique factory demobrand. */
export type NavItem = CoreNavItem;

export type NavSlotId = "brand-primary" | "brand-secondary" | "plugins";

export type NavSlot = {
  id: NavSlotId;
  items: CoreNavItem[];
};
