#!/usr/bin/env node
/**
 * Installe les deps serveur avec le layout hôte = Docker :
 *   {marque}/node_modules          ← vrai dossier (après npm ci)
 *   {marque}/server/node_modules   ← symlink → ../node_modules
 *
 * Pourquoi : les packages `@creezio/*` sont des `file:vendor/creezio/<pkg>`
 * (symlinks). Node résout depuis le **realpath** du package
 * (`…/vendor/creezio/<pkg>`), puis walk-up jusqu'à un `node_modules`
 * ancêtre — donc `{marque}/node_modules`, miroir de `/app/node_modules`
 * dans le Dockerfile. Un `npm ci --prefix server` seul laisse les deps
 * sous `server/node_modules` → résolution vendor cassée sur l'hôte
 * (harness / `metier:api` / smokes).
 *
 * Docker : le Dockerfile COPY déjà vers `/app/node_modules` — ce script
 * n'est **pas** requis dans l'image. Il est obligatoire pour tout clone
 * hôte (harness, tests, desktop).
 *
 * SoT kit : `docker/server/install-server-deps.mjs` — matérialisé en marque
 * `scripts/install-server-deps.mjs` (sync + scaffold). Ne pas éditer la
 * copie marque : elle est rafraîchie.
 *
 * Usage (racine marque) :
 *   node scripts/install-server-deps.mjs
 *   # ou : npm run install:server-deps
 *
 * Options :
 *   --no-ci   rebascule seulement le layout (si server/node_modules est
 *             déjà un vrai dossier post-`npm ci`)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server");
const serverNm = path.join(serverDir, "node_modules");
const rootNm = path.join(root, "node_modules");
const noCi = process.argv.includes("--no-ci");

function readNmLink(linkPath) {
  try {
    const st = fs.lstatSync(linkPath);
    if (!st.isSymbolicLink()) return null;
    return fs.readlinkSync(linkPath);
  } catch {
    return null;
  }
}

function layoutOk() {
  const target = readNmLink(serverNm);
  if (target == null) return false;
  const resolved = path.resolve(path.dirname(serverNm), target);
  return resolved === rootNm && fs.existsSync(rootNm);
}

/** Rebascule server/node_modules → racine + symlink (idempotent). */
function applyHostNodeModulesLayout() {
  if (layoutOk()) {
    console.log(
      "install-server-deps: layout déjà OK (server/node_modules → ../node_modules)",
    );
    return;
  }

  let st;
  try {
    st = fs.lstatSync(serverNm);
  } catch {
    throw new Error(
      "server/node_modules absent — lancer sans --no-ci (npm ci --prefix server).",
    );
  }

  if (st.isSymbolicLink()) {
    // Symlink incorrect ou dangling : on le retire ; l'appelant doit re-ci.
    fs.unlinkSync(serverNm);
    throw new Error(
      "server/node_modules était un symlink inattendu (retiré).\n" +
        "Relancer sans --no-ci pour réinstaller puis rebasculer.",
    );
  }
  if (!st.isDirectory()) {
    throw new Error(`server/node_modules n'est ni dossier ni symlink: ${serverNm}`);
  }

  if (fs.existsSync(rootNm)) {
    fs.rmSync(rootNm, { recursive: true, force: true });
  }
  fs.renameSync(serverNm, rootNm);
  fs.symlinkSync("../node_modules", serverNm);
  console.log(
    "install-server-deps: layout posé — node_modules/ + server/node_modules → ../node_modules",
  );
}

function main() {
  if (!fs.existsSync(path.join(serverDir, "package.json"))) {
    console.error(`ERROR: ${serverDir}/package.json introuvable`);
    process.exit(1);
  }

  if (!noCi) {
    // npm ci remplace un symlink server/node_modules par un vrai dossier.
    console.log("install-server-deps: npm ci --prefix server …");
    const r = spawnSync("npm", ["ci", "--prefix", serverDir], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      console.warn(
        "install-server-deps: npm ci a échoué — fallback npm install --prefix server",
      );
      const r2 = spawnSync("npm", ["install", "--prefix", serverDir], {
        cwd: root,
        stdio: "inherit",
        env: process.env,
      });
      if (r2.status !== 0) process.exit(r2.status ?? 1);
    }
  } else if (!fs.existsSync(serverNm) && !fs.existsSync(rootNm)) {
    console.error("ERROR: --no-ci mais aucun node_modules (server/ ni racine)");
    process.exit(1);
  }

  if (layoutOk()) {
    console.log("install-server-deps: layout déjà OK");
    process.exit(0);
  }

  try {
    applyHostNodeModulesLayout();
  } catch (err) {
    console.error(`ERROR: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();
