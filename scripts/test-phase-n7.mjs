#!/usr/bin/env node
/**
 * Phase N7 — supplier-tabs hors métier Certivan / Fidu.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerRoot = path.resolve(root, "..");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

function loc(file) {
  return fs.readFileSync(file, "utf8").split("\n").length;
}

test("N7.1 PHASE-N7.md + PLAN-N N7 livré", () => {
  const phase = fs.readFileSync(path.join(root, "docs/PHASE-N7.md"), "utf8");
  assert.match(phase, /supplier-tabs/i);
  assert.match(phase, /Sign-off|gates verts/i);
  assert.match(phase, /test-phase-n7/);
  assert.match(phase, /browser-tabs/);
  assert.match(phase, /Paperclip = mort/);
  assert.doesNotMatch(phase, PAPERCLIP_RE);

  const plan = fs.readFileSync(path.join(root, "docs/PLAN-N.md"), "utf8");
  assert.match(plan, /## N7 —/);
  assert.match(plan, /PHASE-N7\.md/);
  assert.match(plan, /Done|livr|Sign-off/i);
});

test("N7.2 kit browser-tabs + exports", () => {
  const mgr = path.join(
    root,
    "packages/electron-shell/src/host/browser-tabs/browser-tab-manager.ts",
  );
  assert.ok(fs.existsSync(mgr));
  assert.ok(loc(mgr) > 400);
  const idx = fs.readFileSync(
    path.join(root, "packages/electron-shell/src/host/browser-tabs/index.ts"),
    "utf8",
  );
  assert.match(idx, /configureBrowserTabs/);
  assert.match(idx, /SupplierTabManager|BrowserTabManager/);
  const pkg = JSON.parse(
    fs.readFileSync(
      path.join(root, "packages/electron-shell/package.json"),
      "utf8",
    ),
  );
  assert.ok(pkg.exports?.["./browser-tabs"], "exports ./browser-tabs");
  const shellIdx = fs.readFileSync(
    path.join(root, "packages/electron-shell/src/index.ts"),
    "utf8",
  );
  assert.match(shellIdx, /browser-tabs/);
  // Pas d'export barrel (évite electron dans les tests Node).
  assert.doesNotMatch(shellIdx, /export \{[^}]*configureBrowserTabs/);
});

test("N7.3 TF métier local ; CV+Fidu façades ≤40", () => {
  const tf = path.join(dockerRoot, "tempoflow2/crm/electron/supplier-tabs.ts");
  assert.ok(fs.existsSync(tf));
  assert.ok(loc(tf) > 400, `TF supplier-tabs trop court: ${loc(tf)}`);
  assert.match(fs.readFileSync(tf, "utf8"), /class SupplierTabManager/);

  for (const brand of ["certivan-app", "fidu"]) {
    const tabs = path.join(dockerRoot, brand, "crm/electron/supplier-tabs.ts");
    const driver = path.join(
      dockerRoot,
      brand,
      "crm/electron/supplier-driver.ts",
    );
    assert.ok(fs.existsSync(tabs), `${brand}: supplier-tabs manquant`);
    assert.ok(loc(tabs) <= 40, `${brand}: supplier-tabs ${loc(tabs)} > 40`);
    const tabsBody = fs.readFileSync(tabs, "utf8");
    assert.match(
      tabsBody,
      /electron-shell\/dist\/host\/browser-tabs|@creezio\/electron-shell\/browser-tabs/,
      `${brand}: pas de façades kit`,
    );
    assert.ok(fs.existsSync(driver));
    assert.ok(loc(driver) <= 40);
    assert.match(
      fs.readFileSync(driver, "utf8"),
      /electron-shell\/dist\/host\/browser-tabs|@creezio\/electron-shell\/browser-tabs/,
    );
    assert.ok(
      !fs.existsSync(path.join(dockerRoot, brand, "crm/electron/tab-url.ts")),
      `${brand}: tab-url local encore présent`,
    );
  }
});

test("N7.4 Paperclip mort", () => {
  const dirs = [
    path.join(root, "packages/electron-shell/src/host/browser-tabs"),
  ];
  for (const d of dirs) {
    for (const name of fs.readdirSync(d)) {
      if (!/\.ts$/.test(name)) continue;
      const body = fs.readFileSync(path.join(d, name), "utf8");
      assert.doesNotMatch(body, PAPERCLIP_RE);
    }
  }
});
