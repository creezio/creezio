#!/usr/bin/env node
/**
 * Phase O0 — Hygiene SYNC + purge artefacts (vision stricte post-N9).
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveBrandCrmRoot } from "./lib/brand-roots.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brands = [
  { id: "tempoflow", crm: resolveBrandCrmRoot("tempoflow2") },
  { id: "certivan", crm: resolveBrandCrmRoot("certivan-app") },
  { id: "fidu", crm: resolveBrandCrmRoot("fidu") },
];

const FULL_PACKAGES = [
  "brand-config",
  "shell",
  "platform-core",
  "product-hub",
  "electron-shell",
  "desktop-tooling",
  "api-kernel",
  "mcp-facade",
  "shell-ui",
  "onboarding",
  "cockpit",
  "auth",
  "assistant",
  "tasks",
  "mails",
  "observability",
  "automations",
  "database",
];

const PAPERCLIP_SRC = [
  "electron/paperclip-launcher.ts",
  "electron/paperclip-embed.ts",
  "electron/paperclip-config.ts",
  "electron/paperclip-runtime-bootstrap.ts",
];

const PAPERCLIP_BUILD = [
  "build/electron/paperclip-launcher.js",
  "build/electron/paperclip-embed.js",
  "build/electron/paperclip-config.js",
  "build/electron/paperclip-runtime-bootstrap.js",
];

const HOST_NA_STUBS = [
  "electron/host-na-stubs.ts",
  "build/electron/host-na-stubs.js",
  "build/electron/host-na-stubs.js.map",
];

test("O0.1 PHASE-O0.md + PLAN-O.md", () => {
  const phase = fs.readFileSync(path.join(root, "docs/archive/PHASE-O0.md"), "utf8");
  assert.match(phase, /Hygiene SYNC|polish/i);
  assert.match(phase, /Sign-off|gates verts/i);
  assert.match(phase, /test-phase-o0/);
  assert.match(phase, /host-na-stubs/);
  assert.match(phase, /c85bb0f|51c7c22|5e5367d/);
  const plan = fs.readFileSync(path.join(root, "docs/archive/PLAN-O.md"), "utf8");
  assert.match(plan, /## O0 — Hygiene/);
  assert.match(plan, /## O1 — Anti-façades Electron/);
  assert.match(plan, /## O11 — Freeze (vision|plan O\*)/);
  assert.match(plan, /Pas de O\(n\+1\) si gate O\(n\) rouge/);
  assert.match(plan, /Façades \/ stubs \/ jumeaux = NON done|façades = NON done/i);
  assert.match(plan, /Paperclip = mort/);
  assert.match(plan, /O0 — Hygiene SYNC dirty \+ polish ✅|PHASE-O0/);
});

test("O0.2 host-na-stubs + Paperclip absents src/build (3 marques)", () => {
  for (const { id, crm } of brands) {
    assert.ok(fs.existsSync(crm), `crm manquant: ${id}`);
    for (const rel of HOST_NA_STUBS) {
      assert.equal(
        fs.existsSync(path.join(crm, rel)),
        false,
        `${id}: ${rel}`,
      );
    }
    for (const rel of PAPERCLIP_SRC) {
      assert.equal(
        fs.existsSync(path.join(crm, rel)),
        false,
        `${id}: src ${rel}`,
      );
    }
    for (const rel of PAPERCLIP_BUILD) {
      assert.equal(
        fs.existsSync(path.join(crm, rel)),
        false,
        `${id}: build ${rel}`,
      );
    }
    const gitignore = fs.readFileSync(path.join(crm, ".gitignore"), "utf8");
    assert.match(gitignore, /^\/build$/m, `${id}: .gitignore /build`);
  }
});

test("O0.3 SYNC.json liste complète H6 (18 packages)", () => {
  for (const { id, crm } of brands) {
    const syncPath = path.join(crm, "vendor/creezio/SYNC.json");
    assert.ok(fs.existsSync(syncPath), `${id}: SYNC.json`);
    const sync = JSON.parse(fs.readFileSync(syncPath, "utf8"));
    assert.equal(sync.architectureVersion, "H6", `${id}: arch`);
    assert.ok(Array.isArray(sync.packages), `${id}: packages`);
    for (const pkg of FULL_PACKAGES) {
      assert.ok(
        sync.packages.includes(pkg),
        `${id}: missing package ${pkg}`,
      );
    }
    assert.equal(
      sync.packages.length,
      FULL_PACKAGES.length,
      `${id}: packages count`,
    );
  }
});

test("O0.4 sync script pin kitSha + dry-run ×3", () => {
  const syncSh = fs.readFileSync(
    path.join(root, "scripts/sync-creezio-vendor.sh"),
    "utf8",
  );
  assert.match(syncSh, /kitSha/);
  assert.match(syncSh, /git rev-parse|rev-parse --short/);
  for (const { id, crm } of brands) {
    const out = execFileSync(
      "bash",
      [path.join(crm, "scripts/electron/sync-creezio-vendor.sh")],
      {
        env: {
          ...process.env,
          CREEZIO_SYNC_DRY_RUN: "1",
          CREEZIO_KIT_ROOT: root,
        },
        encoding: "utf8",
      },
    );
    assert.match(out, /OK dry-run/, `${id}: dry-run`);
    assert.match(out, /observability/, `${id}: liste complète`);
    assert.match(out, /database/, `${id}: database`);
  }
});

test("O0.5 gate enregistrée dans npm test", () => {
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(pkg, /test-phase-o0\.mjs/);
  assert.ok(fs.existsSync(path.join(root, "scripts/test-phase-o0.mjs")));
});
