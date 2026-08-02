/**
 * Résout la racine de la marque sonde TempoFlow3 hors monorepo kit.
 *
 * Ordre :
 * 1. CREEZIO_TEMPOFLOW3_ROOT
 * 2. apps/tempoflow3 (legacy — ne doit plus exister sur main)
 * 3. ../tempoflow3 (sibling clone, ex. /opt/docker/tempoflow3)
 * 4. /opt/docker/tempoflow3
 *
 * @param {string} kitRoot
 * @returns {string|null}
 */
import fs from "node:fs";
import path from "node:path";

export function resolveProbeBrandRoot(kitRoot) {
  const candidates = [
    process.env.CREEZIO_TEMPOFLOW3_ROOT,
    path.join(kitRoot, "apps/tempoflow3"),
    path.resolve(kitRoot, "../tempoflow3"),
    "/opt/docker/tempoflow3",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const root = path.resolve(candidate);
    if (
      fs.existsSync(path.join(root, "src/electron/brand-migrations.ts")) ||
      fs.existsSync(path.join(root, "src/electron/main.ts"))
    ) {
      return root;
    }
  }
  return null;
}

export function probeBrandPresent(kitRoot) {
  const root = resolveProbeBrandRoot(kitRoot);
  return Boolean(
    root && fs.existsSync(path.join(root, "src/electron/brand-migrations.ts")),
  );
}
