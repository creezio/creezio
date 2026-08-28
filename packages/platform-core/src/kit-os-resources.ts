/**
 * Ressources OS natives shippées par le kit (@creezio/electron-shell),
 * pas par la marque. Toute app Creezio résout Hermes/n8n via ce chemin
 * si `resourcesRoot` marque n’embarque pas de vendor.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createAppRequire } from "./app-require.js";
import { fileURLToPath } from "node:url";

let cachedRoot: string | null = null;

/**
 * Dossier du module compilé (dist/host ou dist-cjs/host).
 * ESM packagé (asar) : pas de `__dirname` → `import.meta.url`.
 * CJS (dist-cjs) : `import.meta` absent → `__dirname`.
 * `import.meta` / `__dirname` lus via eval pour rester compilables dual ESM/CJS.
 */
function compiledHostDir(): string {
  try {
    // eslint-disable-next-line no-eval
    const metaUrl = eval("import.meta.url") as string;
    return path.dirname(fileURLToPath(metaUrl));
  } catch {
    /* CJS */
  }
  try {
    // eslint-disable-next-line no-eval
    return eval("__dirname") as string;
  } catch {
    return process.cwd();
  }
}

function resolveFromEntry(entry: string): string | null {
  // dist/index.js ou dist-cjs/index.js → package root
  let root = path.resolve(path.dirname(entry), "..");
  if (!fs.existsSync(path.join(root, "resources", "vendor"))) {
    // si resolve pointe dans dist/host/… remonter encore
    const alt = path.resolve(root, "..");
    if (fs.existsSync(path.join(alt, "resources", "vendor"))) {
      root = alt;
    }
  }
  return fs.existsSync(path.join(root, "package.json")) ? root : null;
}

/** Racine package electron-shell (…/packages/electron-shell). */
export function electronShellPackageRoot(): string {
  if (cachedRoot && fs.existsSync(cachedRoot)) return cachedRoot;

  // 1) Depuis ce module (fiable en asar ESM + CJS)
  try {
    const req = createRequire(path.join(compiledHostDir(), "kit-os-resources.js"));
    const entry = req.resolve("@creezio/electron-shell");
    const root = resolveFromEntry(entry);
    if (root) {
      cachedRoot = root;
      return cachedRoot;
    }
  } catch {
    /* fallthrough */
  }

  // 2) Depuis cwd (dev / harness)
  try {
    const req = createAppRequire();
    const entry = req.resolve("@creezio/electron-shell");
    const root = resolveFromEntry(entry);
    if (root) {
      cachedRoot = root;
      return cachedRoot;
    }
  } catch {
    /* fallthrough */
  }

  // 3) Fallback : package frère (node_modules/@creezio/* ou packages/* —
  // ce module vit désormais dans platform-core, remonter de 2 pointe sur
  // le dossier parent commun, puis electron-shell).
  cachedRoot = path.resolve(compiledHostDir(), "../../electron-shell");
  return cachedRoot;
}

/** `packages/electron-shell/resources` — vendor Hermes/n8n du kit. */
export function kitOsResourcesRoot(): string {
  return path.join(electronShellPackageRoot(), "resources");
}

export function kitOsVendorDir(name: "hermes-agent" | "n8n"): string {
  return path.join(kitOsResourcesRoot(), "vendor", name);
}
