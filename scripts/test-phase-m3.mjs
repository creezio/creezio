/**
 * Phase M3 — Product Hub / control-plane zéro façade TF (vision stricte).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tfCrm = "/opt/docker/tempoflow2/crm";
const hubPkg = path.join(root, "packages/product-hub");

function loc(file) {
  return fs.readFileSync(file, "utf8").split("\n").length;
}

test("M3.1 PHASE-M3.md exige startHostPluginControlPlane + ≤40 LOC", () => {
  const doc = fs.readFileSync(path.join(root, "docs/PHASE-M3.md"), "utf8");
  assert.match(doc, /startHostPluginControlPlane/);
  assert.match(doc, /@creezio\/product-hub/);
  assert.match(doc, /≤\s*40|≤40/);
  assert.doesNotMatch(doc, /stub = done|façade OK sans cutover/i);
});

test("M3.2 kit expose migrate / bindings / host-api / service-key", () => {
  const idx = fs.readFileSync(path.join(hubPkg, "src/index.ts"), "utf8");
  assert.match(idx, /migrateLegacyBrandProductHubOnce/);
  assert.match(idx, /createBrandProductHubBindings/);
  assert.match(idx, /createCachedSqliteProductHubAccessor/);
  assert.match(idx, /createProductHubHost/);
  assert.match(idx, /withBearerServiceKeyFallback/);
  assert.ok(
    fs.existsSync(path.join(hubPkg, "dist/host-api.js")),
    "dist host-api manquant — rebuild product-hub",
  );
});

test("M3.3 TF façades ≤40 LOC wiring pur", () => {
  const files = [
    "electron/plugin-control-api.ts",
    "electron/plugin-hub-store.ts",
    "src/lib/platform-stores/product-hub-adapter.ts",
    "src/lib/plugin-product-hub.ts",
  ];
  for (const rel of files) {
    const n = loc(path.join(tfCrm, rel));
    assert.ok(n <= 40, `${rel} trop long: ${n} LOC`);
  }
});

test("M3.4 TF boot = startHostPluginControlPlane + adapters verticaux", () => {
  // N1p : SoT control-extras / adapters dans le kit ; TF = bindings + barrel ≤40.
  const extras = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/host/plugins/control-extras.ts",
    ),
    "utf8",
  );
  assert.match(extras, /startHostPluginControlPlane/);
  assert.match(extras, /createControlPlaneAcl|buildControlPlaneAdapters/);
  assert.match(extras, /handlePluginControlExtras|accept-check/);

  const adapters = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/host/plugins/control-adapters.ts",
    ),
    "utf8",
  );
  assert.match(adapters, /buildPluginControlPlaneAdapters/);

  const bindings = fs.readFileSync(
    path.join(tfCrm, "electron/plugin-host-bindings.ts"),
    "utf8",
  );
  assert.match(bindings, /configurePluginHost/);
  assert.match(bindings, /createTempoflowControlPlaneAcl/);
  assert.match(bindings, /buildPluginControlPlaneAdapters/);

  const api = fs.readFileSync(
    path.join(tfCrm, "electron/plugin-control-api.ts"),
    "utf8",
  );
  assert.match(api, /@creezio\/electron-shell/);
  assert.match(api, /startPluginControlApi/);
  assert.doesNotMatch(api, /createPluginControlPlaneHandler/);
  assert.ok(
    !fs.existsSync(path.join(tfCrm, "electron/plugin-control-extras.ts")),
    "TF ne doit plus avoir de jumeau plugin-control-extras",
  );
});

test("M3.5 TF product-hub / hub-store importent le kit", () => {
  const hub = fs.readFileSync(
    path.join(tfCrm, "src/lib/plugin-product-hub.ts"),
    "utf8",
  );
  assert.match(hub, /createProductHubHost/);
  assert.match(hub, /@creezio\/product-hub/);

  const store = fs.readFileSync(
    path.join(tfCrm, "electron/plugin-hub-store.ts"),
    "utf8",
  );
  assert.match(store, /createBrandProductHubBindings/);

  const adapter = fs.readFileSync(
    path.join(tfCrm, "src/lib/platform-stores/product-hub-adapter.ts"),
    "utf8",
  );
  assert.match(adapter, /createCachedSqliteProductHubAccessor/);
  assert.doesNotMatch(adapter, /dual-write|INSERT INTO plugin_products/);
});
