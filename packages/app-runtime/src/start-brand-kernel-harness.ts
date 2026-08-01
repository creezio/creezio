/**
 * Harness Node — même façade HTTP + Meili que le desktop, sans Electron.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  listenBrandKernelHttp,
  maybeBootBrandMeili,
} from "@creezio/electron-shell";
import { brandKernelBooter } from "./create-brand-kernel.js";
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

  const bootKernel = resolveBootKernel(config);
  const { api, runtime, close: closeKernel } = bootKernel({
    userDataDir: dataDir,
  });

  let searchEngine: BrandKernelHarnessHandle["searchEngine"] = "off";
  let meiliStop: (() => void) | null = null;

  if (config.meiliFeed) {
    const meiliBin =
      config.meiliBinary !== undefined
        ? config.meiliBinary
        : process.env.MEILI_BINARY ||
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

  const httpServer = await listenBrandKernelHttp({
    api,
    ...(port && port > 0 ? { port } : {}),
  });
  process.env.METIER_BASE_URL = httpServer.baseUrl;

  console.log(
    `brand-kernel-harness ${config.brandId} on ${httpServer.baseUrl} data=${dataDir} search=${searchEngine}`,
  );

  const close = async () => {
    meiliStop?.();
    await httpServer.close();
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
    api,
    runtime,
    close,
  };
}
