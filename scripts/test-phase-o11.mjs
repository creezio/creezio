#!/usr/bin/env node
/**
 * Phase O11 — Freeze plan O* (vision honnête, pas 100 % cosmétique).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerRoot = path.resolve(root, "..");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;
const BRANDS = ["tempoflow2", "certivan-app", "fidu"];

const O_GATES = [
  "o0",
  "o1",
  "o2",
  "o3",
  "o3p",
  "o4",
  "o4p",
  "o4r",
  "o4r2",
  "o4r3",
  "o4r4",
  "o5",
  "o5p",
  "o6",
  "o7",
  "o8",
  "o9",
  "o9p",
  "o10",
  "o11",
];

test("O11.1 PHASE-O11.md freeze honnête", () => {
  const doc = fs.readFileSync(path.join(root, "docs/PHASE-O11.md"), "utf8");
  assert.match(doc, /Freeze|freeze/);
  assert.match(doc, /Sign-off|gates verts/i);
  assert.match(doc, /test-phase-o11/);
  assert.match(doc, /dry-run|DRY_RUN/i);
  assert.match(doc, /~?\s*76\s*%|76\s*%/);
  assert.match(doc, /Vision honnête|vision honnête/);
  assert.match(doc, /GED|argsPreview|jumeaux/i);
  assert.match(doc, /Paperclip\s*=\s*mort|Paperclip.*mort/i);
  // Refuse un freeze qui proclame 100 % vision sans nuance
  assert.match(doc, /pas de « 100 % cosmétique »|Pas de « 100 % cosmétique »|pas 100 % cosmétique/i);
});

test("O11.2 PLAN-O O0→O11 documentés Done", () => {
  const plan = fs.readFileSync(path.join(root, "docs/PLAN-O.md"), "utf8");
  for (const h of [
    "## O0 —",
    "## O1 —",
    "## O2 —",
    "## O3 —",
    "## O3p —",
    "## O4 —",
    "## O4p —",
    "## O5 —",
    "## O5p —",
    "## O6 —",
    "## O7 —",
    "## O8 —",
    "## O9 —",
    "## O9p —",
    "## O10 —",
    "## O11 —",
  ]) {
    assert.match(plan, new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(plan, /PHASE-O11\.md/);
  assert.match(plan, /## O11 — Freeze[\s\S]*?✅/);
});

test("O11.3 gates o0–o11 dans package.json", () => {
  for (const n of O_GATES) {
    assert.ok(
      fs.existsSync(path.join(root, `scripts/test-phase-${n}.mjs`)),
      `test-phase-${n}`,
    );
  }
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(pkg, /test-phase-o11\.mjs/);
});

test("O11.4 matrice O11 + % vision honnête", () => {
  const mat = fs.readFileSync(
    path.join(root, "docs/MATRICE-NATIVE-METIER-PLUGIN.md"),
    "utf8",
  );
  assert.match(mat, /O0→O11|PHASE-O11|O11/);
  assert.match(mat, /76\s*%|~76/);
  assert.match(mat, /Paperclip/);
  assert.match(mat, /0\.10\.33|0\.1\.16|0\.1\.65/);
  assert.doesNotMatch(mat, PAPERCLIP_RE);
});

test("O11.5 SYNC kitSha ×3 + dry-run + H6", () => {
  const tip = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
  for (const id of BRANDS) {
    const syncPath = path.join(dockerRoot, id, "crm/vendor/creezio/SYNC.json");
    const sync = JSON.parse(fs.readFileSync(syncPath, "utf8"));
    assert.equal(sync.architectureVersion, "H6", id);
    assert.ok(sync.kitSha && sync.kitSha !== "unknown", `${id}: kitSha`);
    assert.ok(sync.packages.length >= 16, `${id}: packages incomplets`);

    const out = execFileSync(
      "bash",
      [path.join(dockerRoot, id, "crm/scripts/electron/sync-creezio-vendor.sh")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          CREEZIO_SYNC_DRY_RUN: "1",
          CREEZIO_KIT_ROOT: root,
        },
      },
    );
    assert.match(out, /OK dry-run/);
  }
  assert.ok(tip);
});

test("O11.6 Paperclip absent runtime kit electron-shell", () => {
  const src = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/desktop/brand-desktop-runtime.ts",
    ),
    "utf8",
  );
  assert.doesNotMatch(src, /paperclipApi|startPaperclip/);
});

test("O11.7 dettes documentées (GED / argsPreview)", () => {
  const doc = fs.readFileSync(path.join(root, "docs/PHASE-O11.md"), "utf8");
  assert.match(doc, /createFiduModuleMcpTools|GED Fidu/i);
  assert.match(doc, /argsPreview/);
  assert.match(doc, /jumeaux/i);
});
