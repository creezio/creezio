/**
 * Host plugins runtime — découverte + spawn sidecars (noyau platform).
 *
 * Product Hub (lifecycle, grants, control plane, ACL contrats) →
 * `@creezio/product-hub` + `startHostPluginControlPlane` (Phase E).
 *
 * Vertical restant (apps marques) :
 * - migrations SQL plugin-data (better-sqlite3 sous-process Next ABI)
 * - scaffolds UI métier Hermes / git versions riches
 *
 * Port du contrat TF2 plugin-runtime + plugin-launcher (spawn minimal).
 */

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  discoverPlugins,
  findFreePort,
  pluginsRootDir,
  setPluginEnabled,
  writePluginRuntimeState,
  type DiscoveredPlugin,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog } from "../context.js";
import {
  buildIsolatedNodeEnv,
  resolveDesktopNodeBinary,
} from "../node-runtime.js";
import { ensurePluginControlToken } from "./control-token.js";

export type RunningPlugin = {
  id: string;
  dir: string;
  port: number | null;
  child: ChildProcess;
  stop: () => void;
};

export type PluginsHost = {
  listPlugins: () => DiscoveredPlugin[];
  startEnabledPlugins: (opts?: {
    crmPort?: number | null;
  }) => Promise<RunningPlugin[]>;
  stopAllPlugins: () => void;
  enablePlugin: (id: string, enabled: boolean) => DiscoveredPlugin | null;
  getRunningPlugins: () => Array<{
    id: string;
    port: number | null;
    pid: number | undefined;
  }>;
  pluginsStatusPayload: () => {
    plugins: DiscoveredPlugin[];
    running: Array<{ id: string; port: number | null }>;
  };
  getPluginLogs: () => string[];
};

export function createPluginsHost(opts: {
  ctx: HostRuntimeContext;
}): PluginsHost {
  const { ctx } = opts;
  const root = () => pluginsRootDir(ctx.userDataDir);
  const running = new Map<string, RunningPlugin>();
  const logs: string[] = [];
  const push = (line: string) => {
    logs.push(line);
    if (logs.length > 300) logs.shift();
    hostLog(ctx, "plugins", line);
  };

  function listPlugins(): DiscoveredPlugin[] {
    return discoverPlugins(root());
  }

  function stopAllPlugins(): void {
    for (const p of running.values()) {
      try {
        p.stop();
      } catch {
        /* */
      }
    }
    running.clear();
    writePluginRuntimeState(root(), []);
  }

  function enablePlugin(
    id: string,
    enabled: boolean,
  ): DiscoveredPlugin | null {
    const found = listPlugins().find((p) => p.manifest.id === id);
    if (!found) return null;
    setPluginEnabled(found.dir, enabled);
    return listPlugins().find((p) => p.manifest.id === id) || null;
  }

  async function startEnabledPlugins(startOpts?: {
    crmPort?: number | null;
  }): Promise<RunningPlugin[]> {
    ensurePluginControlToken(ctx);
    const node = resolveDesktopNodeBinary(ctx);
    const started: RunningPlugin[] = [];
    const runtimeEntries: Array<{
      id: string;
      port: number | null;
      hooks: string[];
      permissions: string[];
      panel: boolean;
    }> = [];

    for (const plugin of listPlugins().filter((p) => p.enabled && !p.error)) {
      if (running.has(plugin.manifest.id)) {
        started.push(running.get(plugin.manifest.id)!);
        continue;
      }
      const entry = path.join(plugin.dir, plugin.manifest.main);
      if (!fs.existsSync(entry)) {
        push(`${plugin.manifest.id}: entry manquant ${entry}`);
        continue;
      }
      let port: number | null = plugin.manifest.port ?? null;
      if (port == null && plugin.manifest.panel) {
        port = await findFreePort();
      }
      const env = buildIsolatedNodeEnv({
        nodeBin: node,
        baseEnv: {
          ...process.env,
          PLUGIN_ID: plugin.manifest.id,
          PLUGIN_DIR: plugin.dir,
          ...(port ? { PORT: String(port) } : {}),
          ...(startOpts?.crmPort
            ? { CRM_PORT: String(startOpts.crmPort) }
            : {}),
        },
        sandbox: {
          profileHome: path.join(plugin.dir, "home"),
          userData: ctx.userDataDir,
        },
      });
      push(`spawn plugin ${plugin.manifest.id}`);
      const child = spawn(node, [entry], {
        cwd: plugin.dir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      child.stdout?.on("data", (d: Buffer) =>
        d
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((l) => push(`[${plugin.manifest.id}] ${l}`)),
      );
      const handle: RunningPlugin = {
        id: plugin.manifest.id,
        dir: plugin.dir,
        port,
        child,
        stop: () => {
          try {
            child.kill();
          } catch {
            /* */
          }
        },
      };
      running.set(plugin.manifest.id, handle);
      started.push(handle);
      runtimeEntries.push({
        id: plugin.manifest.id,
        port,
        hooks: plugin.manifest.hooks || [],
        permissions: plugin.manifest.permissions || [],
        panel: Boolean(plugin.manifest.panel),
      });
      child.on("exit", () => {
        running.delete(plugin.manifest.id);
      });
    }
    writePluginRuntimeState(root(), runtimeEntries);
    return started;
  }

  return {
    listPlugins,
    startEnabledPlugins,
    stopAllPlugins,
    enablePlugin,
    getRunningPlugins: () =>
      [...running.values()].map((p) => ({
        id: p.id,
        port: p.port,
        pid: p.child.pid,
      })),
    pluginsStatusPayload: () => ({
      plugins: listPlugins(),
      running: [...running.values()].map((p) => ({
        id: p.id,
        port: p.port,
      })),
    }),
    getPluginLogs: () => [...logs],
  };
}

/**
 * Vertical documenté après Phase E (reste app marque) :
 * - plugin-git / versions / restore (hors scaffold stub kit)
 * - plugin-data migrations better-sqlite3
 * - plugin-accept-check / test-runner
 * - plugin-crm-key
 * Control plane générique + Product Hub → @creezio/product-hub.
 */
export const PLUGIN_VERTICAL_REMAINING = [
  "plugin-git",
  "plugin-data",
  "plugin-accept-check",
  "plugin-test-runner",
  "plugin-crm-key",
] as const;
