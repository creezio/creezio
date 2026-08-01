#!/usr/bin/env node
/**
 * Gate app-runtime — façade startBrandDesktop / harness + anti-jumeau TF3.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startBrandKernelHarness } from "../packages/app-runtime/dist/index.js";
import { scaffoldNewApp, parseProductPrd } from "../packages/factory/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRD = path.join(ROOT, "docs/experiences/tempoflow3/PRD-PRODUIT.md");
const TF3 = path.join(ROOT, "apps/tempoflow3");
const SMOKE_ENV = {
  ...process.env,
  CREEZIO_ROOT: ROOT,
  NODE_PATH: path.join(ROOT, "node_modules"),
  PATH: [
    path.join(ROOT, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

test("AR1 package app-runtime exporté", () => {
  const idx = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/dist/index.js"),
    "utf8",
  );
  assert.match(idx, /startBrandDesktop/);
  assert.match(idx, /startBrandKernelHarness/);
});

test("AR2 TempoFlow3 main mince (façade, pas jumeau)", () => {
  const main = fs.readFileSync(
    path.join(TF3, "src/electron/main.ts"),
    "utf8",
  );
  assert.match(main, /startBrandDesktop/);
  assert.match(main, /@creezio\/app-runtime/);
  assert.doesNotMatch(main, /listenBrandKernelHttp/);
  assert.doesNotMatch(main, /prepareDesktopBoot/);
  assert.doesNotMatch(main, /maybeBootBrandMeili/);
  assert.ok(main.split("\n").length < 40, "main trop long (jumeau?)");

  const harness = fs.readFileSync(
    path.join(TF3, "scripts/brand-kernel-harness.mjs"),
    "utf8",
  );
  assert.match(harness, /startBrandKernelHarness/);
});

test("AR3 harness façade boote kernel TF3", async () => {
  const viaNpm = spawnSync("npm", ["run", "build:electron"], {
    encoding: "utf8",
    cwd: TF3,
    env: SMOKE_ENV,
    shell: true,
  });
  assert.equal(viaNpm.status, 0, viaNpm.stderr + "\n" + viaNpm.stdout);

  const bootMod = await import(
    pathToFileURL(path.join(TF3, "build/electron/brand-runtime.js")).href
  );
  const feedMod = await import(
    pathToFileURL(path.join(TF3, "build/electron/meili-feed.js")).href
  );
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-harness-"));
  const handle = await startBrandKernelHarness({
    brandId: "tempoflow3",
    appRoot: TF3,
    dataDir,
    bootKernel: (opts) => bootMod.bootBrandKernel(opts),
    meiliFeed: feedMod.brandMeiliFeed,
    skipIndex: true,
  });
  assert.ok(handle.baseUrl.startsWith("http://"));
  const res = await fetch(`${handle.baseUrl}/api/v1/core/architecture`);
  assert.equal(res.status, 200);
  await handle.close();
});

test("AR4 factory génère main startBrandDesktop", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-ar-facade-"));
  const model = parseProductPrd(fs.readFileSync(PRD, "utf8"));
  scaffoldNewApp({
    brandId: model.brandId,
    productName: model.brandName,
    domain: model.domain,
    outDir,
    sandbox: true,
    force: true,
    productModel: model,
  });
  const main = fs.readFileSync(path.join(outDir, "src/electron/main.ts"), "utf8");
  assert.match(main, /startBrandDesktop/);
  assert.doesNotMatch(main, /listenBrandKernelHttp/);
  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, "package.json"), "utf8"),
  );
  assert.ok(pkg.dependencies["@creezio/app-runtime"]);
  const harness = fs.readFileSync(
    path.join(outDir, "scripts/brand-kernel-harness.mjs"),
    "utf8",
  );
  assert.match(harness, /startBrandKernelHarness/);
});

test("AR5 onboarding setupWizardConfigFromSpec", async () => {
  const mod = await import(
    pathToFileURL(path.join(ROOT, "packages/onboarding/dist/index.js")).href
  );
  const cfg = mod.setupWizardConfigFromSpec({
    enabled: true,
    slugPlaceholder: "mon-resto",
    requireOpenaiKey: false,
    stepLabels: ["A", "B", "C", "D"],
  });
  assert.equal(cfg.slugPlaceholder, "mon-resto");
  assert.deepEqual(cfg.stepLabels, ["A", "B", "C", "D"]);
  assert.equal(mod.setupWizardConfigFromSpec({ enabled: false }), null);
});
