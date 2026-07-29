/**
 * Bootstrap runtime n8n — npm download-on-first-run (TF2 n8n-runtime-bootstrap).
 */

import fs from "node:fs";
import path from "node:path";
import {
  cleanupN8nInstallArtifacts,
  diskSpacePreflightMessage,
  formatN8nDiskSpaceError,
  getFreeDiskBytes,
  isDiskSpaceError,
  isNodeSpawnableN8nEntry,
  n8nEntryCandidates,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog, hostProductName } from "../context.js";
import { runNpmCli } from "../npm-cli.js";

export type N8nBootstrapPhase =
  | "idle"
  | "checking"
  | "installing"
  | "ready"
  | "error";

export type N8nRuntimeManifest = {
  n8nPin: string;
  decision: string;
  package: {
    name: string;
    version: string;
    installArgs: string[];
  };
  engines?: { node?: string };
  notes?: string;
};

let phase: N8nBootstrapPhase = "idle";
let lastBootstrapError: string | null = null;

export function getN8nBootstrapPhase(): N8nBootstrapPhase {
  return phase;
}

export function getN8nBootstrapError(): string | null {
  return lastBootstrapError;
}

export function n8nVendorDir(ctx: HostRuntimeContext): string {
  const candidates = [
    path.join(ctx.resourcesRoot, "vendor", "n8n"),
    path.join(ctx.resourcesRoot, "resources", "vendor", "n8n"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]!;
}

export function loadN8nRuntimeManifest(
  ctx: HostRuntimeContext,
): N8nRuntimeManifest {
  const candidates = [
    path.join(n8nVendorDir(ctx), "runtime-manifest.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as N8nRuntimeManifest;
    }
  }
  throw new Error("vendor/n8n/runtime-manifest.json introuvable");
}

export function n8nRuntimeCacheDir(ctx: HostRuntimeContext): string {
  const dir = path.join(ctx.userDataDir, "n8n-runtime");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function n8nEntryPath(ctx: HostRuntimeContext): string | null {
  const runtimeDir = n8nRuntimeCacheDir(ctx);
  for (const c of n8nEntryCandidates(runtimeDir, process.platform)) {
    if (
      isNodeSpawnableN8nEntry(c, {
        existsSync: fs.existsSync,
        readFileSync: (p, enc) => fs.readFileSync(p, enc),
      })
    ) {
      return c;
    }
  }
  return null;
}

export async function ensureN8nRuntime(
  ctx: HostRuntimeContext,
  opts?: { onLog?: (l: string) => void },
): Promise<{ ok: boolean; entry: string | null; detail: string }> {
  const log = opts?.onLog || ((l) => hostLog(ctx, "n8n-bootstrap", l));
  phase = "checking";
  lastBootstrapError = null;

  const existing = n8nEntryPath(ctx);
  if (existing) {
    phase = "ready";
    return { ok: true, entry: existing, detail: "reuse" };
  }

  const free = getFreeDiskBytes(ctx.userDataDir);
  const preflight = diskSpacePreflightMessage(ctx.userDataDir, free);
  if (preflight) {
    phase = "error";
    lastBootstrapError = formatN8nDiskSpaceError(ctx.userDataDir, {
      freeBytes: free,
      productName: hostProductName(ctx),
    });
    return { ok: false, entry: null, detail: lastBootstrapError };
  }

  phase = "installing";
  try {
    const manifest = loadN8nRuntimeManifest(ctx);
    const runtimeDir = n8nRuntimeCacheDir(ctx);
    const pkgJson = path.join(runtimeDir, "package.json");
    if (!fs.existsSync(pkgJson)) {
      fs.writeFileSync(
        pkgJson,
        JSON.stringify({ name: "desktop-n8n-runtime", private: true }, null, 2),
        "utf8",
      );
    }
    const pin = `${manifest.package.name}@${manifest.package.version || manifest.n8nPin}`;
    log(`npm install ${pin}…`);
    const result = await runNpmCli(
      ctx,
      ["install", pin, ...(manifest.package.installArgs || [])],
      { cwd: runtimeDir, onLog: log },
    );
    if (result.code !== 0) {
      if (isDiskSpaceError({ code: result.code, text: result.stderr })) {
        const cleaned = cleanupN8nInstallArtifacts(ctx.userDataDir, {
          npmCacheSegment: "desktop-npm",
        });
        lastBootstrapError = formatN8nDiskSpaceError(ctx.userDataDir, {
          freeBytes: getFreeDiskBytes(ctx.userDataDir),
          cleaned,
          productName: hostProductName(ctx),
        });
      } else {
        lastBootstrapError =
          result.stderr.slice(0, 500) || `npm exit ${result.code}`;
      }
      phase = "error";
      return { ok: false, entry: null, detail: lastBootstrapError };
    }
    const entry = n8nEntryPath(ctx);
    if (!entry) {
      lastBootstrapError = "entry n8n introuvable après npm install";
      phase = "error";
      return { ok: false, entry: null, detail: lastBootstrapError };
    }
    phase = "ready";
    return { ok: true, entry, detail: "installed" };
  } catch (e) {
    lastBootstrapError = e instanceof Error ? e.message : String(e);
    phase = "error";
    return { ok: false, entry: null, detail: lastBootstrapError };
  }
}

export function __resetN8nBootstrapStateForTests(): void {
  phase = "idle";
  lastBootstrapError = null;
}
