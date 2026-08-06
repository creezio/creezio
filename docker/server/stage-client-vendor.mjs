#!/usr/bin/env node
/**
 * Stage client/vendor depuis le vendor racine commité — SANS kit.
 *
 * SoT kit : docker/server/stage-client-vendor.mjs — matérialisé dans chaque
 * marque en `scripts/stage-client-vendor.mjs` (sync-creezio-vendor.sh +
 * factory scaffold). Ne pas éditer la copie marque : elle est rafraîchie.
 *
 * Pourquoi : le monorepo marque commit UN vendor racine (`vendor/creezio`,
 * pré-buildé). `server/vendor` est un symlink commité, mais electron-builder
 * refuse les symlinks hors racine projet → le livrable client a besoin d'une
 * copie réelle sous `client/vendor/`. Cette copie est gitignorée et re-stagée
 * ici en hardlinks (zéro duplication disque, fallback copie).
 *
 * Usage (post-clone, avant `npm ci --prefix client`) :
 *   node scripts/stage-client-vendor.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcVendor = path.join(root, "vendor", "creezio");
const clientPkg = path.join(root, "client", "package.json");
const destVendor = path.join(root, "client", "vendor");

if (!fs.existsSync(clientPkg)) {
  console.log("stage-client-vendor: pas de client/ — rien à stager");
  process.exit(0);
}
if (!fs.existsSync(path.join(srcVendor, "SYNC.json"))) {
  console.error(
    `ERROR: vendor racine introuvable ou non synchronisé: ${srcVendor}\n` +
      "       (repo incomplet ? le vendor kit doit être commité à la racine)",
  );
  process.exit(1);
}

/** Copie récursive en hardlinks (fallback copie si cross-device/refus FS). */
function stage(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      stage(s, d);
    } else if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(s);
      try {
        fs.symlinkSync(target, d);
      } catch {
        fs.copyFileSync(s, d);
      }
    } else {
      try {
        fs.linkSync(s, d);
      } catch {
        fs.copyFileSync(s, d);
      }
    }
  }
}

const lstat = fs.existsSync(destVendor) ? fs.lstatSync(destVendor) : null;
if (lstat?.isSymbolicLink()) fs.rmSync(destVendor);
else if (lstat) fs.rmSync(destVendor, { recursive: true, force: true });

stage(srcVendor, path.join(destVendor, "creezio"));
console.log(`stage-client-vendor: OK — ${path.join(destVendor, "creezio")}`);
