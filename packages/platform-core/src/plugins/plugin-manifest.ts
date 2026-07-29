/**
 * Contrat manifest + découverte plugins — port TF2 plugin-runtime.ts (partie pure).
 * Le spawn / control-api restent dans @creezio/electron-shell.
 */

import fs from "node:fs";
import path from "node:path";
import { pluginSiteId } from "./plugin-events.js";

export const PLUGIN_MANIFEST_FILE = "manifest.json";
export { pluginSiteId };

export type PluginPermission =
  | "crm:read"
  | "crm:write"
  | "n8n:read"
  | "n8n:write"
  | "ui:panel"
  | "net:loopback"
  | "llm:use";

export type PluginPanelConfig = {
  title?: string;
  path?: string;
};

export type PluginAcceptanceSmoke = {
  method?: string;
  path: string;
  expectStatus?: number;
  timeoutMs?: number;
};

export type PluginAcceptance = {
  smoke?: PluginAcceptanceSmoke[];
};

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  main: string;
  port?: number;
  permissions: PluginPermission[];
  hooks?: string[];
  panel?: PluginPanelConfig;
  acceptance?: PluginAcceptance;
  source?: "hermes" | "import" | "user" | string;
};

export type DiscoveredPlugin = {
  dir: string;
  manifest: PluginManifest;
  enabled: boolean;
  error?: string;
};

const ALLOWED_PERMS = new Set<string>([
  "crm:read",
  "crm:write",
  "n8n:read",
  "n8n:write",
  "ui:panel",
  "net:loopback",
  "llm:use",
]);

export function pluginsRootDir(userDataDir: string): string {
  const dir = path.join(userDataDir, "plugins");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function pluginEnabledFlagPath(pluginDir: string): string {
  return path.join(pluginDir, ".enabled");
}

export function isValidPluginId(id: string): boolean {
  return /^[a-z][a-z0-9-]{1,62}$/.test(id);
}

export function hasPluginPermission(
  manifest: PluginManifest,
  perm: PluginPermission,
): boolean {
  return (manifest.permissions || []).includes(perm);
}

export function parsePluginManifest(raw: unknown): PluginManifest {
  if (!raw || typeof raw !== "object") {
    throw new Error("manifest invalide");
  }
  const o = raw as Record<string, unknown>;
  const id = String(o.id || "").trim();
  const name = String(o.name || "").trim();
  const version = String(o.version || "").trim();
  const main = String(o.main || "index.js").trim();
  if (!isValidPluginId(id)) {
    throw new Error(`id plugin invalide: ${id}`);
  }
  if (!name || !version || !main) {
    throw new Error("manifest: name/version/main requis");
  }
  if (main.includes("..") || path.isAbsolute(main)) {
    throw new Error("manifest.main doit être relatif");
  }
  const permissions = Array.isArray(o.permissions)
    ? (o.permissions as unknown[])
        .map((p) => String(p))
        .filter((p): p is PluginPermission => ALLOWED_PERMS.has(p))
    : [];
  const hooks = Array.isArray(o.hooks)
    ? (o.hooks as unknown[]).map((h) => String(h)).filter(Boolean)
    : undefined;
  let panel: PluginPanelConfig | undefined;
  if (o.panel && typeof o.panel === "object") {
    const p = o.panel as Record<string, unknown>;
    panel = {
      title: typeof p.title === "string" ? p.title : undefined,
      path: typeof p.path === "string" ? p.path : undefined,
    };
  }
  let acceptance: PluginAcceptance | undefined;
  if (o.acceptance && typeof o.acceptance === "object") {
    const a = o.acceptance as Record<string, unknown>;
    if (Array.isArray(a.smoke)) {
      acceptance = {
        smoke: a.smoke
          .filter((s) => s && typeof s === "object")
          .map((s) => {
            const x = s as Record<string, unknown>;
            return {
              method: typeof x.method === "string" ? x.method : undefined,
              path: String(x.path || "/"),
              expectStatus:
                typeof x.expectStatus === "number" ? x.expectStatus : undefined,
              timeoutMs:
                typeof x.timeoutMs === "number" ? x.timeoutMs : undefined,
            };
          }),
      };
    }
  }
  const port =
    typeof o.port === "number" && o.port > 0 && o.port < 65536
      ? o.port
      : undefined;
  return {
    id,
    name,
    version,
    description:
      typeof o.description === "string" ? o.description : undefined,
    main,
    port,
    permissions,
    hooks,
    panel,
    acceptance,
    source: typeof o.source === "string" ? o.source : undefined,
  };
}

export function discoverPlugins(root: string): DiscoveredPlugin[] {
  if (!fs.existsSync(root)) return [];
  const out: DiscoveredPlugin[] = [];
  for (const name of fs.readdirSync(root)) {
    const dir = path.join(root, name);
    let st: fs.Stats;
    try {
      st = fs.statSync(dir);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const mf = path.join(dir, PLUGIN_MANIFEST_FILE);
    if (!fs.existsSync(mf)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(mf, "utf8"));
      const manifest = parsePluginManifest(raw);
      if (manifest.id !== name && !isValidPluginId(name)) {
        /* id dossier peut différer — on garde manifest.id */
      }
      const enabled = fs.existsSync(pluginEnabledFlagPath(dir));
      out.push({ dir, manifest, enabled });
    } catch (e) {
      out.push({
        dir,
        manifest: {
          id: name,
          name,
          version: "0.0.0",
          main: "index.js",
          permissions: [],
        },
        enabled: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  out.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
  return out;
}

export function setPluginEnabled(pluginDir: string, enabled: boolean): void {
  const flag = pluginEnabledFlagPath(pluginDir);
  if (enabled) {
    fs.writeFileSync(flag, "1\n", "utf8");
  } else if (fs.existsSync(flag)) {
    fs.unlinkSync(flag);
  }
}
