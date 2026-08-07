/**
 * Phase I0 — gouvernance : sync vendor contrat, ARCHITECTURE_VERSION, docs.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

test("I0 docs livrables présents", () => {
  for (const p of [
    "docs/archive/PHASE-I0.md",
    "docs/archive/BACKLOG-I0.md",
    "docs/archive/REPUBLISH-POLICY.md",
    "docs/archive/gates/POST-H5.md",
    "scripts/sync-creezio-vendor.sh",
  ]) {
    assert.ok(exists(p), `missing ${p}`);
  }
});

test("I0 ARCHITECTURE_VERSION signée (H5+)", () => {
  const f = path.join(
    ROOT,
    "packages/platform-core/src/architecture-version.ts",
  );
  const s = fs.readFileSync(f, "utf8");
  const m = /ARCHITECTURE_VERSION\s*=\s*["']([^"']+)["']/.exec(s);
  assert.ok(m, "ARCHITECTURE_VERSION introuvable");
  assert.match(m[1], /^H([5-9]|\d{2,})$/);
});

test("I0 sync canonique dry-run OK", () => {
  const script = path.join(ROOT, "scripts/sync-creezio-vendor.sh");
  assert.ok(fs.statSync(script).mode & 0o111, "sync script must be executable");
  const r = spawnSync("bash", [script], {
    env: {
      ...process.env,
      CREEZIO_KIT_ROOT: ROOT,
      DEST: path.join(ROOT, ".tmp-vendor-i0-dry"),
      CREEZIO_SYNC_DRY_RUN: "1",
      // Aligné sur la version courante du kit (H6 après I8)
      CREEZIO_EXPECT_ARCH_VERSION: "",
    },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /ARCHITECTURE_VERSION=H\d+/);
  assert.match(r.stdout, /OK dry-run/);
});

test("I0 sync refuse mauvaise version attendue", () => {
  const script = path.join(ROOT, "scripts/sync-creezio-vendor.sh");
  const r = spawnSync("bash", [script], {
    env: {
      ...process.env,
      CREEZIO_KIT_ROOT: ROOT,
      DEST: path.join(ROOT, ".tmp-vendor-i0-bad"),
      CREEZIO_SYNC_DRY_RUN: "1",
      CREEZIO_EXPECT_ARCH_VERSION: "H99",
    },
    encoding: "utf8",
  });
  assert.notEqual(r.status, 0);
  assert.match(String(r.stderr) + String(r.stdout), /mismatch/i);
});

test("I0 sync refuse troncature partielle d'un vendor existant", () => {
  const script = path.join(ROOT, "scripts/sync-creezio-vendor.sh");
  const dest = path.join(ROOT, ".tmp-vendor-i0-partial");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.join(dest, "os-ui"), { recursive: true });
  fs.mkdirSync(path.join(dest, "auth"), { recursive: true });
  fs.writeFileSync(
    path.join(dest, "SYNC.json"),
    JSON.stringify(
      {
        syncedAt: new Date().toISOString(),
        architectureVersion: "H6",
        kitSha: "test",
        packages: ["os-ui", "auth", "assistant"],
      },
      null,
      2,
    ) + "\n",
  );
  const refused = spawnSync("bash", [script], {
    env: {
      ...process.env,
      CREEZIO_KIT_ROOT: ROOT,
      DEST: dest,
      CREEZIO_SYNC_DRY_RUN: "1",
      CREEZIO_EXPECT_ARCH_VERSION: "",
      CREEZIO_VENDOR_PACKAGES: "os-ui",
    },
    encoding: "utf8",
  });
  assert.notEqual(refused.status, 0, refused.stdout);
  assert.match(
    String(refused.stderr) + String(refused.stdout),
    /sync partiel refusé/i,
  );
  const allowed = spawnSync("bash", [script], {
    env: {
      ...process.env,
      CREEZIO_KIT_ROOT: ROOT,
      DEST: dest,
      CREEZIO_SYNC_DRY_RUN: "1",
      CREEZIO_EXPECT_ARCH_VERSION: "",
      CREEZIO_VENDOR_PACKAGES: "os-ui",
      CREEZIO_VENDOR_ALLOW_PARTIAL: "1",
    },
    encoding: "utf8",
  });
  assert.equal(allowed.status, 0, allowed.stderr || allowed.stdout);
  assert.match(allowed.stdout, /OK dry-run/);
  fs.rmSync(dest, { recursive: true, force: true });
});

test("I0 console expose architectureVersion", () => {
  const kitTs = fs.readFileSync(
    path.join(ROOT, "apps/console/src/lib/kit.ts"),
    "utf8",
  );
  assert.match(kitTs, /architectureVersion/);
  assert.match(kitTs, /readArchitectureVersion/);
  const route = fs.readFileSync(
    path.join(ROOT, "apps/console/src/app/api/kit-versions/route.ts"),
    "utf8",
  );
  assert.match(route, /architectureVersion/);
  const panel = fs.readFileSync(
    path.join(ROOT, "apps/console/src/components/KitVersionsPanel.tsx"),
    "utf8",
  );
  assert.match(panel, /ARCHITECTURE_VERSION/);
});

test("I0 PROPAGATION mappe packages H3–H5", () => {
  const p = fs.readFileSync(path.join(ROOT, "docs/PROPAGATION.md"), "utf8");
  for (const name of ["api-kernel", "mcp-facade", "shell-ui", "auth", "assistant"]) {
    assert.match(p, new RegExp(`\`${name}\``), `PROPAGATION missing ${name}`);
  }
  assert.match(p, /REPUBLISH-POLICY/);
});
