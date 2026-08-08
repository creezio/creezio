#!/usr/bin/env node
/**
 * Build workspaces — source de vérité UNIQUE générée depuis le graphe
 * npm workspaces (fix P1 : `build` et `build:packages` étaient deux listes
 * manuscrites divergentes ; os-ui / interactive-demo / landing / admin
 * manquaient au `build` par défaut → dist obsolètes).
 *
 * Usage :
 *   node scripts/build-workspaces.mjs                # tous les workspaces
 *   node scripts/build-workspaces.mjs --packages-only # packages/* seulement
 *   node scripts/build-workspaces.mjs --list          # dry-run (ordre topo)
 *
 * L'ordre est un tri topologique des deps `@creezio/*` (dependencies +
 * devDependencies + peerDependencies) — plus de liste à maintenir à la main.
 * `scripts/build-cjs.mjs` est exécuté en fin de build (comme avant pour
 * build:packages ; désormais aussi pour le build complet).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesOnly = process.argv.includes("--packages-only");
const listOnly = process.argv.includes("--list");

const rootPkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const globs = rootPkg.workspaces || [];

/** @type {Map<string, { dir: string; deps: string[] }>} */
const workspaces = new Map();
for (const glob of globs) {
  const base = glob.replace(/\/\*$/, "");
  if (packagesOnly && base !== "packages") continue;
  const baseDir = path.join(root, base);
  if (!fs.existsSync(baseDir)) continue;
  for (const entry of fs.readdirSync(baseDir)) {
    const pkgPath = path.join(baseDir, entry, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (!pkg.scripts?.build) continue;
    const deps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ].filter((d) => d.startsWith("@creezio/"));
    workspaces.set(pkg.name, { dir: path.join(base, entry), deps });
  }
}

// Tri topologique (DFS post-ordre) — deps hors graphe ignorées. Les cycles
// (ex. platform-core ↔ auth, builds TS indépendants des dist) sont cassés
// de façon déterministe avec un warning, comme le faisait implicitement
// l'ancienne liste manuscrite.
const order = [];
const state = new Map(); // 0 = en cours, 1 = fait
const warnedCycles = new Set();
function visit(name, chain) {
  if (state.get(name) === 1) return;
  if (state.get(name) === 0) {
    const cycle = [...chain.slice(chain.indexOf(name)), name].join(" → ");
    if (!warnedCycles.has(cycle)) {
      warnedCycles.add(cycle);
      console.warn(`[build-workspaces] cycle cassé : ${cycle}`);
    }
    return;
  }
  state.set(name, 0);
  const ws = workspaces.get(name);
  for (const dep of ws.deps) {
    if (workspaces.has(dep)) visit(dep, [...chain, name]);
  }
  state.set(name, 1);
  order.push(name);
}
for (const name of [...workspaces.keys()].sort()) visit(name, []);

if (listOnly) {
  for (const name of order) console.log(name);
  process.exit(0);
}

for (const name of order) {
  console.log(`\n[build-workspaces] ${name}`);
  execSync(`npm run build -w ${name}`, { cwd: root, stdio: "inherit" });
}
execSync("node scripts/build-cjs.mjs", { cwd: root, stdio: "inherit" });
console.log(
  `\n[build-workspaces] OK — ${order.length} workspaces (${packagesOnly ? "packages" : "packages + apps"}) + build-cjs`,
);
