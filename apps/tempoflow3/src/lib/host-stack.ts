/**
 * Bindings host-stack marque — généré factory.
 * Compose createBrandHostStack quand les hosts verticaux sont prêts.
 */
import type { AppManifest } from "@creezio/brand-config";
import { createBrandHostStack } from "@creezio/electron-shell";
import { brandPaths } from "./paths.js";

export type LocalConfigStoreLike = {
  ensureAuthSecret: () => string;
  ensureMcpJwtSecret: () => string;
  getLocalAuth: () => { authUser: string; authPassword: string } | null;
  getLlmKeys: () => Record<string, string | undefined>;
  isSetupComplete: () => boolean;
};

export type MemoryLocalConfigStore = LocalConfigStoreLike & {
  completeSetup: (user: string, password: string) => void;
};

/** Store mémoire minimal pour sandbox / first-run. */
export function createMemoryLocalConfigStore(): MemoryLocalConfigStore {
  let setup = false;
  let authSecret = "dev-auth-secret";
  let mcpSecret = "dev-mcp-secret";
  let localAuth: { authUser: string; authPassword: string } | null = null;
  return {
    ensureAuthSecret: () => authSecret,
    ensureMcpJwtSecret: () => mcpSecret,
    getLocalAuth: () => localAuth,
    getLlmKeys: () => ({}),
    isSetupComplete: () => setup,
    completeSetup(user: string, password: string) {
      localAuth = { authUser: user, authPassword: password };
      setup = true;
    },
  };
}

export function buildHostStack(opts: {
  manifest: AppManifest;
  store: LocalConfigStoreLike;
  stubs?: Record<string, () => unknown>;
}) {
  const stub = (name: string) => () => {
    if (opts.stubs?.[name]) return opts.stubs[name]!();
    return {
      start: async () => ({ ok: true, stub: name }),
      stop: async () => undefined,
      publicUrlForEmbedService: () => null,
    };
  };
  return createBrandHostStack({
    ensureN2Configured: () => undefined,
    getManifest: () => opts.manifest,
    getStore: () => opts.store,
    getPaths: () => brandPaths as never,
    portEnvKey: "TEMPOFLOW3_PORT",
    defaultPort: 18790,
    envPrefix: "TEMPOFLOW3",
    getHermesHost: stub("hermes"),
    getHermesCrmKeySurface: stub("hermesCrmKey"),
    getN8nHost: stub("n8n"),
    getTunnelService: stub("tunnel"),
    getNodeRuntime: () => ({ ready: true }),
    getHermesSeed: stub("hermesSeed"),
    meiliCoherence: "kit",
    getCatalog: stub("catalog"),
    pluginsFeatureOff: true,
    featureOffBrandLabel: "TempoFlow",
  });
}
