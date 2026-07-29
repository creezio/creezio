/**
 * Token Bearer control plane plugins — brand-agnostic (TF2 plugin-control-token).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { HostRuntimeContext } from "../context.js";
import { hostLog } from "../context.js";

export function pluginControlTokenFile(brandId: string): string {
  return `.${brandId}-plugins-api-token`;
}

export function pluginControlTokenPrefix(envPrefix: string): string {
  return `${envPrefix.toLowerCase()}_plug_`;
}

export type PluginControlTokenStored = {
  token: string;
  createdAt: string;
};

export function pluginControlTokenPath(ctx: HostRuntimeContext): string {
  return path.join(
    ctx.userDataDir,
    pluginControlTokenFile(ctx.manifest.brandId),
  );
}

export function readPluginControlToken(
  ctx: HostRuntimeContext,
): PluginControlTokenStored | null {
  const prefix = pluginControlTokenPrefix(ctx.manifest.envPrefix);
  try {
    const raw = JSON.parse(
      fs.readFileSync(pluginControlTokenPath(ctx), "utf8"),
    ) as PluginControlTokenStored;
    if (
      raw &&
      typeof raw.token === "string" &&
      raw.token.startsWith(prefix) &&
      raw.token.length > prefix.length + 8
    ) {
      return raw;
    }
  } catch {
    /* absent */
  }
  return null;
}

export function writePluginControlToken(
  ctx: HostRuntimeContext,
  data: PluginControlTokenStored,
): void {
  fs.writeFileSync(
    pluginControlTokenPath(ctx),
    `${JSON.stringify(data, null, 2)}\n`,
    { mode: 0o600 },
  );
}

export function generatePluginControlToken(
  ctx: HostRuntimeContext,
): PluginControlTokenStored {
  const secret = crypto.randomBytes(24).toString("base64url");
  return {
    token: `${pluginControlTokenPrefix(ctx.manifest.envPrefix)}${secret}`,
    createdAt: new Date().toISOString(),
  };
}

export function ensurePluginControlToken(
  ctx: HostRuntimeContext,
): PluginControlTokenStored {
  let stored = readPluginControlToken(ctx);
  if (!stored) {
    stored = generatePluginControlToken(ctx);
    writePluginControlToken(ctx, stored);
    hostLog(ctx, "plugins-api", "token généré");
  } else {
    hostLog(ctx, "plugins-api", "réutilise token local");
  }
  return stored;
}

/** Env bridge plugins pour Hermes / sidecars. */
export function getPluginControlBridgeEnv(
  ctx: HostRuntimeContext,
  opts?: { controlPort?: number | null },
): Record<string, string> {
  const token = ensurePluginControlToken(ctx);
  const pluginsDir = path.join(ctx.userDataDir, "plugins");
  const out: Record<string, string> = {
    PLUGINS_API_TOKEN: token.token,
    PLUGINS_DIR: pluginsDir,
    TEMPOFLOW_PLUGINS_API_TOKEN: token.token,
    TEMPOFLOW_PLUGINS_DIR: pluginsDir,
  };
  if (opts?.controlPort && opts.controlPort > 0) {
    const url = `http://127.0.0.1:${opts.controlPort}`;
    out.PLUGINS_API_URL = url;
    out.TEMPOFLOW_PLUGINS_API_URL = url;
  }
  return out;
}
