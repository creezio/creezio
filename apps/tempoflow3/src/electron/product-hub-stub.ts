/**
 * Stub Product Hub sandbox — store mémoire + jetons marque.
 * Pas de SQLite / UI Admin (vertical Phase G).
 */

import {
  buildPluginImpactReport,
  createMemoryProductHubStore,
  productHubTokensFromManifest,
  type ProductHubStore,
} from "@creezio/product-hub";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";

export const tempoflow3ProductHubTokens =
  productHubTokensFromManifest(manifest);

let store: ProductHubStore | null = null;

export function getTempoflow3ProductHubStore(): ProductHubStore {
  if (!store) {
    store = createMemoryProductHubStore({ conversationPrefix: "tempoflow3" });
  }
  return store;
}

export function createDemoPluginRequest(input: {
  name: string;
  description?: string;
}) {
  const hub = getTempoflow3ProductHubStore();
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
