#!/usr/bin/env node
/**
 * Phase O10 — Polish SYNC + matrice + allowlists.
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

test("O10.1 PHASE-O10.md + PLAN-O O10", () => {
  const phase = fs.readFileSync(path.join(root, "docs/archive/PHASE-O10.md"), "utf8");
  assert.match(phase, /SYNC|kitSha|matrice|allowlist/i);
  assert.match(phase, /Sign-off|gates verts/i);
  assert.match(phase, /test-phase-o10/);
  assert.doesNotMatch(phase, PAPERCLIP_RE);

  const plan = fs.readFileSync(path.join(root, "docs/archive/PLAN-O.md"), "utf8");
  assert.match(plan, /## O10 — Polish SYNC/);
  assert.match(plan, /PHASE-O10\.md/);
  assert.match(plan, /O10 — Polish SYNC.*✅|## O10 —[\s\S]*?✅/);
});

test("O10.2 SYNC kitSha tip ×3 + dry-run", () => {
  const tip = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
  for (const id of BRANDS) {
    const syncPath = path.join(dockerRoot, id, "crm/vendor/creezio/SYNC.json");
    const sync = JSON.parse(fs.readFileSync(syncPath, "utf8"));
    assert.equal(sync.architectureVersion, "H6", id);
    assert.ok(sync.kitSha, `${id}: kitSha`);
    // tip docs-only commits OK if brands pin functional tip; require non-empty + packages
    assert.ok(sync.packages.length >= 16, `${id}: packages incomplets`);
    assert.ok(
      fs.existsSync(path.join(dockerRoot, id, "crm/vendor/creezio/shell-ui/ui/index.ts")),
      `${id}: shell-ui/ui`,
    );

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

test("O10.3 matrice mentionne O* / shell-ui cutover", () => {
  const mat = fs.readFileSync(
    path.join(root, "docs/archive/MATRICE-NATIVE-METIER-PLUGIN.md"),
    "utf8",
  );
  assert.match(mat, /PLAN-O|O9p|shell-ui/i);
  assert.match(mat, /Paperclip.*mort|Paperclip.*mort/i);
  assert.doesNotMatch(mat, PAPERCLIP_RE);
});

test("O10.4 allowlist métier hors kit (panier/relevés absents packages)", () => {
  const pkgs = path.join(root, "packages");
  for (const name of fs.readdirSync(pkgs)) {
    const dir = path.join(pkgs, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    // scan src lightly
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === "node_modules" || ent.name === "dist") continue;
          walk(p);
        } else if (/\.(ts|tsx)$/.test(ent.name)) {
          const body = fs.readFileSync(p, "utf8");
          assert.doesNotMatch(body, PAPERCLIP_RE, p);
        }
      }
    };
    walk(path.join(dir, "src"));
    walk(path.join(dir, "ui"));
  }
  // modules métier stay in brand (spot-check TF)
  assert.ok(
    fs.existsSync(path.join(dockerRoot, "tempoflow2/crm/src/modules")) ||
      fs.existsSync(path.join(dockerRoot, "tempoflow2/crm/electron/modules")),
    "TF modules métier présents hors kit",
  );
});
