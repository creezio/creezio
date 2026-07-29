/**
 * Sidecar Hermes Agent + WebUI — factory brand-agnostic (TF2 hermes-launcher).
 */

import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  buildHermesHomeEnvFile,
  buildNextHermesEnv,
  findFreePort,
  HERMES_DESKTOP_API_PORT,
  HERMES_DESKTOP_WEBUI_PORT,
  hermesPublicStatus,
  resolveHermesBinary,
  sanitizeHermesEmbedConfig,
  shouldSpawnEmbeddedHermes,
  type HermesEmbedConfig,
  type HermesRuntimeStatus,
  type HermesWebuiStatus,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog, hostProductName } from "../context.js";
import type { LocalConfigStore } from "../local-config.js";
import {
  applyOsSandboxEnv,
  hermesSandboxPaths,
  upsertHermesSandboxConfig,
} from "../sandbox/embed-sandbox.js";
import {
  ensureHermesRuntime,
  getBootstrapError,
  getBootstrapPhase,
  hermesWebuiInstallDir,
  resolveHermesAgentDir,
  resolveHermesPython,
  type BootstrapPhase,
} from "./runtime-bootstrap.js";

export type RunningHermes = {
  apiUrl: string;
  apiKey: string;
  webuiUrl: string | null;
  webuiPassword: string | null;
  homeDir: string;
  child: ChildProcess;
  webuiChild: ChildProcess | null;
  stop: () => void;
};

export type HermesHost = {
  startHermes: (
    connectionMode: "local" | "remote",
    opts?: StartHermesOptions,
  ) => Promise<RunningHermes | null>;
  stopHermes: () => void;
  stopHermesAndWait: (timeoutMs?: number) => Promise<void>;
  getRunningHermes: () => RunningHermes | null;
  getHermesStatusPayload: (
    connectionMode: "local" | "remote",
    remoteCrmOrigin?: string | null,
  ) => Record<string, unknown>;
  getHermesNextEnv: (
    connectionMode: "local" | "remote",
  ) => Record<string, string>;
  getHermesLogs: () => string[];
  ensureHermesRuntimeFromUi: () => Promise<{
    ok: boolean;
    detail: string;
    phase: BootstrapPhase;
  }>;
  findHermesBinary: () => string | null;
  getHermesLastStartPath: () => "bootstrap" | "reuse" | null;
  reapplyHermesLlmKeys: (opts: {
    openai?: string | null;
    anthropic?: string | null;
  }) => Promise<void>;
  __resetForTests: () => void;
};

export type StartHermesOptions = {
  crmPort?: number | null;
  publicWebuiUrl?: string | null;
  onLog?: (line: string) => void;
};

function waitHttpOk(url: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 500) {
          resolve();
          return;
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`timeout health ${url}`));
          return;
        }
        setTimeout(tick, 400);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`timeout health ${url}`));
          return;
        }
        setTimeout(tick, 400);
      });
    };
    tick();
  });
}

function ensureApiKey(homeDir: string): string {
  const keyFile = path.join(homeDir, ".desktop-hermes-api-key");
  try {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (existing.length >= 16) return existing;
  } catch {
    /* */
  }
  const key = crypto.randomBytes(24).toString("base64url");
  fs.mkdirSync(homeDir, { recursive: true });
  fs.writeFileSync(keyFile, key, { mode: 0o600 });
  return key;
}

function ensureWebuiPassword(homeDir: string): string {
  const keyFile = path.join(homeDir, ".desktop-hermes-webui-password");
  try {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (existing.length >= 8) return existing;
  } catch {
    /* */
  }
  const key = crypto.randomBytes(12).toString("base64url");
  fs.writeFileSync(keyFile, key, { mode: 0o600 });
  return key;
}

export function createHermesHost(opts: {
  ctx: HostRuntimeContext;
  store: LocalConfigStore;
}): HermesHost {
  const { ctx, store } = opts;
  const homeDir = path.join(ctx.userDataDir, "hermes-home");

  type State = {
    running: RunningHermes | null;
    lastError: string | null;
    version: string | null;
    logs: string[];
    binaryPath: string | null;
    webuiStatus: HermesWebuiStatus;
    installing: boolean;
    lastStartPath: "bootstrap" | "reuse" | null;
  };

  const state: State = {
    running: null,
    lastError: null,
    version: null,
    logs: [],
    binaryPath: null,
    webuiStatus: "stopped",
    installing: false,
    lastStartPath: null,
  };

  const pushLog = (line: string) => {
    state.logs.push(line);
    if (state.logs.length > 400) state.logs.shift();
    hostLog(ctx, "hermes", line);
  };

  function findHermesBinary(): string | null {
    const bin = resolveHermesBinary({
      platform: process.platform,
      env: process.env,
      searchDirs: [
        path.join(ctx.userDataDir, "hermes-runtime"),
        path.join(homeDir, "bin"),
        path.join(ctx.resourcesRoot, "vendor", "hermes-agent"),
      ],
      allowEnvOverride: !ctx.isPackaged,
      envPrefix: ctx.manifest.envPrefix,
      existsSync: fs.existsSync,
    });
    state.binaryPath = bin;
    return bin;
  }

  async function startHermes(
    connectionMode: "local" | "remote",
    startOpts?: StartHermesOptions,
  ): Promise<RunningHermes | null> {
    const config = store.getHermesEmbedConfig();
    if (
      !shouldSpawnEmbeddedHermes({
        connectionMode,
        hermes: config as HermesEmbedConfig,
      })
    ) {
      return null;
    }
    if (state.running && !state.running.child.killed) {
      return state.running;
    }

    const log = startOpts?.onLog || pushLog;
    fs.mkdirSync(homeDir, { recursive: true });
    const paths = hermesSandboxPaths(homeDir);
    fs.mkdirSync(paths.workspace, { recursive: true });
    fs.mkdirSync(paths.profileHome, { recursive: true });

    let binary = findHermesBinary();
    if (!binary) {
      state.installing = true;
      state.lastStartPath = "bootstrap";
      const boot = await ensureHermesRuntime(ctx, { onLog: log });
      state.installing = false;
      binary = boot.binary;
      if (!binary) {
        state.lastError = boot.detail || getBootstrapError();
        return null;
      }
    } else {
      state.lastStartPath = "reuse";
    }
    state.binaryPath = binary;

    if (ctx.seedHermesSkills) {
      try {
        await ctx.seedHermesSkills(homeDir);
      } catch (e) {
        log(`skills seed: ${e instanceof Error ? e.message : e}`);
      }
    }

    const apiKey = ensureApiKey(homeDir);
    const webuiPassword = ensureWebuiPassword(homeDir);
    const apiPort = await findFreePort(HERMES_DESKTOP_API_PORT);
    const webuiPort = await findFreePort(HERMES_DESKTOP_WEBUI_PORT);
    const apiUrl = `http://127.0.0.1:${apiPort}`;

    const llm = store.getLlmKeys();
    const userEnv = store.getEmbedUserEnv("hermes");
    const bridgeEnv =
      ctx.getHermesBridgeEnv?.({ crmPort: startOpts?.crmPort }) ||
      ctx.getPluginControlBridgeEnv?.() ||
      {};

    const envFile = buildHermesHomeEnvFile({
      apiKey,
      apiPort,
      openaiKey: llm.openai,
      anthropicKey: llm.anthropic,
      webuiPassword,
      userEnv,
      bridgeEnv,
      productName: hostProductName(ctx),
    });
    fs.writeFileSync(path.join(homeDir, ".env"), envFile, { mode: 0o600 });

    const configYaml = path.join(homeDir, "config.yaml");
    try {
      const prev = fs.existsSync(configYaml)
        ? fs.readFileSync(configYaml, "utf8")
        : "";
      fs.writeFileSync(
        configYaml,
        upsertHermesSandboxConfig(prev, paths.workspace),
        "utf8",
      );
    } catch {
      /* */
    }

    const env = applyOsSandboxEnv({
      env: {
        ...process.env,
        HERMES_HOME: homeDir,
        TERMINAL_CWD: paths.workspace,
      },
      profileHome: paths.profileHome,
      userData: ctx.userDataDir,
      toolDirs: [path.dirname(binary)],
    });

    log(`spawn hermes gateway ${binary} :${apiPort}`);
    const child = spawn(binary, ["gateway", "run"], {
      cwd: homeDir,
      env,
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
      await waitHttpOk(`${apiUrl}/health`, 90_000);
    } catch (e) {
      state.lastError = e instanceof Error ? e.message : String(e);
      try {
        child.kill();
      } catch {
        /* */
      }
      return null;
    }

    let webuiChild: ChildProcess | null = null;
    let webuiUrl: string | null = null;
    const webuiDir = hermesWebuiInstallDir(ctx);
    const py = resolveHermesPython(resolveHermesAgentDir(ctx));
    if (py && fs.existsSync(webuiDir)) {
      webuiUrl = `http://127.0.0.1:${webuiPort}`;
      const webuiEnv = applyOsSandboxEnv({
        env: {
          ...env,
          HERMES_WEBUI_HOST: "127.0.0.1",
          HERMES_WEBUI_PORT: String(webuiPort),
          HERMES_WEBUI_GATEWAY_BASE_URL: apiUrl,
          HERMES_WEBUI_GATEWAY_API_KEY: apiKey,
          HERMES_WEBUI_PASSWORD: webuiPassword,
          HERMES_WEBUI_STATE_DIR: path.join(homeDir, "webui-state"),
          HERMES_WEBUI_DISABLE_SELF_UPDATE: "1",
        },
        profileHome: paths.profileHome,
        userData: ctx.userDataDir,
        toolDirs: [path.dirname(py)],
      });
      webuiChild = spawn(py, ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", String(webuiPort)], {
        cwd: webuiDir,
        env: webuiEnv,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      state.webuiStatus = "running";
    } else {
      state.webuiStatus = "missing";
    }

    const stop = () => {
      try {
        webuiChild?.kill();
      } catch {
        /* */
      }
      try {
        child.kill();
      } catch {
        /* */
      }
    };

    const running: RunningHermes = {
      apiUrl,
      apiKey,
      webuiUrl,
      webuiPassword,
      homeDir,
      child,
      webuiChild,
      stop,
    };
    state.running = running;
    state.lastError = null;
    child.on("exit", () => {
      if (state.running?.child === child) state.running = null;
    });
    return running;
  }

  function stopHermes(): void {
    state.running?.stop();
    state.running = null;
    state.webuiStatus = "stopped";
  }

  async function stopHermesAndWait(timeoutMs = 5000): Promise<void> {
    const child = state.running?.child;
    stopHermes();
    if (!child) return;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, timeoutMs);
      child.on("exit", () => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  function getHermesNextEnv(
    connectionMode: "local" | "remote",
  ): Record<string, string> {
    const r = state.running;
    if (!r || connectionMode !== "local") return {};
    return buildNextHermesEnv({
      apiUrl: r.apiUrl,
      apiKey: r.apiKey,
      webuiUrl: r.webuiUrl,
      webuiPassword: r.webuiPassword,
    });
  }

  function getHermesStatusPayload(
    connectionMode: "local" | "remote",
    remoteCrmOrigin?: string | null,
  ): Record<string, unknown> {
    const config = sanitizeHermesEmbedConfig(store.getHermesEmbedConfig());
    const pub = hermesPublicStatus({
      connectionMode,
      config,
      binaryFound: Boolean(state.binaryPath || findHermesBinary()),
      running: Boolean(state.running),
      apiUrl: state.running?.apiUrl ?? null,
      lastError: state.lastError,
      version: state.version,
      remoteCrmOrigin,
      tunnelRootDomain: ctx.manifest.tunnelRootDomain,
      productName: hostProductName(ctx),
    });
    return {
      ...pub,
      webuiStatus: state.webuiStatus,
      webuiUrl: state.running?.webuiUrl ?? pub.webuiUrl,
      installing: state.installing,
      bootstrapPhase: getBootstrapPhase(),
      bootstrapError: getBootstrapError(),
      lastStartPath: state.lastStartPath,
      status: (state.installing
        ? "installing"
        : pub.status) as HermesRuntimeStatus,
    };
  }

  async function ensureHermesRuntimeFromUi() {
    state.installing = true;
    const boot = await ensureHermesRuntime(ctx, { onLog: pushLog });
    state.installing = false;
    state.binaryPath = boot.binary;
    return {
      ok: boot.ok,
      detail: boot.detail,
      phase: getBootstrapPhase(),
    };
  }

  async function reapplyHermesLlmKeys(keys: {
    openai?: string | null;
    anthropic?: string | null;
  }): Promise<void> {
    if (keys.openai !== undefined) store.setLlmKey("openai", keys.openai);
    if (keys.anthropic !== undefined)
      store.setLlmKey("anthropic", keys.anthropic);
    if (!state.running) return;
    const mode = store.getConnectionProfile().mode;
    await stopHermesAndWait();
    await startHermes(mode);
  }

  return {
    startHermes,
    stopHermes,
    stopHermesAndWait,
    getRunningHermes: () => state.running,
    getHermesStatusPayload,
    getHermesNextEnv,
    getHermesLogs: () => [...state.logs],
    ensureHermesRuntimeFromUi,
    findHermesBinary,
    getHermesLastStartPath: () => state.lastStartPath,
    reapplyHermesLlmKeys,
    __resetForTests: () => {
      stopHermes();
      state.lastError = null;
      state.logs = [];
      state.binaryPath = null;
      state.lastStartPath = null;
    },
  };
}
