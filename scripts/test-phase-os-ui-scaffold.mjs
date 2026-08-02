/**
 * Gate : factory --from-prd génère des wrappers OS (exports @creezio/<pkg>/ui),
 * pas de fetch maison /api/v1/os|platform dans ui/app OS.
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

const OS_PAGES = [
  "ui/app/mails/page.tsx",
  "ui/app/taches/page.tsx",
  "ui/app/setup/page.tsx",
  "ui/app/login/page.tsx",
  "ui/app/developers/page.tsx",
  "ui/app/settings/page.tsx",
  "ui/app/lib/creezio-ui-boot.tsx",
];

test("os-ui scaffold : wrappers kit, pas de fetch OS maison", () => {
  assert.ok(fs.existsSync(CLI), "factory CLI");
  assert.ok(fs.existsSync(PRD), "PRD produit");

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-os-ui-"));
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--from-prd", PRD, "--out", out, "--force"],
    { encoding: "utf8", cwd: ROOT, timeout: 120_000 },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);

  for (const rel of OS_PAGES) {
    const p = path.join(out, rel);
    assert.ok(fs.existsSync(p), `manque ${rel}`);
    const src = fs.readFileSync(p, "utf8");
    assert.ok(
      !src.includes("creezio:owned-by-brand"),
      `${rel} ne doit pas être owned-by-brand`,
    );
  }

  const mails = fs.readFileSync(path.join(out, "ui/app/mails/page.tsx"), "utf8");
  assert.match(mails, /@creezio\/mails\/ui/);
  assert.doesNotMatch(mails, /\/api\/v1\/platform\/platform-mails/);

  const taches = fs.readFileSync(
    path.join(out, "ui/app/taches/page.tsx"),
    "utf8",
  );
  assert.match(taches, /@creezio\/tasks\/ui/);

  const uiPkg = JSON.parse(
    fs.readFileSync(path.join(out, "ui/package.json"), "utf8"),
  );
  assert.ok(uiPkg.dependencies["@creezio/shell-ui"]);
  assert.ok(uiPkg.dependencies["@creezio/mails"]);

  const nextCfg = fs.readFileSync(
    path.join(out, "ui/next.config.mjs"),
    "utf8",
  );
  assert.match(nextCfg, /transpilePackages/);

  const layout = fs.readFileSync(path.join(out, "ui/app/layout.tsx"), "utf8");
  assert.match(layout, /CreezioUiBoot/);
  assert.match(layout, /\/mails/);

  fs.rmSync(out, { recursive: true, force: true });
});
