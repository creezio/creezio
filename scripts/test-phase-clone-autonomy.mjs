/**
 * Gate — clone autonome des repos marque (distribution sans kit).
 *
 * Un monorepo marque poussé sur GitHub doit être utilisable par un clone qui
 * n'a PAS le kit checké out à côté :
 *   1. vendor/creezio commité (pré-buildé) + TOUTES les deps @creezio/* des
 *      livrables (root/server/client/server/ui) résolues dans le vendor —
 *      entrées exports/main présentes sur disque (anti-régression « support
 *      absent de la sync-list ») ;
 *   2. scripts/stage-client-vendor.mjs : re-stage client/vendor sans kit ;
 *   3. scripts/install-server-deps.mjs : layout hôte node_modules racine
 *      (= Docker /app/node_modules) pour résolution walk-up realpath vendor ;
 *   4. docker/server.Dockerfile + .dockerignore matérialisés (docker build
 *      sans CREEZIO_KIT_ROOT) ;
 *   5. la factory génère des apps qui embarquent ces artefacts d'office.
 *
 * Preuve layout (cette gate) :
 *   - structurelle : symlink server/node_modules → ../node_modules + script
 *     install-server-deps + README / package.json ;
 *   - post-install (TF3 archive, opt-in long via CREEZIO_CLONE_AUTONOMY_NPM_CI=1
 *     ou auto si le lock est présent) : npm ci + layout + walk-up realpath
 *     depuis vendor/creezio/platform-core trouve {tmp}/node_modules, puis
 *     require('@creezio/platform-core') SANS CREEZIO_KIT_ROOT / NODE_PATH kit.
 *
 * La partie marque simule un checkout réel : `git archive HEAD` → tmp isolé,
 * puis stage + résolution SANS CREEZIO_KIT_ROOT. Skip explicite si le repo
 * marque n'est pas présent sur la machine.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCKER_SERVER = path.join(ROOT, "docker/server");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");

/** Env sans kit : simule une machine qui n'a pas creezio checké out. */
function envWithoutKit() {
  const env = { ...process.env };
  delete env.CREEZIO_KIT_ROOT;
  delete env.CREEZIO_ROOT;
  // Pas de fuite NODE_PATH vers le kit — la preuve layout doit tenir seule.
  delete env.NODE_PATH;
  return env;
}

/** Résout la racine du repo tempoflow3 (VPS, sibling, ou env). */
function resolveTempoflow3Root() {
  const candidates = [
    process.env.CREEZIO_BRAND_ROOT_TEMPOFLOW3,
    "/opt/docker/tempoflow3",
    path.resolve(ROOT, "../tempoflow3"),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "server/package.json"))) return c;
  }
  return null;
}

/** Deps @creezio/* en file: d'un package.json → [{ name, target }]. */
function creezioFileDeps(pkgJsonPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const out = [];
  for (const field of ["dependencies", "devDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[field] || {})) {
      if (!name.startsWith("@creezio/")) continue;
      if (!String(spec).startsWith("file:")) continue;
      out.push({ name, target: String(spec).slice("file:".length) });
    }
  }
  return out;
}

/** Vérifie que le package vendoré existe et que ses entrées sont sur disque. */
function assertVendoredPackage(baseDir, dep, label) {
  const dir = path.resolve(baseDir, dep.target);
  assert.ok(
    fs.existsSync(path.join(dir, "package.json")),
    `${label}: ${dep.name} → ${dep.target} absent du vendor (sync-list incomplète ?)`,
  );
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const entries = new Set();
  if (typeof pkg.main === "string") entries.add(pkg.main);
  const dot = pkg.exports?.["."];
  if (typeof dot === "string") entries.add(dot);
  else if (dot && typeof dot === "object") {
    for (const v of Object.values(dot)) {
      if (typeof v === "string") entries.add(v);
    }
  }
  for (const rel of entries) {
    assert.ok(
      fs.existsSync(path.join(dir, rel)),
      `${label}: ${dep.name} — entrée ${rel} absente (dist non vendoré ?)`,
    );
  }
}

/** Assert structure layout hôte (symlink + script install). */
function assertHostNodeModulesLayoutArtifacts(tree, label) {
  const installScript = path.join(tree, "scripts/install-server-deps.mjs");
  assert.ok(
    fs.existsSync(installScript),
    `${label}: scripts/install-server-deps.mjs manquant`,
  );
  const scriptBody = fs.readFileSync(installScript, "utf8");
  assert.match(
    scriptBody,
    /\.\.\/node_modules/,
    `${label}: install-server-deps sans cible ../node_modules`,
  );
  assert.match(
    scriptBody,
    /renameSync|mv /,
    `${label}: install-server-deps sans rebascule (rename/mv)`,
  );

  const link = path.join(tree, "server/node_modules");
  // dangling OK (existsSync suit la cible) — lstat uniquement.
  let st;
  try {
    st = fs.lstatSync(link);
  } catch (err) {
    assert.fail(`${label}: server/node_modules inaccessible: ${err}`);
  }
  assert.ok(
    st.isSymbolicLink(),
    `${label}: server/node_modules doit être un symlink (layout hôte = Docker)`,
  );
  assert.equal(
    fs.readlinkSync(link),
    "../node_modules",
    `${label}: server/node_modules → ../node_modules`,
  );

  const rootPkgPath = path.join(tree, "package.json");
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
    assert.equal(
      rootPkg.scripts?.["install:server-deps"],
      "node scripts/install-server-deps.mjs",
      `${label}: script install:server-deps manquant dans package.json racine`,
    );
  }
}

/**
 * Walk-up Node depuis le realpath vendor → doit trouver {tree}/node_modules.
 * Puis require('@creezio/platform-core') via createRequire depuis ce realpath,
 * sans CREEZIO_KIT_ROOT ni NODE_PATH kit.
 */
function assertVendorWalkupResolvesRootNm(tree, label) {
  const vendorPc = path.join(tree, "vendor/creezio/platform-core");
  assert.ok(
    fs.existsSync(path.join(vendorPc, "package.json")),
    `${label}: vendor/creezio/platform-core absent`,
  );
  const realPc = fs.realpathSync(vendorPc);
  let d = realPc;
  let found = null;
  while (d !== path.dirname(d)) {
    const nm = path.join(d, "node_modules");
    if (fs.existsSync(nm)) {
      found = nm;
      break;
    }
    d = path.dirname(d);
  }
  assert.equal(
    found,
    path.join(tree, "node_modules"),
    `${label}: walk-up depuis realpath vendor doit trouver ${path.join(tree, "node_modules")} (trouvé: ${found})`,
  );

  // require depuis le contexte vendor (comme Node pour file: symlinks).
  const entry =
    [
      path.join(realPc, "dist-cjs/index.js"),
      path.join(realPc, "dist/index.js"),
      path.join(realPc, "package.json"),
    ].find((p) => fs.existsSync(p)) || path.join(realPc, "package.json");

  const probe = `
const { createRequire } = require("module");
const req = createRequire(${JSON.stringify(entry)});
const resolved = req.resolve("@creezio/platform-core");
if (!resolved.includes(${JSON.stringify(path.join(tree, "node_modules"))}) &&
    !resolved.includes(${JSON.stringify(path.join(tree, "vendor/creezio/platform-core"))})) {
  console.error("resolve unexpected:", resolved);
  process.exit(2);
}
req("@creezio/platform-core");
console.log("OK require @creezio/platform-core via vendor realpath");
`;
  const r = spawnSync(process.execPath, ["-e", probe], {
    encoding: "utf8",
    cwd: tree,
    env: envWithoutKit(),
  });
  assert.equal(
    r.status,
    0,
    `${label}: require @creezio/platform-core depuis vendor a échoué\n${r.stdout}\n${r.stderr}`,
  );
}

/** Assertions « clone autonome » sur un arbre monorepo marque. */
function assertStandaloneTree(tree, label, { stageClient = true } = {}) {
  // 1. Artefacts distribution matérialisés.
  for (const f of [
    "scripts/stage-client-vendor.mjs",
    "scripts/ensure-server-lock.mjs",
    "scripts/install-server-deps.mjs",
    "docker/server.Dockerfile",
    ".dockerignore",
  ]) {
    assert.ok(fs.existsSync(path.join(tree, f)), `${label}: ${f} manquant`);
  }
  const df = fs.readFileSync(path.join(tree, "docker/server.Dockerfile"), "utf8");
  assert.match(df, /^FROM node:/m, `${label}: Dockerfile matérialisé invalide`);
  assert.match(df, /brand-kernel-harness/, `${label}: Dockerfile sans harness`);

  assertHostNodeModulesLayoutArtifacts(tree, label);

  // 2. Stage client/vendor SANS kit.
  if (stageClient) {
    const r = spawnSync(
      process.execPath,
      [path.join(tree, "scripts/stage-client-vendor.mjs")],
      { encoding: "utf8", env: envWithoutKit(), cwd: tree },
    );
    assert.equal(
      r.status,
      0,
      `${label}: stage-client-vendor.mjs a échoué\n${r.stdout}\n${r.stderr}`,
    );
  }

  // 3. Toutes les deps @creezio/* file: des livrables résolues sur disque.
  const manifests = [
    ["server", path.join(tree, "server/package.json")],
    ["client", path.join(tree, "client/package.json")],
    ["server/ui", path.join(tree, "server/ui/package.json")],
  ];
  for (const [name, pkgPath] of manifests) {
    if (!fs.existsSync(pkgPath)) continue;
    const baseDir = path.dirname(pkgPath);
    const deps = creezioFileDeps(pkgPath);
    assert.ok(deps.length > 0, `${label}/${name}: aucune dep @creezio file: ?`);
    for (const dep of deps) {
      assertVendoredPackage(baseDir, dep, `${label}/${name}`);
    }
    // Anti-dérive lockfile : une dep déclarée mais absente du lock = npm ci rouge.
    const lockPath = path.join(baseDir, "package-lock.json");
    if (fs.existsSync(lockPath)) {
      const lock = fs.readFileSync(lockPath, "utf8");
      for (const dep of deps) {
        assert.ok(
          lock.includes(`"${dep.name}"`),
          `${label}/${name}: ${dep.name} déclaré mais absent de package-lock.json (npm install à rejouer)`,
        );
      }
    }
  }
}

/**
 * Micro-preuve layout sans npm ci complet : pose un faux server/node_modules,
 * applique --no-ci via le script (après avoir créé un dossier factice),
 * vérifie walk-up. Utilisé quand CREEZIO_CLONE_AUTONOMY_NPM_CI n'est pas activé
 * et qu'on veut quand même prouver le script sur l'archive.
 */
function assertLayoutScriptStructuralFix(tree, label) {
  const serverNm = path.join(tree, "server/node_modules");
  const rootNm = path.join(tree, "node_modules");
  // Remplace le symlink archive par un faux dossier (simule post-npm-ci).
  try {
    if (fs.lstatSync(serverNm).isSymbolicLink()) fs.unlinkSync(serverNm);
    else fs.rmSync(serverNm, { recursive: true, force: true });
  } catch {
    /* absent */
  }
  fs.mkdirSync(path.join(serverNm, "@creezio", "platform-core"), { recursive: true });
  // Marker pour vérifier le mv
  fs.writeFileSync(path.join(serverNm, ".layout-probe"), "1");

  const r = spawnSync(
    process.execPath,
    [path.join(tree, "scripts/install-server-deps.mjs"), "--no-ci"],
    { encoding: "utf8", cwd: tree, env: envWithoutKit() },
  );
  assert.equal(
    r.status,
    0,
    `${label}: install-server-deps --no-ci a échoué\n${r.stdout}\n${r.stderr}`,
  );
  assert.ok(fs.existsSync(path.join(rootNm, ".layout-probe")), `${label}: mv vers racine KO`);
  assert.ok(fs.lstatSync(serverNm).isSymbolicLink(), `${label}: symlink non recréé`);
  assert.equal(fs.readlinkSync(serverNm), "../node_modules");

  // Walk-up depuis vendor realpath → root node_modules
  const vendorPc = path.join(tree, "vendor/creezio/platform-core");
  if (fs.existsSync(vendorPc)) {
    const realPc = fs.realpathSync(vendorPc);
    let d = realPc;
    let found = null;
    while (d !== path.dirname(d)) {
      const nm = path.join(d, "node_modules");
      if (fs.existsSync(nm)) {
        found = nm;
        break;
      }
      d = path.dirname(d);
    }
    assert.equal(
      found,
      rootNm,
      `${label}: walk-up post-script doit trouver ${rootNm} (trouvé: ${found})`,
    );
  }
}

test("kit : artefacts distribution autonome (SoT docker/server/)", () => {
  const stage = path.join(DOCKER_SERVER, "stage-client-vendor.mjs");
  assert.ok(fs.existsSync(stage), "docker/server/stage-client-vendor.mjs manquant");
  const install = path.join(DOCKER_SERVER, "install-server-deps.mjs");
  assert.ok(fs.existsSync(install), "docker/server/install-server-deps.mjs manquant");
  const check = spawnSync(process.execPath, ["--check", stage], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, `stage-client-vendor.mjs invalide: ${check.stderr}`);
  const check2 = spawnSync(process.execPath, ["--check", install], {
    encoding: "utf8",
  });
  assert.equal(check2.status, 0, `install-server-deps.mjs invalide: ${check2.stderr}`);

  // Le sync canonique matérialise stage + Dockerfile + .dockerignore en marque.
  const sync = fs.readFileSync(
    path.join(ROOT, "scripts/sync-creezio-vendor.sh"),
    "utf8",
  );
  assert.match(sync, /stage-client-vendor\.mjs/, "sync ne matérialise pas le stage client");
  assert.match(sync, /ensure-server-lock\.mjs/, "sync ne matérialise pas ensure-server-lock");
  assert.match(sync, /install-server-deps\.mjs/, "sync ne matérialise pas install-server-deps");
  assert.match(sync, /docker\/server\.Dockerfile/, "sync ne matérialise pas le Dockerfile");
  assert.ok(
    fs.existsSync(path.join(DOCKER_SERVER, "ensure-server-lock.mjs")),
    "docker/server/ensure-server-lock.mjs manquant",
  );

  // La baseline CLI server-docker doit rester alignée sur la sync-list
  // canonique (dérive = vendor incomplet → clone cassé, bug « support »).
  const defaults = /DEFAULT_PACKAGES=\(([^)]+)\)/.exec(sync);
  assert.ok(defaults, "DEFAULT_PACKAGES introuvable dans sync-creezio-vendor.sh");
  const canonical = defaults[1].split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const cliSrc = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  for (const pkg of canonical) {
    assert.ok(
      cliSrc.includes(`"${pkg}"`),
      `server-docker-cli.ts: baseline vendor sans "${pkg}" (aligner sur DEFAULT_PACKAGES)`,
    );
  }

  // Le push GitHub factory garantit un vendor synchronisé (repo distant autonome).
  const gh = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/github-repos.ts"),
    "utf8",
  );
  assert.match(
    gh,
    /prepareBrandDistribution/,
    "push GitHub sans prepareBrandDistribution (vendor+locks)",
  );
});

test("factory : new-app génère une app avec artefacts clone autonome", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-clone-probe-"));
  const appDir = path.join(out, "cloneprobe");
  try {
    const r = spawnSync(
      process.execPath,
      [
        CLI,
        "new-app",
        "--name",
        "CloneProbe",
        "--id",
        "cloneprobe",
        "--domain",
        "cloneprobe.creez.io",
        "--out",
        appDir,
        "--force",
        "--no-push",
      ],
      {
        encoding: "utf8",
        // Skip sync+lock lourds ici : on vérifie les artefacts scaffold.
        // La prep réelle (vendor+lock) est gateée dans test-phase-factory-lockfile.
        env: {
          ...process.env,
          CREEZIO_KIT_ROOT: ROOT,
          CREEZIO_SKIP_BRAND_DIST: "1",
        },
      },
    );
    assert.equal(r.status, 0, `new-app a échoué:\n${r.stdout}\n${r.stderr}`);
    for (const f of [
      "scripts/stage-client-vendor.mjs",
      "scripts/ensure-server-lock.mjs",
      "scripts/install-server-deps.mjs",
      "docker/server.Dockerfile",
      ".dockerignore",
    ]) {
      assert.ok(fs.existsSync(path.join(appDir, f)), `app générée: ${f} manquant`);
    }
    assertHostNodeModulesLayoutArtifacts(appDir, "app générée");
    const rootPkg = JSON.parse(
      fs.readFileSync(path.join(appDir, "package.json"), "utf8"),
    );
    assert.equal(
      rootPkg.scripts?.bootstrap,
      "node scripts/stage-client-vendor.mjs",
      "app générée: script bootstrap manquant",
    );
    assert.match(
      rootPkg.scripts?.["docker:build"] || "",
      /ensure-server-lock\.mjs/,
      "app générée: docker:build sans ensure-server-lock",
    );
    assert.match(
      rootPkg.scripts?.["docker:build"] || "",
      /docker build -f docker\/server\.Dockerfile/,
      "app générée: script docker:build manquant",
    );
    const readme = fs.readFileSync(path.join(appDir, "README.md"), "utf8");
    assert.match(readme, /Clone autonome/, "app générée: README sans section clone autonome");
    assert.match(
      readme,
      /install:server-deps/,
      "app générée: README clone sans install:server-deps",
    );
    assert.match(
      readme,
      /Layout.*node_modules|hôte vs Docker/i,
      "app générée: README sans distinction hôte vs Docker",
    );
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test("tempoflow3 : checkout simulé (git archive) autonome sans kit", (t) => {
  const brand = resolveTempoflow3Root();
  if (!brand) {
    t.skip("repo tempoflow3 absent (/opt/docker/tempoflow3 ou ../tempoflow3)");
    return;
  }
  const head = spawnSync("git", ["-C", brand, "rev-parse", "HEAD"], {
    encoding: "utf8",
  });
  if (head.status !== 0) {
    t.skip(`tempoflow3 sans git (${head.stderr?.trim()})`);
    return;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-clone-sim-"));
  try {
    const r = spawnSync(
      "bash",
      ["-c", `git -C "${brand}" archive HEAD | tar -x -C "${tmp}"`],
      { encoding: "utf8" },
    );
    assert.equal(r.status, 0, `git archive a échoué: ${r.stderr}`);
    assertStandaloneTree(tmp, "tempoflow3@HEAD");

    const wantFullCi =
      process.env.CREEZIO_CLONE_AUTONOMY_NPM_CI === "1" ||
      process.env.CREEZIO_CLONE_AUTONOMY_NPM_CI === "true";

    if (wantFullCi) {
      // Preuve lourde : vrai npm ci + layout + require (sans kit).
      console.log("clone-autonomy: CREEZIO_CLONE_AUTONOMY_NPM_CI=1 — npm ci + require…");
      const install = spawnSync(
        process.execPath,
        [path.join(tmp, "scripts/install-server-deps.mjs")],
        {
          encoding: "utf8",
          cwd: tmp,
          env: envWithoutKit(),
          timeout: 600_000,
        },
      );
      assert.equal(
        install.status,
        0,
        `install-server-deps a échoué:\n${install.stdout}\n${install.stderr}`,
      );
      assertVendorWalkupResolvesRootNm(tmp, "tempoflow3@HEAD+npm-ci");
    } else {
      // Preuve structurelle + exécution --no-ci du script (rapide, VPS-friendly).
      // Documenté : la gate prouve le contrat layout ; le npm ci complet est
      // opt-in via CREEZIO_CLONE_AUTONOMY_NPM_CI=1.
      assertLayoutScriptStructuralFix(tmp, "tempoflow3@HEAD+layout-script");
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
