/**
 * Boot kernel marque — SQLite + api-kernel (OS).
 * La marque fournit migrations + registerModuleApi ; le reste est kit.
 */
import {
  createSqliteRuntime,
  platformCoreMigrations,
  type PathsContext,
  type SqliteMigration,
  type SqliteRuntime,
} from "@creezio/platform-core";
import { createApiKernel, type ApiKernel } from "@creezio/api-kernel";
import type { AppManifest } from "@creezio/brand-config";
import type { BrandKernelHandle } from "./types.js";

export type CreateBrandKernelOptions = {
  manifest: AppManifest;
  userDataDir: string;
  isPackaged?: boolean;
  brandMigrations: readonly SqliteMigration[];
  registerModuleApi: (api: ApiKernel) => void;
  /** Ex. applyBrandMeiliConfig — avant open DB. */
  beforeBoot?: () => void;
};

export type BrandKernelBoot = BrandKernelHandle & {
  paths: PathsContext;
};

export function createBrandKernel(
  opts: CreateBrandKernelOptions,
): BrandKernelBoot {
  opts.beforeBoot?.();
  const paths: PathsContext = {
    manifest: opts.manifest,
    userDataRoot: opts.userDataDir,
    isPackaged: Boolean(opts.isPackaged),
    resourcesRoot: opts.userDataDir,
  };
  const runtime = createSqliteRuntime({
    ctx: paths,
    coreMigrations: platformCoreMigrations(),
    brandMigrations: opts.brandMigrations,
    touchBrand: true,
  });
  const api = createApiKernel({
    brandId: opts.manifest.brandId,
    sqliteRuntime: runtime,
  });
  opts.registerModuleApi(api);
  return {
    api,
    runtime,
    paths,
    close: () => runtime.close(),
  };
}

/** Adaptateur pour startBrandDesktop / harness (signature bootKernel). */
export function brandKernelBooter(
  opts: Omit<CreateBrandKernelOptions, "userDataDir" | "isPackaged">,
): (boot: { userDataDir: string; isPackaged?: boolean }) => BrandKernelHandle {
  return (boot) =>
    createBrandKernel({
      ...opts,
      userDataDir: boot.userDataDir,
      isPackaged: boot.isPackaged,
    });
}
