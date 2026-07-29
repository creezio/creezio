/**
 * Générateur de config electron-builder Client / Serveur à partir d'un AppManifest.
 *
 * Port brand-agnostic de `crm/scripts/electron/build-builder-config.mjs` (TF2 0.10.26).
 * L'appelant fournit la config de base (YAML/JSON parsé) et reçoit les overrides.
 *
 * Usage typique dans une app marque :
 * ```ts
 * import { buildElectronBuilderConfig, tempoflowManifest } from "@creezio/brand-config";
 * const cfg = buildElectronBuilderConfig(tempoflowManifest, "server", baseYaml);
 * ```
 */

import type { AppKind, AppManifest, ExeIdentity } from "./types.js";
import { exeForKind } from "./types.js";

/** Liste des modules main Electron réservés à l'hôte (exclus du paquet Client). */
export const DEFAULT_HOST_ONLY_ELECTRON_MODULES = [
  "server-launcher",
  "meili-launcher",
  "meili-coherence",
  "meili-index-schema",
  "catalog-sync",
  "hermes-launcher",
  "hermes-runtime-bootstrap",
  "hermes-skills-seed",
  "hermes-crm-key",
  "hermes-context-seed",
  "n8n-launcher",
  "n8n-runtime-bootstrap",
  "disk-space",
  "node-runtime",
  "npm-cli",
  "plugin-launcher",
  "plugin-control-api",
  "plugin-runtime",
  "plugin-test-runner",
  "plugin-accept-check",
  "plugin-crm-key",
  "plugin-git",
  "plugin-events",
  "plugin-control-token",
  "plugin-execution-grant",
  "tunnel",
  "fleet-agent",
  "fleet-samples",
  "factory-reset",
] as const;

export type BuildBuilderConfigOptions = {
  /** Modules host-only à exclure du paquet Client (défaut = liste TF2). */
  hostOnlyModules?: readonly string[];
  /**
   * Si `false`, n'applique pas `applyClientSlim` (apps sans host-stack lazy,
   * ex. Fidu G2 : Client et Serveur embarquent encore la stack locale).
   * Défaut `true` (comportement TF2 / Certivan).
   */
  clientSlim?: boolean;
  /** Chemin include NSIS (défaut `installer.nsh`). `false` = ne pas forcer. */
  nsisInclude?: string | false;
  /** Prefixe relatif des icônes (`resources/icons/{kind}.png`). */
  iconDir?: string;
};

type JsonRecord = Record<string, unknown>;

function asRecord(v: unknown): JsonRecord {
  return v && typeof v === "object" && !Array.isArray(v)
    ? ({ ...(v as JsonRecord) } as JsonRecord)
    : {};
}

function iconFor(kind: AppKind, iconDir: string): string {
  return `${iconDir.replace(/\/+$/, "")}/${kind}.png`;
}

function applyExeIdentity(
  base: JsonRecord,
  exe: ExeIdentity,
  kind: AppKind,
  opts: {
    nsisInclude: string | false;
    iconDir: string;
  },
): void {
  base.appId = exe.appId;
  base.productName = exe.productName;
  base.executableName = exe.executableName;
  base.artifactName = exe.artifactName;
  base.directories = {
    ...asRecord(base.directories),
    output: kind === "server" ? "dist-electron-server" : "dist-electron",
  };
  base.extraMetadata = {
    ...asRecord(base.extraMetadata),
    name: exe.packageName,
    productName: exe.productName,
  };
  const nsis: JsonRecord = {
    ...asRecord(base.nsis),
    shortcutName: exe.productName,
    uninstallDisplayName: exe.productName,
    guid: exe.nsisGuid,
  };
  if (opts.nsisInclude !== false) {
    nsis.include = opts.nsisInclude;
  }
  base.nsis = nsis;
  base.publish = {
    provider: "generic",
    url: exe.feedUrl,
    useMultipleRangeRequest: false,
  };
  base.win = {
    ...asRecord(base.win),
    icon: iconFor(kind, opts.iconDir),
  };
}

/**
 * Applique les overrides Client (retire vendor/, filtre modules host-only).
 */
function applyClientSlim(
  base: JsonRecord,
  hostOnly: readonly string[],
): void {
  const filterNegations = hostOnly.flatMap((m) => [`!${m}.js`, `!${m}.js.map`]);

  base.extraResources = (Array.isArray(base.extraResources)
    ? base.extraResources
    : []
  ).filter((entry) => {
    const from =
      typeof entry === "object" && entry !== null
        ? String((entry as { from?: string }).from || "")
        : String(entry);
    return !from.startsWith("vendor/");
  });

  base.win = {
    ...asRecord(base.win),
    extraResources: [],
  };

  base.files = (Array.isArray(base.files) ? base.files : []).map((entry) =>
    entry === "build/electron/**/*"
      ? {
          from: "build/electron",
          to: "build/electron",
          filter: ["**/*", ...filterNegations],
        }
      : entry,
  );

  base.extraResources = (
    Array.isArray(base.extraResources) ? base.extraResources : []
  ).map((entry) => {
    const from =
      typeof entry === "object" && entry !== null
        ? String((entry as { from?: string }).from || "")
        : "";
    if (from !== "build/electron") return entry;
    return {
      ...(entry as JsonRecord),
      filter: ["**/*", ...filterNegations],
    };
  });
}

/**
 * Clone profond minimal (JSON) de la config de base puis applique kind.
 */
export function buildElectronBuilderConfig(
  manifest: AppManifest,
  kind: AppKind,
  baseConfig: unknown,
  options: BuildBuilderConfigOptions = {},
): JsonRecord {
  const base = JSON.parse(JSON.stringify(baseConfig ?? {})) as JsonRecord;
  const exe = exeForKind(manifest, kind);
  const nsisInclude =
    options.nsisInclude === false ? false : (options.nsisInclude ?? "installer.nsh");
  const iconDir = options.iconDir ?? "resources/icons";
  const hostOnly = options.hostOnlyModules ?? DEFAULT_HOST_ONLY_ELECTRON_MODULES;
  const clientSlim = options.clientSlim !== false;

  applyExeIdentity(base, exe, kind, { nsisInclude, iconDir });

  if (kind === "client" && clientSlim) {
    applyClientSlim(base, hostOnly);
  }

  if (manifest.copyright) {
    base.copyright = manifest.copyright;
  }

  return base;
}
