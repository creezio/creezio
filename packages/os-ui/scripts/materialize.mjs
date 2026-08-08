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

/**
 * Routes OS que la marque possède déjà en dehors du groupe (creezio-os) :
 * `ui/app/<route>/page.tsx` métier → le wrapper kit est SKIPPÉ, sinon Next
 * refuse le build (« two parallel pages that resolve to the same path »).
 * C'est le contrat « l'architecture accueille l'app » : une page métier
 * verbatim (ex. /onboarding, /parametres TF) prime toujours sur le wrapper.
 *
 * La possession est **exacte, pas récursive** : `/parametres` métier ne doit
 * pas emporter l'enfant kit `/parametres/email` (chemins finaux différents,
 * aucune collision Next) — sinon la page disparaît silencieusement du build.
 */
function brandOwnedRouteDirs(appDir, files) {
  const owned = new Set();
  const routeDirs = new Set(
    files
      .filter((rel) => /(^|\/)page\.(tsx|ts|jsx|js)$/.test(rel))
      .map((rel) => path.dirname(rel)),
  );
  for (const dir of routeDirs) {
    if (dir === ".") continue;
    for (const ext of ["tsx", "ts", "jsx", "js"]) {
      if (fs.existsSync(path.join(appDir, dir, `page.${ext}`))) {
        owned.add(dir);
        break;
      }
    }
  }
  return owned;
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
  const appDir = path.join(appRoot, "ui", "app");
  const owned = brandOwnedRouteDirs(appDir, files);
  const skipped = new Set();
  let copied = 0;
  for (const rel of files) {
    const routeDir = path.dirname(rel).split(path.sep).join("/");
    if (owned.has(routeDir)) {
      skipped.add(routeDir);
      continue;
    }
    const from = path.join(ROUTES_SRC, rel);
    const to = path.join(destApp, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
  for (const dir of [...skipped].sort()) {
    console.log(`  skip /${dir} — page métier marque (ui/app/${dir}/page.*)`);
  }

  // Marker pour diagnostics / allowlist locale
  fs.writeFileSync(
    path.join(destApp, ".materialized-from-os-ui"),
    `kit=@creezio/os-ui\nsource=${ROUTES_SRC}\nat=${new Date().toISOString()}\n`,
  );

  console.log(
    `OK os-ui materialize → ${path.relative(appRoot, destApp) || destApp} (${copied} files, ${skipped.size} routes marque)`,
  );
}

main();
