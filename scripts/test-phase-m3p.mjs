/**
 * Phase M3p — Product Hub Certivan + Fidu (vision stricte).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certCrm = "/opt/docker/certivan-app/crm";
const fiduCrm = "/opt/docker/fidu/crm";

function loc(file) {
  return fs.readFileSync(file, "utf8").split("\n").length;
}

test("M3p.1 PHASE-M3p.md Certivan puis Fidu", () => {
  const doc = fs.readFileSync(path.join(root, "docs/PHASE-M3p.md"), "utf8");
  assert.match(doc, /Certivan/);
  assert.match(doc, /Fidu/);
  assert.match(doc, /startHostPluginControlPlane/);
  assert.match(doc, /≤\s*40|≤40/);
});

test("M3p.2 Certivan façades ≤40 + boot kit", () => {
  assert.ok(loc(path.join(certCrm, "electron/plugin-control-api.ts")) <= 40);
  assert.ok(loc(path.join(certCrm, "electron/plugin-hub-store.ts")) <= 40);
  assert.ok(
    loc(path.join(certCrm, "src/lib/platform-stores/product-hub-adapter.ts")) <=
      40,
  );
  assert.ok(loc(path.join(certCrm, "src/lib/plugin-product-hub.ts")) <= 40);
  const extras = fs.readFileSync(
    path.join(certCrm, "electron/plugin-control-extras.ts"),
    "utf8",
  );
  assert.match(extras, /startHostPluginControlPlane/);
  assert.match(extras, /createCertivanControlPlaneAcl/);
});

test("M3p.3 Fidu façades ≤40 + boot kit", () => {
  assert.ok(loc(path.join(fiduCrm, "electron/plugin-control-api.ts")) <= 40);
  assert.ok(loc(path.join(fiduCrm, "electron/plugin-hub-store.ts")) <= 40);
  const boot = fs.readFileSync(
    path.join(fiduCrm, "electron/plugin-control-boot.ts"),
    "utf8",
  );
  assert.match(boot, /startHostPluginControlPlane/);
  assert.match(boot, /createFiduControlPlaneAcl/);
});
