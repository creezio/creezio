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

/**
 * Packages @creezio/* requis au runtime du main Electron packagé.
 * (desktop-tooling = tooling de build uniquement — hors asar.)
 *
 * Les apps marques branchent ces packages via `file:vendor/creezio/…` (symlink
 * dans node_modules). Or electron-builder.yml exclut `node_modules/**` puis
 * ne ré-inclut que electron-updater → crash packaged :
 * `Cannot find module '@creezio/brand-config'`.
 *
 * On copie donc depuis `vendor/creezio/<pkg>` (fichiers réels) vers
 * `node_modules/@creezio/<pkg>` dans l'asar — indépendant des symlinks npm.
 */
export const CREEZIO_ASAR_RUNTIME_PACKAGES = [
  "brand-config",
  "platform-core",
  "product-hub",
  "shell",
  "electron-shell",
  // H3 — brand-runtime (api-kernel / mcp / shell-ui / auth) dans le main
  "api-kernel",
  "mcp-facade",
  "shell-ui",
  "auth",
] as const;

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
  /**
   * Embarque `@creezio/*` runtime depuis `vendor/creezio/` dans l'asar.
   * - `true` : toujours
   * - `false` : jamais (demobrand / workspace sans vendor)
   * - `undefined` (défaut) : auto si `files` contient une exclusion `!node_modules`
   */
  packCreezioVendor?: boolean;
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

function creezioAsarFileSets(): JsonRecord[] {
  return CREEZIO_ASAR_RUNTIME_PACKAGES.map((name) => ({
    from: `vendor/creezio/${name}`,
    to: `node_modules/@creezio/${name}`,
    filter: ["package.json", "dist-cjs/**/*"],
  }));
}

function filesAlreadyPackCreezio(files: unknown[]): boolean {
  return files.some((entry) => {
    if (typeof entry === "string") {
      return (
        entry.includes("node_modules/@creezio") ||
        entry.includes("vendor/creezio/")
      );
    }
    if (entry && typeof entry === "object") {
      const rec = entry as { from?: string; to?: string };
      const from = String(rec.from || "");
      const to = String(rec.to || "");
      return (
        from.includes("vendor/creezio/") ||
        to.includes("node_modules/@creezio/") ||
        from.includes("node_modules/@creezio")
      );
    }
    return false;
  });
}

function filesExcludeNodeModules(files: unknown[]): boolean {
  return files.some(
    (entry) => typeof entry === "string" && entry.includes("!node_modules"),
  );
}

/**
 * Ré-inclut les packages runtime @creezio/* dans l'asar quand la config
 * exclut `node_modules/**` (pattern TF2 / Certivan / Fidu).
 */
function ensureCreezioVendorInAsar(
  base: JsonRecord,
  pack: boolean | undefined,
): void {
  const files = Array.isArray(base.files) ? [...(base.files as unknown[])] : [];
  const shouldPack =
    pack === true ||
    (pack !== false && filesExcludeNodeModules(files));
  if (!shouldPack || filesAlreadyPackCreezio(files)) {
    base.files = files;
    return;
  }
  base.files = [...files, ...creezioAsarFileSets()];
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

  ensureCreezioVendorInAsar(base, options.packCreezioVendor);

  if (manifest.copyright) {
    base.copyright = manifest.copyright;
  }

  return base;
}
