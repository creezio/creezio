/**
 * Slot métier vertical — TempoFlow (généré --from-prd).
 * Nav brand uniquement via @creezio/shell-ui.
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";
import {
  createDemoPluginRequest,
  tempoflow3ProductHubTokens,
  getTempoflow3ProductHubStore,
} from "./product-hub-stub.js";

export type VerticalSlot = {
  brandId: string;
  items: CoreNavItem[];
  nav: NavRegistry;
  productHub: {
    tokens: typeof tempoflow3ProductHubTokens;
    getStore: typeof getTempoflow3ProductHubStore;
    createRequest: typeof createDemoPluginRequest;
  };
};

const BRAND_NAV: CoreNavItem[] = [
  {
    "id": "brand.dashboard",
    "label": "Dashboard",
    "href": "/dashboard",
    "group": "brand"
  },
  {
    "id": "brand.fournisseurs",
    "label": "Fournisseurs",
    "href": "/fournisseurs",
    "group": "brand"
  },
  {
    "id": "brand.produits",
    "label": "Produits",
    "href": "/produits",
    "group": "brand"
  },
  {
    "id": "brand.prix",
    "label": "Prix",
    "href": "/prix",
    "group": "brand"
  },
  {
    "id": "brand.panier",
    "label": "Panier",
    "href": "/panier",
    "group": "brand"
  },
  {
    "id": "brand.commandes",
    "label": "Commandes",
    "href": "/commandes",
    "group": "brand"
  },
  {
    "id": "brand.optimiser",
    "label": "Optimiser",
    "href": "/optimiser",
    "group": "brand"
  },
  {
    "id": "brand.stack",
    "label": "Mes produits",
    "href": "/stack",
    "group": "brand"
  },
  {
    "id": "brand.releves",
    "label": "Relevés",
    "href": "/releves",
    "group": "brand"
  },
  {
    "id": "brand.scan",
    "label": "Scan",
    "href": "/scan",
    "group": "brand"
  },
  {
    "id": "brand.marketplaces",
    "label": "Marketplaces",
    "href": "/marketplaces",
    "group": "brand"
  },
  {
    "id": "brand.secteurs",
    "label": "Secteurs",
    "href": "/secteurs",
    "group": "brand"
  },
  {
    "id": "brand.agregateurs",
    "label": "Agrégateurs",
    "href": "/agregateurs",
    "group": "brand"
  },
  {
    "id": "brand.data-mapping",
    "label": "Data-mapping",
    "href": "/data-mapping",
    "group": "brand"
  }
];

const nav = createNavRegistry();
nav.registerBrandNav(BRAND_NAV);

export const verticalSlot: VerticalSlot = {
  brandId: "tempoflow3",
  items: nav.getBrandNav(),
  nav,
  productHub: {
    tokens: tempoflow3ProductHubTokens,
    getStore: getTempoflow3ProductHubStore,
    createRequest: createDemoPluginRequest,
  },
};
