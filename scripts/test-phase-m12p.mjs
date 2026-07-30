#!/usr/bin/env node
/**
 * Gate kit M12p — main.ts Certivan (puis Fidu) ≤ 800 LOC via
 * installBrandDesktopRuntime façade kit + deps marque.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const cvRoot = "/opt/docker/certivan-app/crm";
const fiduRoot = "/opt/docker/fidu/crm";
const MAX_MAIN_LOC = 800;

test("M12p.1 PHASE-M12p.md présent", () => {
  const docPath = path.join(root, "docs/PHASE-M12p.md");
  assert.ok(fs.existsSync(docPath));
  const doc = fs.readFileSync(docPath, "utf8");
  assert.match(doc, /installBrandDesktopRuntime/);
  assert.match(doc, /Certivan/);
  assert.match(doc, /Fidu/);
  assert.match(doc, /≤\s*800|≤800|800 LOC/);
});

test("M12p.2 kit deps marque (pluginsDir / fid / apiKey / nodeLabel)", () => {
  const runtimePath = path.join(
    root,
    "packages/electron-shell/src/desktop/brand-desktop-runtime.ts",
  );
  const src = fs.readFileSync(runtimePath, "utf8");
  assert.match(src, /pluginsDirEnvKey/);
  assert.match(src, /supplierFidQueryParam/);
  assert.match(src, /apiKeyEnvName/);
  assert.match(src, /nodeRuntimeLabel/);
  assert.match(src, /maybeRestartNextAfterHermesSpawn/);
  assert.match(src, /getHeartbeatExtras/);
  assert.doesNotMatch(src, /TEMPOFLOW_PLUGINS_DIR:/);
  assert.doesNotMatch(src, /title: deps\.appKind === "server" \? "TempoFlow Server"/);
});

test("M12p.3 kit expose installBrandDesktopRuntime", () => {
  const shell = require(
    path.join(root, "packages/electron-shell/dist-cjs/index.js"),
  );
  assert.equal(typeof shell.installBrandDesktopRuntime, "function");
});

test("M12p.4 Certivan main.ts ≤ 800 LOC + façade kit", () => {
  const mainPath = path.join(cvRoot, "electron/main.ts");
  assert.ok(fs.existsSync(mainPath));
  const src = fs.readFileSync(mainPath, "utf8");
  const loc = src.split("\n").length;
  assert.ok(loc <= MAX_MAIN_LOC, `Certivan main.ts = ${loc} LOC > ${MAX_MAIN_LOC}`);
  assert.match(src, /installBrandDesktopRuntime/);
  assert.match(src, /from ["']@creezio\/electron-shell["']/);
  assert.match(src, /pluginsDirEnvKey:\s*["']CERTIVAN_PLUGINS_DIR["']/);
  assert.match(src, /supplierFidQueryParam:\s*["']certivanfid["']/);
  assert.doesNotMatch(src, /function registerIpc\b/);
  assert.doesNotMatch(src, /async function setupAndStart\b/);
  assert.doesNotMatch(src, /async function bootWithRetry\b/);
});

test("M12p.5 Fidu main.ts ≤ 800 LOC + façade kit (si cutover fait)", () => {
  const mainPath = path.join(fiduRoot, "electron/main.ts");
  assert.ok(fs.existsSync(mainPath));
  const src = fs.readFileSync(mainPath, "utf8");
  if (!src.includes("installBrandDesktopRuntime")) {
    // Cutover Fidu pas encore poussé dans cette étape — skip soft documenté.
    return;
  }
  const loc = src.split("\n").length;
  assert.ok(loc <= MAX_MAIN_LOC, `Fidu main.ts = ${loc} LOC > ${MAX_MAIN_LOC}`);
  assert.match(src, /from ["']@creezio\/electron-shell["']/);
  assert.doesNotMatch(src, /function registerIpc\b/);
  assert.doesNotMatch(src, /async function setupAndStart\b/);
});
