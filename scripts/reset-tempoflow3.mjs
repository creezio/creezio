#!/usr/bin/env node
/**
 * Reset scripté TempoFlow3 : backup → brand apply --force →
 * les fichiers creezio:owned-by-brand / creezio.ownedByBrand sont préservés.
 *
 * Usage:
 *   node scripts/reset-tempoflow3.mjs
 *   node scripts/reset-tempoflow3.mjs --no-proof
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "apps/tempoflow3");
const SPEC = path.join(APP, "brand-spec");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const noProof = process.argv.includes("--no-proof");

const env = {
  ...process.env,
  CREEZIO_ROOT: ROOT,
  NODE_PATH: path.join(ROOT, "node_modules"),
  PATH: [
    path.join(ROOT, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

function run(cmd, args, cwd = ROOT) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: "utf8",
    shell: cmd !== process.execPath,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    throw new Error(`fail status=${r.status}`);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join("/tmp", `tf3-reset-${stamp}`);
console.log(`backup → ${backup}`);
fs.cpSync(APP, backup, { recursive: true });

run(process.execPath, [CLI, "brand", "doctor", "--spec", SPEC]);
run(process.execPath, [
  CLI,
  "brand",
  "apply",
  "--spec",
  SPEC,
  "--out",
  APP,
  "--force",
]);

// Vérifie marqueurs owned
const mod = fs.readFileSync(
  path.join(APP, "src/electron/brand-module-api.ts"),
  "utf8",
);
if (!mod.includes("creezio:owned-by-brand")) {
  console.warn(
    "WARN: brand-module-api sans owned-by-brand — métier peut avoir été régénéré",
  );
} else {
  console.log("OK brand-module-api préservé (owned-by-brand)");
}
if (!fs.existsSync(path.join(APP, "src/electron/brand-bonus-api.ts"))) {
  console.warn("WARN: brand-bonus-api absent après apply");
} else {
  console.log("OK brand-bonus-api présent");
}

run("npm", ["run", "build:electron"], APP);
run("npm", ["run", "build:ui"], APP);

if (!noProof) {
  run("npm", ["run", "proof:oracle"], APP);
  run("npm", ["run", "proof:hard"], APP);
}

console.log(`\nRESET OK — backup=${backup}`);
