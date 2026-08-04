/**
 * Harness Node — même façade HTTP + Meili + OS que le desktop, sans Electron.
 *
 * Boot serveur observable (parité splash desktop) :
 *   - early-listen : `GET /api/v1/os/boot-status` répond dès le début du boot
 *   - une ligne JSONL par transition d'étape (docker logs)
 *   - journal ops `{dataDir}/ops/*.jsonl` (@creezio/observability)
 *   - UI Next standalone servie derrière le port unique (CRM navigateur)
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
import {
  brandKernelBooter,
  type BrandKernelBoot,
} from "./create-brand-kernel.js";
import { composeBrandOs } from "./compose-brand-os.js";
import { createBootProgressReporter } from "./boot-progress.js";
import {
  listenBrandBootHttp,
  type BrandBootHttpHandle,
} from "./listen-brand-boot-http.js";
import { listenBrandOsHttp } from "./listen-brand-os-http.js";
import {
  mcpSurfaceHandlesPath,
  mountBrandMcpSurface,
} from "./mount-brand-mcp-surface.js";
import {
  hasBrandUiPlane,
  startBrandUiPlane,
  type BrandUiPlaneHandle,
} from "./start-brand-ui-plane.js";
import { warmBrandNativeHosts } from "./warm-brand-native-hosts.js";
import {
  mountBrandPlatformSurface,
  platformSurfaceHandlesPath,
  type BrandPlatformSurface,
} from "./mount-brand-platform-surface.js";
import {
  browserSidecarRequested,
  startBrandBrowserSidecar,
  type BrandBrowserSidecarHandle,
} from "./wire-brand-browser-sidecar.js";
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

function readAppVersion(appRoot: string): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(appRoot, "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
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
  const warmNative =
    desktopProfile === "full" && process.env.CREEZIO_NATIVE_WARM !== "0";

  const boot = createBootProgressReporter({
    brandId: config.brandId,
    dataDir,
    appVersion: readAppVersion(config.appRoot),
    warmNative,
    needIndex:
      Boolean(config.meiliFeed) &&
      config.skipIndex !== true &&
      process.env.MEILI_SKIP_INDEX !== "1",
  });

  // Early-listen : boot-status disponible dès maintenant sur le port final
  // (Docker/headless — port fixe requis). Handoff plus bas sans coupure.
  let early: BrandBootHttpHandle | null = null;
  if (
    desktopProfile === "full" &&
    port &&
    port > 0 &&
    process.env.CREEZIO_BOOT_HTTP !== "0"
  ) {
    try {
      early = await listenBrandBootHttp({
        brandId: config.brandId,
        port,
        getBootStatus: () => boot.model(),
      });
      console.log(
        `brand-kernel-harness boot-status early sur :${port}/api/v1/os/boot-status`,
      );
    } catch (err) {
      console.warn(
        `[creezio-os] early-listen indisponible: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // P&P : binaires kit (Meili/cloudflared) avant Meili/tunnel — jamais dans la marque.
  if (process.env.CREEZIO_SKIP_KIT_BINARIES !== "1") {
    const bins = await ensureKitOsBinaries();
    if (!bins.ok) {
      console.warn(
        `[creezio-os] harness binaires kit incomplets: ${bins.errors.join("; ") || "meili/cloudflared manquants"}`,
      );
    }
  }

  // Catalogue marque (opt-in env côté marque) — parité boot desktop.
  if (config.catalogHost && desktopProfile === "full") {
    boot.go("catalog", { detail: "Vérification du catalogue…" });
    try {
      const state = await config.catalogHost.ensureCatalogPresent((p) => {
        boot.patch("catalog", {
          detail: p.detail || p.phase,
          percent: p.percent,
        });
      });
      boot.done("catalog", `Catalogue ${state}`);
    } catch (err) {
      boot.error(
        "catalog",
        err instanceof Error ? err.message : String(err),
      );
    }
  } else {
    boot.skip("catalog");
  }

  boot.go("migrations", { detail: "Migrations SQLite…" });
  const bootKernel = resolveBootKernel(config);
  const kernelBoot = bootKernel({
    userDataDir: dataDir,
  }) as BrandKernelBoot;
  const { api, runtime, close: closeKernel, mails } = kernelBoot;
  // Inbox Hono + getKitMailsStore (bindings marque / SMTP) partagent core.db.
  process.env.CREEZIO_CORE_DB_PATH = runtime.paths.core;
  boot.done("migrations", "Base de données prête");

  // OS marque AVANT la surface plateforme : composeBrandOs garantit un
  // AUTH_SECRET unique/persistant (process.env) — les routes auth/tasks/
  // assistant ne doivent jamais signer avec le fallback dev.
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

  // Surface plateforme auth/tasks/assistant (Hono) sur le port unique.
  // baseUrl résolue paresseusement (le listen arrive plus bas).
  let advertisedBaseUrl = "";
  let platformSurface: BrandPlatformSurface | null = null;
  if (desktopProfile === "full") {
    platformSurface = mountBrandPlatformSurface({
      brandId: config.brandId,
      coreDbPath: runtime.paths.core,
      baseUrl: () => advertisedBaseUrl || `http://127.0.0.1:${port || 0}`,
    });
  }

  let searchEngine: BrandKernelHarnessHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    const doIndex =
      config.skipIndex !== true && process.env.MEILI_SKIP_INDEX !== "1";
    boot.go("meili", { detail: "Démarrage Meilisearch…" });
    const kitMeili = kitBinaryPaths().meili;
    const meiliBin =
      config.meiliBinary !== undefined
        ? config.meiliBinary
        : process.env.MEILI_BINARY ||
          kitMeili ||
          path.join(config.appRoot, "resources", "meili");
    if (doIndex) {
      boot.go("index", {
        detail: "Indexation des données…",
        parallel: true,
      });
    }
    const meiliBoot = await maybeBootBrandMeili({
      binaryPath:
        meiliBin && fs.existsSync(meiliBin) ? meiliBin : null,
      dataDir: path.join(dataDir, "meili"),
      userDataDir: dataDir,
      dbPath: runtime.getBrand().path,
      feed: config.meiliFeed,
      index: doIndex,
    });
    searchEngine = meiliBoot.engine;
    if (meiliBoot.meili) {
      meiliStop = () => meiliBoot.meili?.stop();
    }
    if (meiliBoot.engine === "meili") {
      boot.done("meili", "Meilisearch prêt");
      if (doIndex) boot.done("index", "Index prêt");
    } else {
      boot.patch("meili", {
        status: meiliBoot.engine === "sql-fallback" ? "error" : "skip",
        detail:
          meiliBoot.engine === "sql-fallback"
            ? "Binaire Meili indisponible — recherche SQL (dégradée)"
            : "Recherche désactivée",
      });
      if (doIndex) boot.skip("index", "Meili indisponible");
    }
  } else {
    boot.skip("meili", "Pas de feed Meili");
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

  // UI plane Next standalone : proxy activé si le build existe.
  let uiPlane: BrandUiPlaneHandle | null = null;
  const uiAvailable =
    desktopProfile === "full" && hasBrandUiPlane(config.appRoot);

  boot.go("next", { detail: "Serveur HTTP…" });
  let mcpSurface: ReturnType<typeof mountBrandMcpSurface> | null = null;
  if (desktopProfile !== "full" && early) {
    // Profil lite : pas de handoff — libérer le port avant listen kernel.
    await early.close();
    early = null;
  }
  const httpServer =
    desktopProfile === "full"
      ? await listenBrandOsHttp({
          api,
          mcp,
          os: brandOs,
          ...(port && port > 0 ? { port } : {}),
          ...(early ? { existingServer: early.server } : {}),
          getMailsStore: () => mails ?? null,
          getBootStatus: () => boot.model(),
          ...(uiAvailable
            ? { uiProxyTarget: () => uiPlane?.baseUrl ?? null }
            : {}),
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
          ...(platformSurface
            ? {
                platformSurfaceFetch: async (request: Request) =>
                  platformSurface!.app.fetch(request),
                platformSurfaceHandlesPath,
              }
            : {}),
        })
      : await listenBrandKernelHttp({
          api,
          ...(port && port > 0 ? { port } : {}),
        });
  process.env.METIER_BASE_URL = httpServer.baseUrl;
  process.env.MCP_PUBLIC_URL = httpServer.baseUrl;
  process.env.APP_PUBLIC_URL = httpServer.baseUrl;
  advertisedBaseUrl = httpServer.baseUrl;

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

  // CRM navigateur : UI Next standalone derrière le port unique.
  if (uiAvailable) {
    boot.patch("next", { detail: "Démarrage UI Next (CRM)…" });
    uiPlane = await startBrandUiPlane({
      appRoot: config.appRoot,
      metierBaseUrl: httpServer.baseUrl,
    });
    if (uiPlane.kind === "next") {
      boot.done("next", `CRM web prêt (${httpServer.baseUrl}/)`);
    } else {
      boot.patch("next", {
        status: "error",
        detail: "UI Next standalone indisponible — API seule",
      });
    }
  } else {
    boot.done("next", `API prête (${httpServer.baseUrl})`);
  }

  console.log(
    `brand-kernel-harness ${config.brandId} on ${httpServer.baseUrl} data=${dataDir} search=${searchEngine} os=${desktopProfile} ui=${uiPlane?.kind ?? "none"}`,
  );

  boot.go("login", { detail: "Interface disponible" });
  boot.done("login", "Interface disponible");

  // Sidecar navigateur IA (variant Docker --browser : CREEZIO_BROWSER_SIDECAR=1).
  let browserSidecar: BrandBrowserSidecarHandle | null = null;
  if (platformSurface && browserSidecarRequested()) {
    boot.register("browser", "Navigateur IA");
    boot.go("browser", { detail: "Démarrage Chromium sidecar…" });
    try {
      browserSidecar = await startBrandBrowserSidecar({
        dataDir,
        sessionCookieName: platformSurface.runtime.sessionCookieName,
        baseUrl: () => httpServer.baseUrl,
        store: platformSurface.runtime.store,
        onLog: (line) => console.log(`[browser-sidecar] ${line}`),
      });
      platformSurface.attachSidecar(browserSidecar);
      boot.done(
        "browser",
        `Chromium prêt (${browserSidecar.display ? `display ${browserSidecar.display}` : "headless"})`,
      );
    } catch (err) {
      boot.error(
        "browser",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // Fullstack OS ready : ensure/start natifs depuis le kit (pas la marque).
  // CREEZIO_NATIVE_WARM=0 pour skip (défaut image Docker) ; =1 → n8n/Hermes
  // dans le même container, visibles dans boot-status.
  if (brandOs && warmNative) {
    const warmHermes = process.env.CREEZIO_NATIVE_WARM_HERMES !== "0";
    boot.go("n8n", { detail: "Warm n8n…", parallel: true });
    if (warmHermes) {
      boot.go("hermes", { detail: "Warm Hermes…", parallel: true });
    }
    const warm = await warmBrandNativeHosts(brandOs, {
      start: process.env.CREEZIO_NATIVE_START !== "0",
      n8n: true,
      hermes: warmHermes,
    });
    boot.patch("n8n", {
      status: warm.n8n.started ? "done" : "error",
      detail:
        warm.n8n.detail ||
        (warm.n8n.started ? "n8n démarré" : "n8n indisponible"),
      percent: 100,
    });
    if (warmHermes) {
      boot.patch("hermes", {
        status: warm.hermes.started ? "done" : "error",
        detail:
          warm.hermes.detail ||
          (warm.hermes.started ? "Hermes démarré" : "Hermes indisponible"),
        percent: 100,
      });
    }
    console.log(
      `brand-kernel-harness native warm n8n=${JSON.stringify(warm.n8n)} hermes=${JSON.stringify(warm.hermes)}`,
    );
  }

  boot.complete(`Serveur ${config.brandId} prêt`);

  const close = async () => {
    meiliStop?.();
    await browserSidecar?.close();
    platformSurface?.close();
    await uiPlane?.close();
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
