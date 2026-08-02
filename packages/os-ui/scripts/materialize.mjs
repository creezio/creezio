#!/usr/bin/env node
/**
 * Copie les pages OS kit → ui/app/(creezio-os)/ d'une marque.
 * Ce dossier est gitignoré : le repo marque ne versionne que le métier.
 *
 * Usage:
 *   node packages/os-ui/scripts/materialize.mjs --app-root /path/to/brand
 *   CREEZIO_BRAND_ROOT=/path/to/brand node …/materialize.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const ROUTES_SRC = path.join(PKG_ROOT, "routes");
const ROUTE_GROUP = "(creezio-os)";

function parseArgs(argv) {
  let appRoot = process.env.CREEZIO_BRAND_ROOT || process.env.ROOT || "";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--app-root" && argv[i + 1]) {
      appRoot = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "Usage: creezio-materialize-os-ui --app-root <brandRoot>\n" +
          "Env: CREEZIO_BRAND_ROOT",
      );
      process.exit(0);
    }
  }
  if (!appRoot) {
    // Appelé depuis brand/ui : parent = brand root
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, "app")) && fs.existsSync(path.join(cwd, "next.config.mjs"))) {
      appRoot = path.resolve(cwd, "..");
    } else if (fs.existsSync(path.join(cwd, "ui", "app"))) {
      appRoot = cwd;
    }
  }
  return { appRoot: path.resolve(appRoot || ".") };
}

function walkFiles(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, base, out);
    else out.push(path.relative(base, p));
  }
  return out;
}

function main() {
  const { appRoot } = parseArgs(process.argv);
  const destApp = path.join(appRoot, "ui", "app", ROUTE_GROUP);
  if (!fs.existsSync(path.join(appRoot, "ui", "app"))) {
    console.error(`ERROR: ui/app introuvable sous ${appRoot}`);
    process.exit(1);
  }
  if (!fs.existsSync(ROUTES_SRC)) {
    console.error(`ERROR: routes OS introuvables: ${ROUTES_SRC}`);
    process.exit(1);
  }

  fs.rmSync(destApp, { recursive: true, force: true });
  fs.mkdirSync(destApp, { recursive: true });

  const files = walkFiles(ROUTES_SRC);
  for (const rel of files) {
    const from = path.join(ROUTES_SRC, rel);
    const to = path.join(destApp, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }

  // Marker pour diagnostics / allowlist locale
  fs.writeFileSync(
    path.join(destApp, ".materialized-from-os-ui"),
    `kit=@creezio/os-ui\nsource=${ROUTES_SRC}\nat=${new Date().toISOString()}\n`,
  );

  console.log(
    `OK os-ui materialize → ${path.relative(appRoot, destApp) || destApp} (${files.length} files)`,
  );
}

main();
