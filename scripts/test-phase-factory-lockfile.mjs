/**
 * Gate — cohérence package-lock marque (Docker npm ci).
 *
 * Empêche la régression « marque neuve → docker build lock incohérent →
 * agents cassent server/node_modules symlink ».
 */
import assert from "node:assert/strict";
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
  assert.match(gh, /ensureBrandPackageLocks/);
  assert.match(gh, /lock-only/);

  const cli = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  assert.match(cli, /ensureBrandPackageLocks/);
  assert.match(cli, /isPackageLockInSync/);
  assert.match(cli, /mode: "install"/);
});
