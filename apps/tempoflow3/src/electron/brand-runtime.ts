/**
 * Runtime marque natif — SQLite + api-kernel (OS creezio).
 * Utilisé par Electron main ET par le harness Node (smokes).
 */
import {
  createSqliteRuntime,
  platformCoreMigrations,
  type SqliteRuntime,
  type PathsContext,
} from "@creezio/platform-core";
import { createApiKernel, type ApiKernel } from "@creezio/api-kernel";
import { tempoflow3Manifest as manifest } from "./app-manifest.js";
import { brandMigrations } from "./brand-migrations.js";
import { registerBrandModuleApi } from "./brand-module-api.js";

export type BrandKernelBoot = {
  api: ApiKernel;
  runtime: SqliteRuntime;
  paths: PathsContext;
  close: () => void;
};

export function bootBrandKernel(opts: {
  userDataDir: string;
  isPackaged?: boolean;
}): BrandKernelBoot {
  const paths: PathsContext = {
    manifest,
    userDataRoot: opts.userDataDir,
    isPackaged: Boolean(opts.isPackaged),
    resourcesRoot: opts.userDataDir,
  };
  const runtime = createSqliteRuntime({
    ctx: paths,
    coreMigrations: platformCoreMigrations(),
    brandMigrations: brandMigrations(),
    touchBrand: true,
  });
  const api = createApiKernel({
    brandId: manifest.brandId,
    sqliteRuntime: runtime,
  });
  registerBrandModuleApi(api);
  return {
    api,
    runtime,
    paths,
    close: () => runtime.close(),
  };
}
