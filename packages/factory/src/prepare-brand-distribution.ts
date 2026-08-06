/**
 * Prépare une marque fraîche pour Docker / clone GitHub :
 *   1. sync vendor kit → vendor/creezio
 *   2. package-lock cohérents (server, ui, client)
 *
 * Doit tourner APRÈS chaque scaffold (new-app / brand apply / demo-app),
 * pas seulement au push — sinon une marque locale ou sans token GitHub
 * part sans lock et `npm ci` Docker échoue.
 */
import { ensureBrandPackageLocks } from "./package-lock.js";
import { ensureBrandVendorSynced } from "./vendor-sync.js";

export function prepareBrandDistribution(
  brandRoot: string,
  opts?: {
    kitRoot?: string;
    log?: (line: string) => void;
    /** Défaut lock-only (pas de node_modules commité). */
    lockMode?: "lock-only" | "install";
  },
): { vendorSynced: boolean; locksRefreshed: string[] } {
  const log = opts?.log || ((l: string) => console.log(l));
  // Escape hatch tests unitaires (pas pour une vraie marque).
  if (process.env.CREEZIO_SKIP_BRAND_DIST === "1") {
    log("CREEZIO_SKIP_BRAND_DIST=1 — vendor/locks non préparés");
    return { vendorSynced: false, locksRefreshed: [] };
  }
  const vendorSynced = ensureBrandVendorSynced(brandRoot, {
    kitRoot: opts?.kitRoot,
    log,
  });
  const locks = ensureBrandPackageLocks(brandRoot, {
    mode: opts?.lockMode || "lock-only",
    log,
  });
  if (locks.refreshed.length) {
    log(`✓ package-lock prêt : ${locks.refreshed.join(", ")}`);
  }
  return { vendorSynced, locksRefreshed: locks.refreshed };
}
