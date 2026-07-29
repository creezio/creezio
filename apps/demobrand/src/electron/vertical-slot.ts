/**
 * Slot métier vertical — vide volontairement.
 * Y brancher le domaine produit (DemoBrand) sans polluer le kit.
 */
import type { NavItem } from "./nav-core.js";

export type VerticalSlot = {
  /** Identifiant marque. */
  brandId: string;
  /** Entrées de nav métier (vide = squelette factory). */
  items: NavItem[];
};

export const verticalSlot: VerticalSlot = {
  brandId: "demobrand",
  items: [],
};
