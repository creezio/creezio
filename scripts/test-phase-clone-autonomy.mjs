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
 *   3. docker/server.Dockerfile + .dockerignore matérialisés (docker build
 *      sans CREEZIO_KIT_ROOT) ;
 *   4. la factory génère des apps qui embarquent ces artefacts d'office.
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

/** Assertions « clone autonome » sur un arbre monorepo marque. */
function assertStandaloneTree(tree, label, { stageClient = true } = {}) {
  // 1. Artefacts distribution matérialisés.
  for (const f of [
    "scripts/stage-client-vendor.mjs",
    "docker/server.Dockerfile",
    ".dockerignore",
  ]) {
    assert.ok(fs.existsSync(path.join(tree, f)), `${label}: ${f} manquant`);
  }
  const df = fs.readFileSync(path.join(tree, "docker/server.Dockerfile"), "utf8");
  assert.match(df, /^FROM node:/m, `${label}: Dockerfile matérialisé invalide`);
  assert.match(df, /brand-kernel-harness/, `${label}: Dockerfile sans harness`);

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

test("kit : artefacts distribution autonome (SoT docker/server/)", () => {
  const stage = path.join(DOCKER_SERVER, "stage-client-vendor.mjs");
  assert.ok(fs.existsSync(stage), "docker/server/stage-client-vendor.mjs manquant");
  const check = spawnSync(process.execPath, ["--check", stage], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, `stage-client-vendor.mjs invalide: ${check.stderr}`);

  // Le sync canonique matérialise stage + Dockerfile + .dockerignore en marque.
  const sync = fs.readFileSync(
    path.join(ROOT, "scripts/sync-creezio-vendor.sh"),
    "utf8",
  );
  assert.match(sync, /stage-client-vendor\.mjs/, "sync ne matérialise pas le stage client");
  assert.match(sync, /ensure-server-lock\.mjs/, "sync ne matérialise pas ensure-server-lock");
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
      "docker/server.Dockerfile",
      ".dockerignore",
    ]) {
      assert.ok(fs.existsSync(path.join(appDir, f)), `app générée: ${f} manquant`);
    }
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
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
