/**
 * Boot kernel marque — SQLite + api-kernel (OS).
 * La marque fournit migrations + registerModuleApi ; le kit monte
 * les surfaces natives (tasks, mails, assistant schema).
 */
import path from "node:path";
import fs from "node:fs";
import {
  createSqliteRuntime,
  platformCoreMigrations,
  type PathsContext,
  type SqliteMigration,
  type SqliteRuntime,
} from "@creezio/platform-core";
import { createApiKernel, type ApiKernel } from "@creezio/api-kernel";
import type { AppManifest } from "@creezio/brand-config";
import {
  ASSISTANT_CORE_SQL,
  createSqliteAssistantStore,
  type SqliteAssistantStore,
} from "@creezio/assistant";
import {
  PLATFORM_TASKS_CORE_SQL,
  createSqliteTasksStore,
  createTasksApiMount,
  type SqliteTasksStore,
} from "@creezio/tasks";
import {
  FILE_SINK_PROVIDER_ID,
  PLATFORM_MAILS_CORE_SQL,
  createFileSinkMailProvider,
  createMailsApiMount,
  createSqliteMailsStore,
  type SqliteMailsStore,
} from "@creezio/mails";
import type { BrandKernelHandle } from "./types.js";

export type CreateBrandKernelOptions = {
  manifest: AppManifest;
  userDataDir: string;
  isPackaged?: boolean;
  brandMigrations: readonly SqliteMigration[];
  registerModuleApi: (api: ApiKernel) => void;
  /** Ex. applyBrandMeiliConfig — avant open DB. */
  beforeBoot?: () => void;
  /**
   * Monter tasks/mails/assistant natifs (défaut true).
   * Désactiver uniquement pour tests isolation schéma cœur.
   */
  enablePlatformServices?: boolean;
};

export type BrandKernelBoot = BrandKernelHandle & {
  paths: PathsContext;
  tasks?: SqliteTasksStore;
  mails?: SqliteMailsStore;
  assistant?: SqliteAssistantStore;
};

function platformExtras(): SqliteMigration[] {
  return [
    { id: "app_runtime_001_assistant", sql: ASSISTANT_CORE_SQL },
    { id: "app_runtime_002_tasks", sql: PLATFORM_TASKS_CORE_SQL },
    { id: "app_runtime_003_mails", sql: PLATFORM_MAILS_CORE_SQL },
  ];
}

function mountPlatformServices(
  api: ApiKernel,
  runtime: SqliteRuntime,
  userDataDir: string,
): Pick<BrandKernelBoot, "tasks" | "mails" | "assistant"> {
  const coreDbPath = runtime.paths.core;
  const assistant = createSqliteAssistantStore({ coreDbPath });
  const tasks = createSqliteTasksStore({ coreDbPath });
  const mailOutDir = path.join(userDataDir, "mail-outbox");
  fs.mkdirSync(mailOutDir, { recursive: true });
  const mails = createSqliteMailsStore({
    coreDbPath,
    defaultProviderId: FILE_SINK_PROVIDER_ID,
  });
  mails.registerProvider(createFileSinkMailProvider({ outDir: mailOutDir }));

  api.registerPlatformApi("platform-tasks", createTasksApiMount(tasks));
  api.registerPlatformApi("platform-mails", createMailsApiMount(mails));

  return { tasks, mails, assistant };
}

export function createBrandKernel(
  opts: CreateBrandKernelOptions,
): BrandKernelBoot {
  opts.beforeBoot?.();
  const enablePlatform = opts.enablePlatformServices !== false;
  const paths: PathsContext = {
    manifest: opts.manifest,
    userDataRoot: opts.userDataDir,
    isPackaged: Boolean(opts.isPackaged),
    resourcesRoot: opts.userDataDir,
  };
  const runtime = createSqliteRuntime({
    ctx: paths,
    coreMigrations: platformCoreMigrations({
      extras: enablePlatform ? platformExtras() : [],
    }),
    brandMigrations: opts.brandMigrations,
    touchBrand: true,
  });
  // Version embarquée par l'image Docker versionnée (publish --tag X) —
  // /api/v1/core/version est la SoT de comparaison pour l'update de flotte.
  const appVersion = (process.env.CREEZIO_APP_VERSION || "").trim();
  const api = createApiKernel({
    brandId: opts.manifest.brandId,
    sqliteRuntime: runtime,
    ...(appVersion ? { appVersion } : {}),
  });

  let platform: Pick<BrandKernelBoot, "tasks" | "mails" | "assistant"> = {};
  if (enablePlatform) {
    platform = mountPlatformServices(api, runtime, opts.userDataDir);
  }

  opts.registerModuleApi(api);

  return {
    api,
    runtime,
    paths,
    ...platform,
    close: () => {
      platform.tasks?.close();
      platform.mails?.close();
      platform.assistant?.close();
      runtime.close();
    },
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
