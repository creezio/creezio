/**
 * Slot métier vertical — DemoBrand.
 * Product Hub stub (Phase E) branché ; domaine métier reste vide.
 */
import type { NavItem } from "./nav-core.js";
import {
  createDemoPluginRequest,
  demobrandProductHubTokens,
  getDemobrandProductHubStore,
} from "./product-hub-stub.js";

export type VerticalSlot = {
  /** Identifiant marque. */
  brandId: string;
  /** Entrées de nav métier (vide = squelette factory). */
  items: NavItem[];
  /** Accès Product Hub sandbox (store mémoire). */
  productHub: {
    tokens: typeof demobrandProductHubTokens;
    getStore: typeof getDemobrandProductHubStore;
    createRequest: typeof createDemoPluginRequest;
  };
};

export const verticalSlot: VerticalSlot = {
  brandId: "demobrand",
  items: [],
  productHub: {
    tokens: demobrandProductHubTokens,
    getStore: getDemobrandProductHubStore,
    createRequest: createDemoPluginRequest,
  },
};
