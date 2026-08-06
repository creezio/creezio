/**
 * Gate — cohérence package-lock marque (Docker npm ci).
 *
 * Empêche la régression « marque neuve → docker build lock incohérent →
 * agents cassent server/node_modules symlink ».
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadLockHelpers() {
  const dist = path.join(ROOT, "packages/factory/dist/package-lock.js");
  const src = path.join(ROOT, "packages/factory/src/package-lock.ts");
  if (fs.existsSync(dist)) {
    return import(pathToFileURL(dist).href);
  }
  // Dev sans dist : transpile via tsx si dispo, sinon skip soft impossible —
  // la gate kit exige le build factory (comme les autres gates factory).
  assert.ok(
    fs.existsSync(dist) || fs.existsSync(src),
    "packages/factory/src/package-lock.ts manquant",
  );
  assert.ok(
    fs.existsSync(dist),
    "packages/factory/dist/package-lock.js absent — npm run build -w @creezio/factory",
  );
}

test("isPackageLockInSync : match / mismatch / absent", async () => {
  const { isPackageLockInSync } = await loadLockHelpers();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-lock-"));
  try {
    const pkgPath = path.join(dir, "package.json");
    const lockPath = path.join(dir, "package-lock.json");
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "probe",
        dependencies: { hono: "^4.0.0" },
        devDependencies: { typescript: "^5.0.0" },
      }),
    );
    assert.equal(isPackageLockInSync(pkgPath), false, "sans lock → false");

    fs.writeFileSync(
      lockPath,
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {
            dependencies: { hono: "^4.0.0" },
            // manque typescript
          },
        },
      }),
    );
    assert.equal(
      isPackageLockInSync(pkgPath),
      false,
      "devDep manquante dans lock → false",
    );

    fs.writeFileSync(
      lockPath,
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {
            dependencies: { hono: "^4.0.0" },
            devDependencies: { typescript: "^5.0.0" },
          },
        },
      }),
    );
    assert.equal(isPackageLockInSync(pkgPath), true, "lock aligné → true");

    fs.writeFileSync(
      lockPath,
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {
            dependencies: { hono: "^3.0.0" },
            devDependencies: { typescript: "^5.0.0" },
          },
        },
      }),
    );
    assert.equal(
      isPackageLockInSync(pkgPath),
      false,
      "version déclarée différente → false",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("Dockerfile : fallback npm install si npm ci échoue", () => {
  const df = fs.readFileSync(
    path.join(ROOT, "docker/server/Dockerfile"),
    "utf8",
  );
  assert.match(df, /npm ci --omit=dev/);
  assert.match(df, /fallback npm install/);
  assert.match(df, /npm install --omit=dev/);
});

test("push GitHub + ensureBrandStandalone régénèrent le lock", () => {
  const gh = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/github-repos.ts"),
    "utf8",
  );
  assert.match(gh, /prepareBrandDistribution/);

  const cli = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  assert.match(cli, /ensureBrandPackageLocks/);
  assert.match(cli, /isPackageLockInSync/);
  assert.match(cli, /mode: "install"/);
});

test("new-app / brand apply appellent prepareBrandDistribution", () => {
  const mainCli = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/cli.ts"),
    "utf8",
  );
  assert.match(mainCli, /prepareBrandDistribution/);
  const brandCli = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/brand-cli.ts"),
    "utf8",
  );
  assert.match(brandCli, /prepareBrandDistribution/);
});

test("ensure-server-lock.mjs autonome (syntaxe + contrat)", () => {
  const script = path.join(ROOT, "docker/server/ensure-server-lock.mjs");
  assert.ok(fs.existsSync(script));
  const check = spawnSync(process.execPath, ["--check", script], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, check.stderr);
  const src = fs.readFileSync(script, "utf8");
  assert.match(src, /package-lock-only/);
  assert.doesNotMatch(src, /ln -sfn.*node_modules|renameSync.*node_modules/);
});

test("prepareBrandDistribution produit un lock server/ sur marque minimale", async () => {
  const { isPackageLockInSync } = await loadLockHelpers();
  const prepMod = await import(
    pathToFileURL(
      path.join(ROOT, "packages/factory/dist/prepare-brand-distribution.js"),
    ).href,
  );
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-prep-"));
  try {
    const server = path.join(dir, "server");
    fs.mkdirSync(server, { recursive: true });
    fs.mkdirSync(path.join(dir, "vendor/creezio/probe"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "vendor/creezio/probe/package.json"),
      JSON.stringify({ name: "@creezio/probe", version: "0.0.1", type: "module" }),
    );
    fs.writeFileSync(
      path.join(dir, "vendor/creezio/SYNC.json"),
      JSON.stringify({ packages: ["probe"] }),
    );
    fs.symlinkSync("../vendor", path.join(server, "vendor"));
    fs.writeFileSync(
      path.join(server, "package.json"),
      JSON.stringify({
        name: "@creezio/app-prep",
        private: true,
        type: "module",
        dependencies: {
          "@creezio/probe": "file:vendor/creezio/probe",
          ms: "^2.1.3",
        },
      }),
    );
    const r = prepMod.prepareBrandDistribution(dir, {
      log: () => {},
    });
    assert.ok(
      isPackageLockInSync(path.join(server, "package.json")),
      "lock server absent/incohérent après prepare",
    );
    assert.ok(
      r.locksRefreshed.includes("server") ||
        fs.existsSync(path.join(server, "package-lock.json")),
      "prepare n'a pas produit server/package-lock.json",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
