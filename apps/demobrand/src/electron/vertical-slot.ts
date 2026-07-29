/**
 * Slot métier vertical — DemoBrand.
 * Nav brand via `@creezio/shell-ui` ; Product Hub (mémoire ou sqlite core).
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";
import {
  createDemoPluginRequest,
  demobrandProductHubTokens,
  getDemobrandProductHubStore,
} from "./product-hub-stub.js";

export type VerticalSlot = {
  /** Identifiant marque. */
  brandId: string;
  /** Entrées de nav métier (vide = squelette factory). */
  items: CoreNavItem[];
  /** Registre slots shell-ui. */
  nav: NavRegistry;
  /** Accès Product Hub sandbox. */
  productHub: {
    tokens: typeof demobrandProductHubTokens;
    getStore: typeof getDemobrandProductHubStore;
    createRequest: typeof createDemoPluginRequest;
  };
};

const nav = createNavRegistry();
nav.registerBrandNav([]);

export const verticalSlot: VerticalSlot = {
  brandId: "demobrand",
  items: nav.getBrandNav(),
  nav,
  productHub: {
    tokens: demobrandProductHubTokens,
    getStore: getDemobrandProductHubStore,
    createRequest: createDemoPluginRequest,
  },
};
