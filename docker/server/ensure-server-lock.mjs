#!/usr/bin/env node
/**
 * Pré-flight Docker marque — garantit server[/ui]/package-lock.json alignés
 * sur package.json avant `docker build` / `npm ci`.
 *
 * Matérialisé en marque (`scripts/ensure-server-lock.mjs`) par scaffold +
 * sync-creezio-vendor.sh. Autonome (pas de kit, pas de @creezio/factory).
 *
 * Ne touche PAS au layout monorepo node_modules (pas de mv/symlink) —
 * uniquement le lockfile, mode --package-lock-only.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const brandRoot = path.resolve(
  process.env.CREEZIO_APP_ROOT ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
);

function declaredDeps(pkg) {
  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };
}

function lockedRootDeps(lock) {
  const root = lock.packages?.[""];
  if (root) {
    return {
      ...(root.dependencies || {}),
      ...(root.devDependencies || {}),
      ...(root.optionalDependencies || {}),
    };
  }
  if (lock.dependencies) {
    const out = {};
    for (const [name, meta] of Object.entries(lock.dependencies)) {
      out[name] = typeof meta === "string" ? meta : meta?.version;
    }
    return out;
  }
  return null;
}

function isInSync(pkgPath) {
  const lockPath = path.join(path.dirname(pkgPath), "package-lock.json");
  if (!fs.existsSync(pkgPath) || !fs.existsSync(lockPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    const declared = declaredDeps(pkg);
    const locked = lockedRootDeps(lock);
    if (!locked) return false;
    const dKeys = Object.keys(declared).sort();
    const lKeys = Object.keys(locked).sort();
    if (dKeys.length !== lKeys.length) return false;
    for (const k of dKeys) {
      if (locked[k] !== declared[k]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function ensureVendorLink(serverDir) {
  const link = path.join(serverDir, "vendor");
  const brandRootParent = path.dirname(serverDir);
  if (serverDir === brandRootParent) return;
  try {
    const st = fs.lstatSync(link);
    if (st.isSymbolicLink() || st.isDirectory()) return;
  } catch {
    /* absent */
  }
  fs.symlinkSync("../vendor", link);
}

const serverDir = fs.existsSync(path.join(brandRoot, "server/package.json"))
  ? path.join(brandRoot, "server")
  : brandRoot;

if (!fs.existsSync(path.join(serverDir, "package.json"))) {
  console.error(`ensure-server-lock: package.json introuvable sous ${brandRoot}`);
  process.exit(1);
}

ensureVendorLink(serverDir);

const dirs = [serverDir];
const uiDir = path.join(serverDir, "ui");
if (fs.existsSync(path.join(uiDir, "package.json"))) dirs.push(uiDir);

let refreshed = 0;
for (const dir of dirs) {
  const pkgPath = path.join(dir, "package.json");
  if (isInSync(pkgPath)) continue;
  const rel = path.relative(brandRoot, dir) || ".";
  console.log(
    `ensure-server-lock: package-lock manquant/incohérent (${rel}) — npm install --package-lock-only…`,
  );
  const r = spawnSync(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    { cwd: dir, stdio: "inherit", env: process.env },
  );
  if (r.status !== 0) {
    console.error(
      `ensure-server-lock: échec npm dans ${rel} (exit ${r.status ?? "?"})`,
    );
    process.exit(r.status ?? 1);
  }
  if (!isInSync(pkgPath)) {
    console.error(
      `ensure-server-lock: lock toujours incohérent dans ${rel} après npm`,
    );
    process.exit(1);
  }
  refreshed++;
}

if (refreshed === 0) {
  console.log("ensure-server-lock: package-lock OK");
} else {
  console.log(`ensure-server-lock: ${refreshed} lock(s) régénéré(s)`);
}
