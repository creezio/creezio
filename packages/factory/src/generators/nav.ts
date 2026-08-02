/**
 * Générateur nav métier (shell-ui registerBrandNav).
 */
import type { ProductModel } from "../product-model.js";

export function renderVerticalSlotFromModel(model: ProductModel): string {
  const navItems = model.pages.map((p) => ({
    id: `brand.${p.id}`,
    label: p.title,
    href: p.path,
    group: "brand",
  }));

  return `/**
 * Slot métier vertical — ${model.brandName} (généré --from-prd).
 * Nav brand uniquement via @creezio/shell-ui. Pas de stubs OS.
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";

export type VerticalSlot = {
  brandId: string;
  items: CoreNavItem[];
  nav: NavRegistry;
};

const BRAND_NAV: CoreNavItem[] = ${JSON.stringify(navItems, null, 2)};

const nav = createNavRegistry();
nav.registerBrandNav(BRAND_NAV);

export const verticalSlot: VerticalSlot = {
  brandId: ${JSON.stringify(model.brandId)},
  items: nav.getBrandNav(),
  nav,
};
`;
}
