/**
 * Générateur nav métier (shell-ui registerBrandNav).
 */
import type { ProductModel } from "../product-model.js";

function brandPascal(brandId: string): string {
  return brandId
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function renderVerticalSlotFromModel(model: ProductModel): string {
  const pascal = brandPascal(model.brandId);
  const tokensName = `${model.brandId.replace(/-/g, "")}ProductHubTokens`;
  const navItems = model.pages.map((p) => ({
    id: `brand.${p.id}`,
    label: p.title,
    href: p.path,
    group: "brand",
  }));

  return `/**
 * Slot métier vertical — ${model.brandName} (généré --from-prd).
 * Nav brand uniquement via @creezio/shell-ui.
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";
import {
  createDemoPluginRequest,
  ${tokensName},
  get${pascal}ProductHubStore,
} from "./product-hub-stub.js";

export type VerticalSlot = {
  brandId: string;
  items: CoreNavItem[];
  nav: NavRegistry;
  productHub: {
    tokens: typeof ${tokensName};
    getStore: typeof get${pascal}ProductHubStore;
    createRequest: typeof createDemoPluginRequest;
  };
};

const BRAND_NAV: CoreNavItem[] = ${JSON.stringify(navItems, null, 2)};

const nav = createNavRegistry();
nav.registerBrandNav(BRAND_NAV);

export const verticalSlot: VerticalSlot = {
  brandId: ${JSON.stringify(model.brandId)},
  items: nav.getBrandNav(),
  nav,
  productHub: {
    tokens: ${tokensName},
    getStore: get${pascal}ProductHubStore,
    createRequest: createDemoPluginRequest,
  },
};
`;
}
