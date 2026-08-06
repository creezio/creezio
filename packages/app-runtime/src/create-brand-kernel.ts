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
import {
  createApiKernel,
  type ApiKernel,
  type ApiRequest,
} from "@creezio/api-kernel";
import type { AppManifest } from "@creezio/brand-config";
import {
  PLUGIN_ACL_ORG_HEADER,
  PLUGIN_ACL_OWNER_HEADER,
  PLUGIN_ACL_USER_HEADER,
  createSqliteProductHubStore,
  decidePluginAccess,
  resolvePluginAclActorFromHeaders,
  type SqliteProductHubStore,
} from "@creezio/product-hub";
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
import {
  SUPPORT_CORE_SQL,
  createSupportServerMount,
} from "@creezio/support";
import { INTEGRATIONS_CORE_SQL } from "@creezio/integrations";
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
    { id: "app_runtime_004_support", sql: SUPPORT_CORE_SQL },
    { id: "app_runtime_005_integrations", sql: INTEGRATIONS_CORE_SQL },
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
  // Support natif : tickets du détenteur du serveur, pull par l'admin marque.
  api.registerPlatformApi("platform-support", createSupportServerMount());

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

  // ACL plugins Product Hub (P3 plugins natifs) — store lazy sur core.db
  // (tables déjà posées par platformCoreMigrations h3/i10).
  let productHub: SqliteProductHubStore | null = null;
  const getProductHub = (): SqliteProductHubStore => {
    if (!productHub) {
      productHub = createSqliteProductHubStore({
        coreDbPath: runtime.paths.core,
      });
    }
    return productHub;
  };

  // Même décision que MCP / control-plane (decidePluginAccess H5).
  // Compat H2 : appel local sans headers actor = service (owner-level).
  function authorizePluginAccess(accessCtx: {
    pluginId: string;
    method: string;
    subPath: string;
    req: ApiRequest;
  }) {
    const headers = accessCtx.req.headers || {};
    const hasActorHint = Boolean(
      headers[PLUGIN_ACL_ORG_HEADER] ||
        headers[PLUGIN_ACL_USER_HEADER] ||
        headers[PLUGIN_ACL_OWNER_HEADER],
    );
    if (!hasActorHint) return { allow: true as const };
    const actor = resolvePluginAclActorFromHeaders(headers);
    const method = accessCtx.method.toUpperCase();
    const action =
      method === "GET" || method === "HEAD"
        ? ("see" as const)
        : ("execute" as const);
    return decidePluginAccess(
      getProductHub().getAclPolicy(accessCtx.pluginId),
      actor,
      action,
    );
  }

  const api = createApiKernel({
    brandId: opts.manifest.brandId,
    sqliteRuntime: runtime,
    authorizePluginAccess,
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
    // ACL plugins (façade MCP harness/desktop) — lazy, même core.db.
    getPluginAclPolicy: (pluginId: string) =>
      getProductHub().getAclPolicy(pluginId),
    close: () => {
      platform.tasks?.close();
      platform.mails?.close();
      platform.assistant?.close();
      productHub?.close();
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
