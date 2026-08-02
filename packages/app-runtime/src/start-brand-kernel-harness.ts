/**
 * Harness Node — même façade HTTP + Meili + OS que le desktop, sans Electron.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureKitOsBinaries,
  kitBinaryPaths,
  listenBrandKernelHttp,
  maybeBootBrandMeili,
} from "@creezio/electron-shell";
import { createMcpFacade } from "@creezio/mcp-facade";
import { brandKernelBooter } from "./create-brand-kernel.js";
import { composeBrandOs } from "./compose-brand-os.js";
import { listenBrandOsHttp } from "./listen-brand-os-http.js";
import {
  mcpSurfaceHandlesPath,
  mountBrandMcpSurface,
} from "./mount-brand-mcp-surface.js";
import { warmBrandNativeHosts } from "./warm-brand-native-hosts.js";
import type {
  BootBrandKernelFn,
  BrandKernelHarnessHandle,
  StartBrandKernelHarnessConfig,
} from "./types.js";

function resolveBootKernel(
  config: StartBrandKernelHarnessConfig,
): BootBrandKernelFn {
  if (config.bootKernel) return config.bootKernel;
  if (
    config.manifest &&
    config.brandMigrations &&
    config.registerModuleApi
  ) {
    return brandKernelBooter({
      manifest: config.manifest,
      brandMigrations: config.brandMigrations,
      registerModuleApi: config.registerModuleApi,
      beforeBoot: config.beforeBoot,
      enablePlatformServices: config.enablePlatformServices,
    });
  }
  throw new Error(
    "startBrandKernelHarness: fournir bootKernel OU manifest+brandMigrations+registerModuleApi",
  );
}

export async function startBrandKernelHarness(
  config: StartBrandKernelHarnessConfig,
): Promise<BrandKernelHarnessHandle> {
  const envPort = Number(process.env.METIER_PORT || process.env.PORT || 0);
  const port = config.port ?? (envPort > 0 ? envPort : undefined);
  const dataDir =
    config.dataDir ||
    process.env.METIER_DATA_DIR ||
    fs.mkdtempSync(path.join(os.tmpdir(), `${config.brandId}-kernel-`));
  const desktopProfile = config.desktopProfile || "full";

  // P&P : binaires kit (Meili/cloudflared) avant Meili/tunnel — jamais dans la marque.
  if (process.env.CREEZIO_SKIP_KIT_BINARIES !== "1") {
    const bins = await ensureKitOsBinaries();
    if (!bins.ok) {
      console.warn(
        `[creezio-os] harness binaires kit incomplets: ${bins.errors.join("; ") || "meili/cloudflared manquants"}`,
      );
    }
  }

  const bootKernel = resolveBootKernel(config);
  const { api, runtime, close: closeKernel } = bootKernel({
    userDataDir: dataDir,
  });

  const resourcesRoot = path.join(config.appRoot, "resources");
  let brandOs = null as ReturnType<typeof composeBrandOs> | null;
  if (desktopProfile === "full" && config.manifest) {
    brandOs = composeBrandOs({
      manifest: config.manifest,
      userDataDir: dataDir,
      isPackaged: false,
      resourcesRoot,
      electronDirname: path.join(config.appRoot, "build/electron"),
      ...(config.catalogHost ? { catalogHost: config.catalogHost } : {}),
    });
  }

  let searchEngine: BrandKernelHarnessHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    const kitMeili = kitBinaryPaths().meili;
    const meiliBin =
      config.meiliBinary !== undefined
        ? config.meiliBinary
        : process.env.MEILI_BINARY ||
          kitMeili ||
          path.join(config.appRoot, "resources", "meili");
    const meiliBoot = await maybeBootBrandMeili({
      binaryPath:
        meiliBin && fs.existsSync(meiliBin) ? meiliBin : null,
      dataDir: path.join(dataDir, "meili"),
      userDataDir: dataDir,
      dbPath: runtime.getBrand().path,
      feed: config.meiliFeed,
      index: config.skipIndex !== true && process.env.MEILI_SKIP_INDEX !== "1",
    });
    searchEngine = meiliBoot.engine;
    if (meiliBoot.meili) {
      meiliStop = () => meiliBoot.meili?.stop();
    }
  }

  const mcp = createMcpFacade({
    brandId: config.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => {
      const brandTools = config.discoverModuleTools
        ? await config.discoverModuleTools(api)
        : [];
      return { module: brandTools, plugin: [] };
    },
  });
  mcp.registerTool({
    name: "module.platform.list_mounts",
    description: "Liste mounts API",
    space: "module",
    ownerId: "platform",
    handler: async () => ({
      ok: true,
      content: { mounts: api.listMounts() },
    }),
  });
  if (brandOs) {
    mcp.registerTool({
      name: "module.os.status",
      description: "Statut OS hosts",
      space: "module",
      ownerId: "os",
      handler: async () => ({ ok: true, content: brandOs!.status() }),
    });
  }

  // Surface MCP locale AVANT listen — évite course status=null au premier GET.
  if (
    brandOs &&
    desktopProfile === "full" &&
    process.env.CREEZIO_TUNNEL_LOCAL !== "0" &&
    port &&
    port > 0
  ) {
    const tunnel = brandOs.hostRuntime.tunnelService() as unknown as {
      enableLocalPublicSurface: (o: {
        localPort: number;
        slug?: string;
      }) => { publicMcp: string };
    };
    const local = tunnel.enableLocalPublicSurface({
      localPort: port,
      slug: config.brandId,
    });
    console.log(`brand-kernel-harness tunnel local mcp=${local.publicMcp}`);
  }

  let mcpSurface: ReturnType<typeof mountBrandMcpSurface> | null = null;
  const httpServer =
    desktopProfile === "full"
      ? await listenBrandOsHttp({
          api,
          mcp,
          os: brandOs,
          ...(port && port > 0 ? { port } : {}),
          mcpSurfaceFetch: async (request) => {
            if (!mcpSurface) {
              return new Response(JSON.stringify({ error: "mcp_surface_pending" }), {
                status: 503,
                headers: { "content-type": "application/json" },
              });
            }
            return mcpSurface.app.fetch(request);
          },
          mcpSurfaceHandlesPath,
        })
      : await listenBrandKernelHttp({
          api,
          ...(port && port > 0 ? { port } : {}),
        });
  process.env.METIER_BASE_URL = httpServer.baseUrl;
  process.env.MCP_PUBLIC_URL = httpServer.baseUrl;
  process.env.APP_PUBLIC_URL = httpServer.baseUrl;

  if (brandOs && desktopProfile === "full" && config.manifest) {
    mcpSurface = mountBrandMcpSurface({
      manifest: config.manifest,
      runtime,
      os: brandOs,
      mcp,
      publicBaseUrl: () => httpServer.baseUrl,
    });
    console.log(
      `brand-kernel-harness mcp-oauth ready=${mcpSurface.oauthReady()} public=${mcpSurface.publicUrl()}`,
    );
  }

  // Si port auto-assigné : brancher la surface locale après coup.
  if (
    brandOs &&
    desktopProfile === "full" &&
    process.env.CREEZIO_TUNNEL_LOCAL !== "0" &&
    !(port && port > 0)
  ) {
    const tunnel = brandOs.hostRuntime.tunnelService() as unknown as {
      enableLocalPublicSurface: (o: {
        localPort: number;
        slug?: string;
      }) => { publicMcp: string };
    };
    tunnel.enableLocalPublicSurface({
      localPort: httpServer.port,
      slug: config.brandId,
    });
  }

  console.log(
    `brand-kernel-harness ${config.brandId} on ${httpServer.baseUrl} data=${dataDir} search=${searchEngine} os=${desktopProfile}`,
  );

  // Fullstack OS ready : ensure/start natifs depuis le kit (pas la marque).
  // CREEZIO_NATIVE_WARM=0 pour skip (smokes rapides) ; défaut = warm n8n.
  // Hermes : aligné desktop — on sauf CREEZIO_NATIVE_WARM_HERMES=0.
  if (
    brandOs &&
    desktopProfile === "full" &&
    process.env.CREEZIO_NATIVE_WARM !== "0"
  ) {
    const warmHermes = process.env.CREEZIO_NATIVE_WARM_HERMES !== "0";
    const warm = await warmBrandNativeHosts(brandOs, {
      start: process.env.CREEZIO_NATIVE_START !== "0",
      n8n: true,
      hermes: warmHermes,
    });
    console.log(
      `brand-kernel-harness native warm n8n=${JSON.stringify(warm.n8n)} hermes=${JSON.stringify(warm.hermes)}`,
    );
  }

  const close = async () => {
    meiliStop?.();
    await httpServer.close();
    brandOs?.close();
    closeKernel();
  };

  const shutdown = () => {
    void close().finally(() => process.exit(0));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  return {
    baseUrl: httpServer.baseUrl,
    port: httpServer.port,
    dataDir,
    searchEngine,
    desktopProfile,
    api,
    runtime,
    close,
  };
}
