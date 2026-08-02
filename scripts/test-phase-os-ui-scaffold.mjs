/**
 * Gate : factory --from-prd ne versionne PLUS de pages OS dans ui/app/.
 * Les surfaces OS vivent dans @creezio/os-ui et sont matérialisées hors git.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const PRD = path.join(ROOT, "docs/experiences/tempoflow3/PRD-PRODUIT.md");

const FORBIDDEN_OS_DIRS = [
  "mails",
  "taches",
  "setup",
  "login",
  "developers",
  "settings",
  "admin",
  "cockpit",
  "mcp",
];

test("os-ui scaffold : zéro page OS versionnée, materialize + boot kit", () => {
  assert.ok(fs.existsSync(CLI), "factory CLI");
  assert.ok(fs.existsSync(PRD), "PRD produit");
  assert.ok(
    fs.existsSync(path.join(ROOT, "packages/os-ui/routes/mails/page.tsx")),
    "@creezio/os-ui routes",
  );

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-os-ui-"));
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--from-prd", PRD, "--out", out, "--force"],
    { encoding: "utf8", cwd: ROOT, timeout: 120_000 },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);

  for (const seg of FORBIDDEN_OS_DIRS) {
    assert.ok(
      !fs.existsSync(path.join(out, "ui/app", seg)),
      `ne doit pas versionner ui/app/${seg}`,
    );
  }
  assert.ok(
    !fs.existsSync(path.join(out, "ui/app/lib/creezio-ui-boot.tsx")),
    "pas de boot OS versionné",
  );

  assert.ok(
    fs.existsSync(path.join(out, "scripts/materialize-os-ui.mjs")),
    "script materialize",
  );
  const gitignore = fs.readFileSync(path.join(out, ".gitignore"), "utf8");
  assert.match(gitignore, /\(creezio-os\)/);

  const uiPkg = JSON.parse(
    fs.readFileSync(path.join(out, "ui/package.json"), "utf8"),
  );
  assert.ok(uiPkg.dependencies["@creezio/os-ui"]);
  assert.ok(uiPkg.scripts.prebuild);

  const layout = fs.readFileSync(path.join(out, "ui/app/layout.tsx"), "utf8");
  assert.match(layout, /@creezio\/os-ui\/boot/);
  assert.match(layout, /CreezioUiBoot/);
  assert.doesNotMatch(layout, /OS_NAV/);
  assert.doesNotMatch(layout, /\/mails/);

  const allow = fs.readFileSync(
    path.join(out, "scripts/test-allowlist.mjs"),
    "utf8",
  );
  assert.match(allow, /page OS versionnée interdite/);

  fs.rmSync(out, { recursive: true, force: true });
});
