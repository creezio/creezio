/**
 * Artefacts UI/env liés pack Linux / E2E navigateur.
 * Les scripts exécutables vivent dans @creezio/desktop-tooling/scripts/.
 */
import type { ProductModel } from "../product-model.js";

/** Base URL API métier — same-origin navigateur + rewrite Next. */
export function renderMetierBaseTs(): string {
  return `/**
 * Base URL de l’API métier (kernel harness / desktop).
 * - Navigateur : same-origin \`""\` → rewrite Next \`/api/v1/*\` → kernel
 * - NEXT_PUBLIC_* : bake Next (desktop Electron ou override explicite)
 * - METIER_BASE_URL : runtime injecté par startBrandUiPlane (SSR)
 * - défaut SSR/node : harness local 18791
 */
export function metierBase(): string {
  if (typeof window !== "undefined") {
    const baked = process.env.NEXT_PUBLIC_METIER_BASE_URL;
    if (baked && !/127\\.0\\.0\\.1:18791|localhost:18791/.test(baked)) {
      return baked;
    }
    return "";
  }
  if (typeof process !== "undefined") {
    if (process.env.NEXT_PUBLIC_METIER_BASE_URL) {
      return process.env.NEXT_PUBLIC_METIER_BASE_URL;
    }
    if (process.env.METIER_BASE_URL) {
      return process.env.METIER_BASE_URL;
    }
  }
  return "http://127.0.0.1:18791";
}
`;
}

/** Copie locale du helper kit (importable par smokes marque). */
export function renderLoadLocalEnvMjs(): string {
  return `/**
 * Charge \`<app>/.env\` (gitignoré) dans process.env.
 * Miroir de @creezio/desktop-tooling/scripts/load-local-env.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * @param {string} [root]
 * @returns {{ loaded: boolean, path: string, keys: string[] }}
 */
export function loadLocalEnv(root = DEFAULT_ROOT) {
  const envPath = path.join(root, ".env");
  const keys = [];
  if (!fs.existsSync(envPath)) {
    return { loaded: false, path: envPath, keys };
  }
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\\r?\\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    if (process.env[key] === undefined) {
      process.env[key] = val;
      keys.push(key);
    }
  }
  return { loaded: true, path: envPath, keys };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const r = loadLocalEnv(process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT);
  console.log(
    JSON.stringify(
      { loaded: r.loaded, path: r.path, keyCount: r.keys.length, keys: r.keys },
      null,
      2,
    ),
  );
}
`;
}

export function renderEnvExample(model: ProductModel): string {
  const brandUpper = model.brandId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return `# Copier vers \`.env\` (gitignoré). Secrets hors git.
# Préférer les alias kit génériques ; préfixe marque optionnel.

# --- Tunnel Cloudflare (provisioner) ---
CREEZIO_TUNNEL_PROVISION_URL=https://example.invalid/tunnel-<TOKEN>
CREEZIO_TUNNEL_PROVISION_TOKEN=<TOKEN>
# ${brandUpper}_TUNNEL_PROVISION_URL=…
# ${brandUpper}_TUNNEL_PROVISION_TOKEN=…

# --- Catalogue distant (optionnel, vertical CHR) ---
# CREEZIO_CATALOG_URL=https://example.invalid/catalog.db.gz
# ${brandUpper}_CATALOG_URL=…
`;
}

/** Chemins scripts génériques @creezio/desktop-tooling. */
export const TOOLING_ENSURE_LINUX_ICONS =
  "node node_modules/@creezio/desktop-tooling/scripts/ensure-linux-icons.mjs";
export const TOOLING_E2E_BROWSER =
  "node node_modules/@creezio/desktop-tooling/scripts/e2e-browser-parcours.mjs";
export const TOOLING_SMOKE_TUNNEL_CATALOG =
  "node node_modules/@creezio/desktop-tooling/scripts/smoke-tunnel-catalog.mjs";
export const TOOLING_PUBLISH =
  "bash node_modules/@creezio/desktop-tooling/scripts/publish-desktop.sh";
