/**
 * Stub Product Hub sandbox DemoBrand — store mémoire + jetons marque.
 * Pas de SQLite / UI Admin (vertical Phase G).
 */

import {
  buildPluginImpactReport,
  createMemoryProductHubStore,
  productHubTokensFromManifest,
  type ProductHubStore,
} from "@creezio/product-hub";
import { demobrandManifest as manifest } from "./app-manifest.js";

export const demobrandProductHubTokens =
  productHubTokensFromManifest(manifest);

let store: ProductHubStore | null = null;

export function getDemobrandProductHubStore(): ProductHubStore {
  if (!store) {
    store = createMemoryProductHubStore({ conversationPrefix: "demobrand" });
  }
  return store;
}

/** Crée une demande plugin démo (impact local, sans CRM). */
export function createDemoPluginRequest(input: {
  name: string;
  description?: string;
}) {
  const hub = getDemobrandProductHubStore();
  const impact = buildPluginImpactReport({
    name: input.name,
    description: input.description || "",
    evidence: [],
  });
  return hub.createRequest({
    name: input.name,
    description: input.description,
    impact,
  });
}
