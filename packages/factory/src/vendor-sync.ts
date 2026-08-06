/**
 * Sync vendor kit → marque avant distribution (push GitHub).
 *
 * Un repo marque poussé sur GitHub doit être **autonome au clone** : le vendor
 * racine (`vendor/creezio`, pré-buildé) est commité. À la génération factory
 * le vendor est vide (rempli lazy par `server-docker build`) — si on pousse à
 * ce moment-là, le repo distant est cassé. D'où : sync canonique juste avant
 * le push (kit forcément présent : la factory tourne depuis le kit).
 *
 * Escape hatch : CREEZIO_SKIP_VENDOR_SYNC=1 (tests / cas particuliers).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function kitRootDefault(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

/** Vendor marque déjà synchronisé (SYNC.json présent) ? */
export function brandVendorSynced(brandRoot: string): boolean {
  return fs.existsSync(path.join(brandRoot, "vendor/creezio/SYNC.json"));
}

/**
 * Garantit un vendor synchronisé dans la marque (no-op si déjà présent).
 * Baseline packages = liste canonique du script kit (pas d'override).
 * @returns true si un sync a été exécuté, false si déjà présent / skippé.
 */
export function ensureBrandVendorSynced(
  brandRoot: string,
  opts?: { kitRoot?: string; log?: (line: string) => void },
): boolean {
  const log = opts?.log || ((l: string) => console.log(l));
  if (process.env.CREEZIO_SKIP_VENDOR_SYNC === "1") {
    log("CREEZIO_SKIP_VENDOR_SYNC=1 — vendor non synchronisé");
    return false;
  }
  if (brandVendorSynced(brandRoot)) return false;
  const kit = path.resolve(
    opts?.kitRoot || process.env.CREEZIO_KIT_ROOT || kitRootDefault(),
  );
  const script = path.join(kit, "scripts/sync-creezio-vendor.sh");
  if (!fs.existsSync(script)) {
    throw new Error(`sync-creezio-vendor.sh introuvable sous ${kit}`);
  }
  log(`vendor/creezio vide — sync canonique depuis ${kit}…`);
  const r = spawnSync("bash", [script], {
    stdio: "inherit",
    env: {
      ...process.env,
      CREEZIO_KIT_ROOT: kit,
      ROOT: brandRoot,
    },
  });
  if (r.status !== 0) {
    throw new Error(`sync vendor échoué (exit ${r.status})`);
  }
  return true;
}
