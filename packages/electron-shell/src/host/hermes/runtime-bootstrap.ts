/**
 * Bootstrap runtime Hermes — download-on-first-run (TF2 hermes-runtime-bootstrap).
 * Chemins injectés via HostRuntimeContext.
 */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import type { HostRuntimeContext } from "../context.js";
import { hostLog } from "../context.js";
import { applyOsSandboxEnv, setSandboxEnvVar } from "../sandbox/embed-sandbox.js";
import { resolveSystemBinary } from "../sandbox/os-sandbox.js";
import { resolveDesktopNodeBinary } from "../node-runtime.js";

export type BootstrapPhase =
  | "idle"
  | "checking"
  | "installing-agent"
  | "installing-webui"
  | "ready"
  | "error";

export type RuntimeManifest = {
  hermesAgentPin: string;
  decision: string;
  webui: {
    repo: string;
    ref: string;
    archiveUrl: string;
    sha256: string;
    license?: string;
  };
  agentInstall: {
    commitPin?: string;
    windows: {
      scriptUrl: string;
      scriptSha256?: string;
      args: string[];
      stages?: string[];
    };
    posix: { scriptUrl: string; scriptSha256?: string; args: string[] };
  };
};

let phase: BootstrapPhase = "idle";
let lastBootstrapError: string | null = null;

export function getBootstrapPhase(): BootstrapPhase {
  return phase;
}

export function getBootstrapError(): string | null {
  return lastBootstrapError;
}

function setPhase(p: BootstrapPhase): void {
  phase = p;
}

export function hermesVendorDir(ctx: HostRuntimeContext): string {
  const candidates = [
    path.join(ctx.resourcesRoot, "vendor", "hermes-agent"),
    path.join(ctx.resourcesRoot, "resources", "vendor", "hermes-agent"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]!;
}

export function loadRuntimeManifest(ctx: HostRuntimeContext): RuntimeManifest {
  const candidates = [
    path.join(hermesVendorDir(ctx), "runtime-manifest.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as RuntimeManifest;
    }
  }
  throw new Error("vendor/hermes-agent/runtime-manifest.json introuvable");
}

export function hermesRuntimeCacheDir(ctx: HostRuntimeContext): string {
  const dir = path.join(ctx.userDataDir, "hermes-runtime");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function hermesWebuiInstallDir(ctx: HostRuntimeContext): string {
  return path.join(hermesRuntimeCacheDir(ctx), "webui");
}

export function hermesAgentDirCandidates(ctx: HostRuntimeContext): string[] {
  const cache = hermesRuntimeCacheDir(ctx);
  return [
    path.join(cache, "hermes-agent"),
    path.join(cache, "agent"),
    path.join(ctx.userDataDir, "hermes-home", "hermes-agent"),
  ];
}

export function resolveHermesAgentDir(
  ctx: HostRuntimeContext,
  existsSync = fs.existsSync,
): string | null {
  for (const d of hermesAgentDirCandidates(ctx)) {
    if (existsSync(path.join(d, "pyproject.toml")) || existsSync(path.join(d, "hermes"))) {
      return d;
    }
  }
  return null;
}

export function resolveHermesPython(
  agentDir?: string | null,
): string | null {
  if (!agentDir) return null;
  const candidates =
    process.platform === "win32"
      ? [
          path.join(agentDir, ".venv", "Scripts", "python.exe"),
          path.join(agentDir, "venv", "Scripts", "python.exe"),
        ]
      : [
          path.join(agentDir, ".venv", "bin", "python"),
          path.join(agentDir, "venv", "bin", "python"),
        ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export const WEBUI_DEPS_MARKER = ".desktop-webui-deps";

export function webuiDepsMarkerPath(webuiDir: string): string {
  return path.join(webuiDir, WEBUI_DEPS_MARKER);
}

function downloadFile(
  url: string,
  dest: string,
  onLog: (l: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = `${dest}.part`;
    const file = fs.createWriteStream(tmp);
    const get = url.startsWith("https:") ? https.get : http.get;
    onLog(`download ${url}`);
    const req = get(url, { timeout: 300_000 }, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        file.close();
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* */
        }
        downloadFile(res.headers.location, dest, onLog).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          fs.renameSync(tmp, dest);
          resolve();
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("download timeout"));
    });
  });
}

function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export async function ensureHermesWebuiTree(
  ctx: HostRuntimeContext,
  opts?: { onLog?: (l: string) => void },
): Promise<{ ok: boolean; dir: string | null; detail: string }> {
  const log = opts?.onLog || ((l) => hostLog(ctx, "hermes-bootstrap", l));
  try {
    const manifest = loadRuntimeManifest(ctx);
    const dir = hermesWebuiInstallDir(ctx);
    const marker = path.join(dir, ".sha256");
    if (
      fs.existsSync(dir) &&
      fs.existsSync(marker) &&
      fs.readFileSync(marker, "utf8").trim() === manifest.webui.sha256
    ) {
      return { ok: true, dir, detail: "webui cached" };
    }
    setPhase("installing-webui");
    const cache = hermesRuntimeCacheDir(ctx);
    const archive = path.join(cache, "webui-archive.zip");
    await downloadFile(manifest.webui.archiveUrl, archive, log);
    const digest = sha256File(archive);
    if (digest !== manifest.webui.sha256) {
      throw new Error(
        `checksum webui mismatch (got ${digest}, want ${manifest.webui.sha256})`,
      );
    }
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const tarBin = resolveSystemBinary("tar") || "tar";
    await new Promise<void>((resolve, reject) => {
      const child = spawn(tarBin, ["-xf", archive, "-C", dir], {
        windowsHide: true,
      });
      child.on("error", reject);
      child.on("exit", (c) =>
        c === 0 ? resolve() : reject(new Error(`extract exit ${c}`)),
      );
    });
    fs.writeFileSync(marker, `${manifest.webui.sha256}\n`, "utf8");
    return { ok: true, dir, detail: "webui installed" };
  } catch (e) {
    lastBootstrapError = e instanceof Error ? e.message : String(e);
    setPhase("error");
    return { ok: false, dir: null, detail: lastBootstrapError };
  }
}

/**
 * Garantit le runtime agent + webui.
 * L'install agent officielle (install.ps1 / curl) est déléguée si le CLI
 * n'est pas déjà présent sous userData — mêmes stages sandbox que TF2.
 */
export async function ensureHermesRuntime(
  ctx: HostRuntimeContext,
  opts?: {
    onLog?: (l: string) => void;
    searchDirs?: string[];
  },
): Promise<{
  ok: boolean;
  binary: string | null;
  agentDir: string | null;
  webuiDir: string | null;
  detail: string;
}> {
  const log = opts?.onLog || ((l) => hostLog(ctx, "hermes-bootstrap", l));
  setPhase("checking");
  lastBootstrapError = null;

  const { resolveHermesBinary } = await import("@creezio/platform-core");
  const searchDirs = opts?.searchDirs || [
    hermesRuntimeCacheDir(ctx),
    ...hermesAgentDirCandidates(ctx),
    path.join(ctx.userDataDir, "hermes-home", "bin"),
  ];
  let binary = resolveHermesBinary({
    platform: process.platform,
    env: process.env,
    searchDirs,
    allowEnvOverride: !ctx.isPackaged,
    envPrefix: ctx.manifest.envPrefix,
    existsSync: fs.existsSync,
  });

  if (!binary) {
    setPhase("installing-agent");
    log("CLI Hermes absent — bootstrap agent (install officiel piné)…");
    try {
      const manifest = loadRuntimeManifest(ctx);
      const cache = hermesRuntimeCacheDir(ctx);
      const profileHome = path.join(cache, "os-profile");
      fs.mkdirSync(profileHome, { recursive: true });
      const env = applyOsSandboxEnv({
        env: { ...process.env },
        profileHome,
        userData: ctx.userDataDir,
        toolDirs: [path.dirname(resolveDesktopNodeBinary(ctx))],
      });
      setSandboxEnvVar(env, "HERMES_HOME", path.join(ctx.userDataDir, "hermes-home"));

      if (process.platform === "win32") {
        const ps = resolveSystemBinary("powershell");
        if (!ps) throw new Error("powershell introuvable");
        const script = path.join(cache, "install.ps1");
        await downloadFile(manifest.agentInstall.windows.scriptUrl, script, log);
        const stages =
          manifest.agentInstall.windows.stages ||
          manifest.agentInstall.windows.args;
        for (const stage of stages) {
          log(`install stage: ${stage}`);
          await new Promise<void>((resolve, reject) => {
            const child = spawn(
              ps,
              [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                script,
                stage,
              ],
              { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
            );
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
            child.on("error", reject);
            child.on("exit", (c) =>
              c === 0 ? resolve() : reject(new Error(`stage ${stage} exit ${c}`)),
            );
          });
        }
      } else {
        const bash = resolveSystemBinary("bash") || "bash";
        const script = path.join(cache, "install.sh");
        await downloadFile(manifest.agentInstall.posix.scriptUrl, script, log);
        await new Promise<void>((resolve, reject) => {
          const child = spawn(bash, [script, ...manifest.agentInstall.posix.args], {
            env,
            stdio: ["ignore", "pipe", "pipe"],
          });
          child.stdout?.on("data", (d: Buffer) =>
            d
              .toString()
              .split("\n")
              .filter(Boolean)
              .forEach((l) => log(l)),
          );
          child.on("error", reject);
          child.on("exit", (c) =>
            c === 0 ? resolve() : reject(new Error(`install.sh exit ${c}`)),
          );
        });
      }
      binary = resolveHermesBinary({
        platform: process.platform,
        env: process.env,
        searchDirs,
        allowEnvOverride: !ctx.isPackaged,
        envPrefix: ctx.manifest.envPrefix,
        existsSync: fs.existsSync,
      });
    } catch (e) {
      lastBootstrapError = e instanceof Error ? e.message : String(e);
      setPhase("error");
      return {
        ok: false,
        binary: null,
        agentDir: null,
        webuiDir: null,
        detail: lastBootstrapError,
      };
    }
  }

  const webui = await ensureHermesWebuiTree(ctx, { onLog: log });
  const agentDir = resolveHermesAgentDir(ctx);
  if (binary) {
    setPhase("ready");
    return {
      ok: true,
      binary,
      agentDir,
      webuiDir: webui.dir,
      detail: "ready",
    };
  }
  lastBootstrapError = "CLI Hermes toujours introuvable après bootstrap";
  setPhase("error");
  return {
    ok: false,
    binary: null,
    agentDir,
    webuiDir: webui.dir,
    detail: lastBootstrapError,
  };
}

export function __resetBootstrapStateForTests(): void {
  phase = "idle";
  lastBootstrapError = null;
}
