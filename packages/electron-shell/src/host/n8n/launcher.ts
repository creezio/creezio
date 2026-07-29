/**
 * Sidecar n8n — factory brand-agnostic (TF2 n8n-launcher, noyau spawn/status).
 * Auth owner silencieuse + cookie session restent branchables via hooks.
 */

import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  buildN8nSpawnEnv,
  buildNextN8nEnv,
  describeN8nSpawnKind,
  findFreePort,
  N8N_DESKTOP_PORT,
  n8nHomeLooksWarm as n8nHomeLooksWarmPure,
  n8nPublicStatus,
  normalizeN8nPublicBaseUrl,
  resolveN8nEntry,
  sanitizeN8nEmbedConfig,
  shouldSpawnEmbeddedN8n,
  type N8nEmbedConfig,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog, hostProductName } from "../context.js";
import type { LocalConfigStore } from "../local-config.js";
import {
  buildIsolatedNodeEnv,
  DESKTOP_NODE_MIN_FOR_EMBEDS,
  ensureDesktopNode,
  resolveDesktopNodeBinary,
} from "../node-runtime.js";
import {
  ensureN8nRuntime,
  getN8nBootstrapError,
  getN8nBootstrapPhase,
  n8nEntryPath,
  n8nRuntimeCacheDir,
  type N8nBootstrapPhase,
} from "./runtime-bootstrap.js";

export type RunningN8n = {
  uiUrl: string;
  homeDir: string;
  publicBaseUrl: string;
  child: ChildProcess;
  stop: () => void;
};

export type StartN8nOptions = {
  publicBaseUrl?: string | null;
  onLog?: (line: string) => void;
};

export type N8nHost = {
  startN8n: (
    connectionMode: "local" | "remote",
    opts?: StartN8nOptions,
  ) => Promise<RunningN8n | null>;
  stopN8n: () => void;
  getRunningN8n: () => RunningN8n | null;
  getN8nStatusPayload: (
    connectionMode: "local" | "remote",
    remoteCrmOrigin?: string | null,
  ) => Record<string, unknown>;
  getN8nNextEnv: (connectionMode: "local" | "remote") => Record<string, string>;
  getN8nLogs: () => string[];
  ensureN8nRuntimeFromUi: () => Promise<{
    ok: boolean;
    detail: string;
    phase: N8nBootstrapPhase;
  }>;
  findN8nEntry: () => string | null;
  applyN8nPublicBaseUrl: (opts: {
    publicBaseUrl: string | null;
  }) => Promise<void>;
  n8nHomeLooksWarm: () => boolean;
  getN8nLastStartPath: () => "bootstrap" | "reuse" | null;
  __resetForTests: () => void;
};

function ensureEncryptionKey(homeDir: string): string {
  const keyFile = path.join(homeDir, ".desktop-n8n-encryption-key");
  try {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (existing.length >= 16) return existing;
  } catch {
    /* */
  }
  const key = crypto.randomBytes(24).toString("hex");
  fs.mkdirSync(homeDir, { recursive: true });
  fs.writeFileSync(keyFile, key, { mode: 0o600 });
  return key;
}

function waitN8nHealth(uiUrl: string, timeoutMs: number): Promise<void> {
  const health = `${uiUrl.replace(/\/$/, "")}/healthz`;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(health, (res) => {
        res.resume();
        if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 500) {
          resolve();
          return;
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`timeout n8n health ${health}`));
          return;
        }
        setTimeout(tick, 500);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`timeout n8n health ${health}`));
          return;
        }
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

export function createN8nHost(opts: {
  ctx: HostRuntimeContext;
  store: LocalConfigStore;
}): N8nHost {
  const { ctx, store } = opts;
  const homeDir = path.join(ctx.userDataDir, "n8n-home");

  type State = {
    running: RunningN8n | null;
    lastError: string | null;
    version: string | null;
    logs: string[];
    entryPath: string | null;
    installing: boolean;
    lastStartPath: "bootstrap" | "reuse" | null;
    lastPublicBaseUrl: string | null;
  };

  const state: State = {
    running: null,
    lastError: null,
    version: null,
    logs: [],
    entryPath: null,
    installing: false,
    lastStartPath: null,
    lastPublicBaseUrl: null,
  };

  const pushLog = (line: string) => {
    state.logs.push(line);
    if (state.logs.length > 400) state.logs.shift();
    hostLog(ctx, "n8n", line);
  };

  function findN8nEntry(): string | null {
    const entry =
      resolveN8nEntry({
        platform: process.platform,
        env: process.env,
        runtimeDir: n8nRuntimeCacheDir(ctx),
        allowEnvOverride: !ctx.isPackaged,
        envPrefix: ctx.manifest.envPrefix,
        existsSync: fs.existsSync,
        readFileSync: (p, enc) => fs.readFileSync(p, enc),
      }) || n8nEntryPath(ctx);
    state.entryPath = entry;
    return entry;
  }

  function n8nHomeLooksWarm(): boolean {
    return n8nHomeLooksWarmPure(homeDir, fs.existsSync);
  }

  async function startN8n(
    connectionMode: "local" | "remote",
    startOpts?: StartN8nOptions,
  ): Promise<RunningN8n | null> {
    const config = store.getN8nEmbedConfig();
    if (
      !shouldSpawnEmbeddedN8n({
        connectionMode,
        n8n: config as N8nEmbedConfig,
      })
    ) {
      return null;
    }
    if (state.running && !state.running.child.killed) {
      return state.running;
    }

    const log = startOpts?.onLog || pushLog;
    fs.mkdirSync(homeDir, { recursive: true });

    const nodeRes = await ensureDesktopNode(ctx, {
      minVersion: DESKTOP_NODE_MIN_FOR_EMBEDS,
    });
    if (!nodeRes.ok) {
      state.lastError = nodeRes.detail;
      return null;
    }

    let entry = findN8nEntry();
    if (!entry) {
      state.installing = true;
      state.lastStartPath = "bootstrap";
      const boot = await ensureN8nRuntime(ctx, { onLog: log });
      state.installing = false;
      entry = boot.entry;
      if (!entry) {
        state.lastError = boot.detail || getN8nBootstrapError();
        return null;
      }
    } else {
      state.lastStartPath = "reuse";
    }
    state.entryPath = entry;

    const port = await findFreePort(N8N_DESKTOP_PORT);
    const uiUrl = `http://127.0.0.1:${port}/`;
    const publicBase =
      normalizeN8nPublicBaseUrl(startOpts?.publicBaseUrl) || uiUrl;
    state.lastPublicBaseUrl = publicBase;
    const encryptionKey = ensureEncryptionKey(homeDir);
    const warm = n8nHomeLooksWarm();
    const healthTimeoutSec = warm ? 90 : 300;

    const userEnv = store.getEmbedUserEnv("n8n");
    const spawnEnv = buildN8nSpawnEnv({
      port,
      userFolder: homeDir,
      encryptionKey,
      publicBaseUrl: publicBase,
      userEnv,
      baseEnv: buildIsolatedNodeEnv({
        nodeBin: nodeRes.node,
        sandbox: {
          profileHome: path.join(homeDir, "profile"),
          userData: ctx.userDataDir,
        },
      }),
    });

    log(
      describeN8nSpawnKind({
        warm,
        node: nodeRes.node,
        entry,
        home: homeDir,
        uiUrl,
        healthTimeoutSec,
      }),
    );

    const child = spawn(nodeRes.node, [entry, "start"], {
      cwd: homeDir,
      env: spawnEnv as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout?.on("data", (d: Buffer) =>
      d
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((l) => log(l)),
    );
    child.stderr?.on("data", (d: Buffer) =>
      d
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((l) => log(`stderr: ${l}`)),
    );

    try {
      await waitN8nHealth(uiUrl, healthTimeoutSec * 1000);
    } catch (e) {
      state.lastError = e instanceof Error ? e.message : String(e);
      try {
        child.kill();
      } catch {
        /* */
      }
      return null;
    }

    const stop = () => {
      try {
        child.kill();
      } catch {
        /* */
      }
    };
    const running: RunningN8n = {
      uiUrl,
      homeDir,
      publicBaseUrl: publicBase,
      child,
      stop,
    };
    state.running = running;
    state.lastError = null;
    child.on("exit", () => {
      if (state.running?.child === child) state.running = null;
    });
    return running;
  }

  function stopN8n(): void {
    state.running?.stop();
    state.running = null;
  }

  function getN8nNextEnv(
    connectionMode: "local" | "remote",
  ): Record<string, string> {
    if (connectionMode !== "local" || !state.running) return {};
    return buildNextN8nEnv({ uiUrl: state.running.uiUrl });
  }

  function getN8nStatusPayload(
    connectionMode: "local" | "remote",
    remoteCrmOrigin?: string | null,
  ): Record<string, unknown> {
    const config = sanitizeN8nEmbedConfig(store.getN8nEmbedConfig());
    const pub = n8nPublicStatus({
      connectionMode,
      config,
      entryFound: Boolean(state.entryPath || findN8nEntry()),
      running: Boolean(state.running),
      uiUrl: state.running?.uiUrl ?? null,
      lastError: state.lastError,
      version: state.version,
      installing: state.installing,
      remoteCrmOrigin,
      tunnelRootDomain: ctx.manifest.tunnelRootDomain,
      productName: hostProductName(ctx),
    });
    return {
      ...pub,
      bootstrapPhase: getN8nBootstrapPhase(),
      bootstrapError: getN8nBootstrapError(),
      lastStartPath: state.lastStartPath,
      publicBaseUrl: state.running?.publicBaseUrl ?? state.lastPublicBaseUrl,
      node: resolveDesktopNodeBinary(ctx),
    };
  }

  async function ensureN8nRuntimeFromUi() {
    state.installing = true;
    const boot = await ensureN8nRuntime(ctx, { onLog: pushLog });
    state.installing = false;
    state.entryPath = boot.entry;
    return {
      ok: boot.ok,
      detail: boot.detail,
      phase: getN8nBootstrapPhase(),
    };
  }

  async function applyN8nPublicBaseUrl(opts: {
    publicBaseUrl: string | null;
  }): Promise<void> {
    const next = normalizeN8nPublicBaseUrl(opts.publicBaseUrl);
    if (!state.running) {
      state.lastPublicBaseUrl = next;
      return;
    }
    if (next === state.running.publicBaseUrl) return;
    const mode = store.getConnectionProfile().mode;
    stopN8n();
    await startN8n(mode, { publicBaseUrl: next });
  }

  return {
    startN8n,
    stopN8n,
    getRunningN8n: () => state.running,
    getN8nStatusPayload,
    getN8nNextEnv,
    getN8nLogs: () => [...state.logs],
    ensureN8nRuntimeFromUi,
    findN8nEntry,
    applyN8nPublicBaseUrl,
    n8nHomeLooksWarm,
    getN8nLastStartPath: () => state.lastStartPath,
    __resetForTests: () => {
      stopN8n();
      state.lastError = null;
      state.logs = [];
      state.entryPath = null;
      state.lastStartPath = null;
    },
  };
}
