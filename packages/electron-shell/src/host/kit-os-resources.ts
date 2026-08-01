/**
 * Ressources OS natives shippées par le kit (@creezio/electron-shell),
 * pas par la marque. Toute app Creezio résout Hermes/n8n via ce chemin
 * si `resourcesRoot` marque n’embarque pas de vendor.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

let cachedRoot: string | null = null;

/** Racine package electron-shell (…/packages/electron-shell). */
export function electronShellPackageRoot(): string {
  if (cachedRoot && fs.existsSync(cachedRoot)) return cachedRoot;
  try {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    const entry = req.resolve("@creezio/electron-shell");
    // dist/index.js ou dist-cjs/index.js → package root
    cachedRoot = path.resolve(path.dirname(entry), "..");
    if (
      !fs.existsSync(path.join(cachedRoot, "resources", "vendor"))
    ) {
      // si resolve pointe dans dist/host/… (rare) remonter encore
      const alt = path.resolve(cachedRoot, "..");
      if (fs.existsSync(path.join(alt, "resources", "vendor"))) {
        cachedRoot = alt;
      }
    }
    return cachedRoot;
  } catch {
    /* fallthrough */
  }
  // Fallback : depuis ce fichier compilé (dist/host ou dist-cjs/host)
  cachedRoot = path.resolve(__dirname, "../..");
  return cachedRoot;
}

/** `packages/electron-shell/resources` — vendor Hermes/n8n du kit. */
export function kitOsResourcesRoot(): string {
  return path.join(electronShellPackageRoot(), "resources");
}

export function kitOsVendorDir(name: "hermes-agent" | "n8n"): string {
  return path.join(kitOsResourcesRoot(), "vendor", name);
}
