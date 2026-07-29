/**
 * Stub Product Hub sandbox DemoBrand.
 * Défaut : store mémoire. Opt-in sqlite core via DEMOBRAND_PRODUCT_HUB_SQLITE=1.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildPluginImpactReport,
  createMemoryProductHubStore,
  createSqliteProductHubStore,
  productHubTokensFromManifest,
  type ProductHubStore,
} from "@creezio/product-hub";
import { demobrandManifest as manifest } from "./app-manifest.js";

export const demobrandProductHubTokens =
  productHubTokensFromManifest(manifest);

let store: ProductHubStore | null = null;

export function getDemobrandProductHubStore(): ProductHubStore {
  if (!store) {
    if (process.env.DEMOBRAND_PRODUCT_HUB_SQLITE === "1") {
      const dir = path.join(os.tmpdir(), "creezio-demobrand-sqlite");
      fs.mkdirSync(dir, { recursive: true });
      const coreDbPath = path.join(dir, "core.db");
      store = createSqliteProductHubStore({
        coreDbPath,
        conversationPrefix: "demobrand",
      });
    } else {
      store = createMemoryProductHubStore({ conversationPrefix: "demobrand" });
    }
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
