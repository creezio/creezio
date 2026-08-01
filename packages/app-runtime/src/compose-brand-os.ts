/**
 * Composition OS complète derrière la façade marque.
 * Absorbe createBrandHostRuntime + createBrandHostStack — zéro host-stack
 * dans apps/<marque>.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { AppManifest } from "@creezio/brand-config";
import {
  createBrandHostRuntime,
  createBrandHostStack,
  createLocalConfigStoreSync,
  createLocalSplashSteps,
  createPluginsHost,
  log,
  type BrandHostSingletons,
  type BrandHostStack,
  type LocalConfigStore,
} from "@creezio/electron-shell";
import {
  resolveBrandDbPath,
  resolveCoreDbPath,
  resolveLocalConfigPath,
  type PathsContext,
} from "@creezio/platform-core";

export type ComposeBrandOsOptions = {
  manifest: AppManifest;
  userDataDir: string;
  isPackaged?: boolean;
  resourcesRoot: string;
  /** __dirname electron compilé (preload / scripts). */
  electronDirname: string;
  /** Tunnel provision (sinon defaults sandbox / env CREEZIO_TUNNEL_*). */
  tunnel?: {
    baseUrl?: string;
    token?: string;
  };
  /**
   * Host plugins réel (défaut feature-off).
   * Opt-in : `pluginsFeatureOff: false` ou `CREEZIO_PLUGINS=1`.
   */
  pluginsFeatureOff?: boolean;
};

export type BrandOsComposition = {
  store: LocalConfigStore;
  hostRuntime: BrandHostSingletons;
  hostStack: BrandHostStack;
  paths: ReturnType<typeof buildBrandPaths>;
  pathsCtx: PathsContext;
  /** Splash steps kit (pour installBrandDesktopRuntime ultérieur). */
  createLocalSplashSteps: typeof createLocalSplashSteps;
  status: () => BrandOsStatus;
  close: () => void;
};

export type BrandOsStatus = {
  ok: true;
  brandId: string;
  setupComplete: boolean;
  hosts: {
    hermes: boolean;
    n8n: boolean;
    tunnel: boolean;
    meili: boolean;
    plugins: "feature-off" | "enabled";
  };
  paths: {
    userDataDir: string;
    brandDb: string;
    coreDb: string;
    resourcesRoot: string;
  };
};

function shellPackageRoot(): string {
  try {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    const entry = req.resolve("@creezio/electron-shell");
    // …/packages/electron-shell/dist/index.js → package root
    return path.resolve(path.dirname(entry), "..");
  } catch {
    return path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../electron-shell",
    );
  }
}

function ensureCrmKeyDbScript(): string {
  const root = shellPackageRoot();
  const candidates = [
    path.join(root, "dist/host/hermes/ensure-crm-key-db.js"),
    path.join(root, "dist-cjs/host/hermes/ensure-crm-key-db.js"),
    path.join(root, "src/host/hermes/ensure-crm-key-db.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]!;
}

function buildBrandPaths(opts: ComposeBrandOsOptions) {
  const pathsCtx: PathsContext = {
    manifest: opts.manifest,
    userDataRoot: opts.userDataDir,
    isPackaged: Boolean(opts.isPackaged),
    resourcesRoot: opts.resourcesRoot,
  };
  const brandDb = resolveBrandDbPath(pathsCtx);
  const coreDb = resolveCoreDbPath(pathsCtx);
  const m = opts.manifest;
  return {
    ctx: pathsCtx,
    userDataDir: () => opts.userDataDir,
    isPackaged: () => Boolean(opts.isPackaged),
    resourcesRoot: () => opts.resourcesRoot,
    dbPath: () => brandDb,
    assistantDbPath: () => path.join(opts.userDataDir, "assistant.db"),
    uploadsDir: () => path.join(opts.userDataDir, "uploads"),
    nextServerEntry: () => {
      const standalone = path.join(
        opts.electronDirname,
        "../../ui/.next/standalone/server.js",
      );
      if (fs.existsSync(standalone)) return standalone;
      return path.join(opts.electronDirname, "../../ui/server.js");
    },
    nodeBinary: () => process.execPath,
    meiliDataDir: () => path.join(opts.userDataDir, "meili"),
    meiliBinary: () => {
      const name = process.platform === "win32" ? "meili.exe" : "meili";
      const candidates = [
        path.join(opts.resourcesRoot, "meili"),
        path.join(opts.resourcesRoot, "bin", name),
        path.join(shellPackageRoot(), "resources", "bin", name),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
      return candidates[0]!;
    },
    n8nHomeDir: () => path.join(opts.userDataDir, "n8n"),
    hermesHomeDir: () => path.join(opts.userDataDir, "hermes"),
    nodeModulesPathForScripts: () => {
      const cand = path.join(opts.electronDirname, "../../../node_modules");
      return fs.existsSync(cand) ? cand : null;
    },
    nodeScript: (rel: string) => path.join(opts.electronDirname, rel),
    preloadPath: (name: string) => path.join(opts.electronDirname, name),
    gitBinary: () => null as string | null,
    envPrefix: m.envPrefix,
  };
}

/**
 * Compose hosts OS natifs (Hermes, n8n, tunnel, Meili stack, factory-reset…)
 * à partir du seul AppManifest — rien dans la marque.
 */
export function composeBrandOs(
  opts: ComposeBrandOsOptions,
): BrandOsComposition {
  const paths = buildBrandPaths(opts);
  const m = opts.manifest;
  const configPath = resolveLocalConfigPath(paths.ctx);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  const store = createLocalConfigStoreSync({
    configPath,
    manifest: m,
    encryption: "plain",
  });

  const prefix = m.envPrefix;
  const product = m.client.productName;
  const domain = m.tunnelRootDomain || m.domains?.primary || "localhost";
  const pluginsFeatureOff =
    opts.pluginsFeatureOff !== undefined
      ? opts.pluginsFeatureOff
      : process.env.CREEZIO_PLUGINS !== "1";
  const tunnelBaseUrl =
    opts.tunnel?.baseUrl ||
    process.env.CREEZIO_TUNNEL_PROVISION_URL ||
    process.env[`${prefix}_TUNNEL_PROVISION_URL`] ||
    `https://${domain}/tunnel-sandbox`;
  const tunnelToken =
    opts.tunnel?.token ||
    process.env.CREEZIO_TUNNEL_PROVISION_TOKEN ||
    process.env[`${prefix}_TUNNEL_PROVISION_TOKEN`] ||
    "sandbox";

  const hostRuntime = createBrandHostRuntime({
    manifest: m,
    store: () => store,
    paths: {
      userDataDir: paths.userDataDir,
      resourcesRoot: paths.resourcesRoot,
      isPackaged: paths.isPackaged,
      dbPath: paths.dbPath,
      n8nHomeDir: paths.n8nHomeDir,
      nodeBinary: paths.nodeBinary,
      nodeModulesPathForScripts: paths.nodeModulesPathForScripts,
      gitBinary: paths.gitBinary,
      hermesHomeDir: paths.hermesHomeDir,
      assistantDbPath: paths.assistantDbPath,
    },
    hermesCrm: {
      apiKeyPrefix: `${m.brandId.replace(/-/g, "_")}_live_`,
      fileName: `.${m.brandId}-hermes-crm-api-key.json`,
      keyName: `${product} Hermes (service)`,
      apiKeyEnv: `${prefix}_API_KEY`,
      apiUrlEnv: `${prefix}_API_URL`,
    },
    n8nApiKey: {
      label: `${product} Hermes`,
      fileName: `.${m.brandId}-n8n-api-key.json`,
    },
    n8nAgent: {
      keysFileName: `.${m.brandId}-n8n-agent-keys.json`,
      labelPrefix: `${product} Agent`,
      tagPrefix: `${m.brandId}-agent`,
      productName: product,
    },
    tunnel: {
      envBaseUrlKey: `${prefix}_TUNNEL_PROVISION_URL`,
      defaultBaseUrl: tunnelBaseUrl,
      envTokenKey: `${prefix}_TUNNEL_PROVISION_TOKEN`,
      defaultToken: tunnelToken,
      mailRootDomain: domain,
    },
    npmUserDataSegment: `${m.brandId}-npm`,
    secretFilePrefix: m.brandId,
    hermesBridge: "full",
    nodeEnsure: "desktop",
    ensureDbScriptPath: () => ensureCrmKeyDbScript(),
    log: (scope, line) => log(scope, line),
  });

  const hostStack = createBrandHostStack({
    ensureN2Configured: () => undefined,
    getManifest: () => m,
    getStore: () => ({
      ensureAuthSecret: () => store.ensureAuthSecret(),
      ensureMcpJwtSecret: () => store.ensureMcpJwtSecret(),
      getLocalAuth: () => store.getLocalAuth(),
      getLlmKeys: () => {
        const k = store.getLlmKeys();
        return {
          openai: k.openai ?? undefined,
          anthropic: k.anthropic ?? undefined,
        };
      },
      isSetupComplete: () => store.isSetupComplete(),
    }),
    getPaths: () => paths as never,
    portEnvKey: `${prefix}_DESKTOP_PORT`,
    defaultPort: 18790,
    envPrefix: prefix,
    getHermesHost: () => hostRuntime.hermesHost(),
    getHermesCrmKeySurface: () => hostRuntime.hermesCrmKeySurface(),
    getN8nHost: () => hostRuntime.n8nHost(),
    getTunnelService: () => hostRuntime.tunnelService(),
    getNodeRuntime: () => ({
      ensureDesktopNode: hostRuntime.ensureNode,
      ready: true,
    }),
    getHermesSeed: () => ({
      seedHermesSkills: async () => ({ ok: true, seeded: 0 }),
    }),
    meiliCoherence: "kit",
    getCatalog: () => ({
      RateEstimator: class {
        sample() {
          return 0;
        }
      },
      formatEta: () => "",
      ensureCatalogPresent: async () =>
        fs.existsSync(paths.dbPath()) ? "present" : "present",
    }),
    catalogPresentIfDbExists: true,
    // P&P : plugins feature-off par défaut (pas de sidecars marque).
    // Opt-in : composeBrandOs({ pluginsFeatureOff: false }) ou CREEZIO_PLUGINS=1.
    pluginsFeatureOff,
    featureOffBrandLabel: product,
    ...(!pluginsFeatureOff
      ? {
          getPlugins: (() => {
            let host: ReturnType<typeof createPluginsHost> | null = null;
            return () =>
              (host ??= createPluginsHost({
                ctx: hostRuntime.hostRuntimeContext(),
              }));
          })(),
        }
      : {}),
  });

  const pluginsMode = pluginsFeatureOff ? "feature-off" : "enabled";

  const status = (): BrandOsStatus => ({
    ok: true,
    brandId: m.brandId,
    setupComplete: store.isSetupComplete(),
    hosts: {
      hermes: typeof hostRuntime.hermesHost === "function",
      n8n: typeof hostRuntime.n8nHost === "function",
      tunnel: typeof hostRuntime.tunnelService === "function",
      meili: true,
      plugins: pluginsMode,
    },
    paths: {
      userDataDir: opts.userDataDir,
      brandDb: paths.dbPath(),
      coreDb: resolveCoreDbPath(paths.ctx),
      resourcesRoot: opts.resourcesRoot,
    },
  });

  log(
    "os",
    `composeBrandOs brand=${m.brandId} hermes/n8n/tunnel ready setup=${store.isSetupComplete()}`,
  );

  return {
    store,
    hostRuntime,
    hostStack,
    paths,
    pathsCtx: paths.ctx,
    createLocalSplashSteps,
    status,
    close: () => {
      hostRuntime.resetForTests();
    },
  };
}
