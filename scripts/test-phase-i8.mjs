/**
 * Phase I8 — freeze H6 : ARCHITECTURE_VERSION + factory scaffold + parity doc.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ARCHITECTURE_VERSION } from "../packages/platform-core/dist/index.js";
import { scaffoldNewApp } from "../packages/factory/dist/index.js";
import { createDemobrandSandbox } from "../apps/demobrand/build/electron/sandbox-runtime.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("I8 ARCHITECTURE_VERSION = H6", () => {
  assert.equal(ARCHITECTURE_VERSION, "H6");
});

test("I8 demobrand feature-parity surfaces I1–I7", () => {
  const sandbox = createDemobrandSandbox();
  try {
    assert.ok(sandbox.auth);
    assert.ok(sandbox.assistant);
    assert.ok(sandbox.tasks);
    assert.ok(sandbox.mails);
    assert.ok(typeof sandbox.controlPlaneAcl === "function");
    const mounts = sandbox.api.listMounts();
    assert.ok(
      mounts.some((m) => m.id === "admin-plugins"),
      `admin-plugins missing in ${mounts.map((m) => m.id).join(",")}`,
    );
    assert.ok(mounts.some((m) => m.id === "platform-tasks"));
    assert.ok(mounts.some((m) => m.id === "platform-mails"));
  } finally {
    sandbox.close();
  }
});

test("I8 factory scaffold utilise createNavShellAdapter", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-i8-factory-"));
  const outDir = path.join(tmp, "i8freeze");
  const result = scaffoldNewApp({
    brandId: "i8freeze",
    productName: "I8 Freeze",
    domain: "i8freeze.test",
    outDir,
    force: true,
    sandbox: true,
  });
  const mainPath = path.join(result.outDir, "src/electron/main.ts");
  const main = fs.readFileSync(mainPath, "utf8");
  assert.match(main, /createNavShellAdapter/);
  assert.match(main, /registerBrandNav/);
  assert.ok(!main.includes("mergeNav(coreNavItems"));
});

test("I8 sync dry-run expect H6", () => {
  const r = spawnSync(
    "bash",
    [path.join(ROOT, "scripts/sync-creezio-vendor.sh")],
    {
      env: {
        ...process.env,
        CREEZIO_KIT_ROOT: ROOT,
        DEST: path.join(ROOT, ".tmp-vendor-i8-dry"),
        CREEZIO_SYNC_DRY_RUN: "1",
        CREEZIO_EXPECT_ARCH_VERSION: "H6",
      },
      encoding: "utf8",
    },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /ARCHITECTURE_VERSION=H6/);
});

test("I8 docs freeze présents", () => {
  for (const p of [
    "docs/PHASE-I8.md",
    "docs/FEATURE-PARITY-DEMOBRAND-H6.md",
  ]) {
    assert.ok(fs.existsSync(path.join(ROOT, p)), p);
  }
});
