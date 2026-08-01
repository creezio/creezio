#!/usr/bin/env node
/**
 * Smoke first-run + wiring natif (kernel, pas sidecar JSON).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "src/electron/main.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "src/electron/meili-feed.ts",
  "src/electron/vertical-slot.ts",
  "scripts/brand-kernel-harness.mjs",
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), `manquant: ${rel}`);
}

const forbidden = [
  "src/lib/host-stack.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/product-hub-stub.ts",
  "scripts/metier-api.mjs",
];
for (const rel of forbidden) {
  assert.ok(!fs.existsSync(path.join(root, rel)), `interdit: ${rel}`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.match(main, /@creezio\/app-runtime/);
assert.doesNotMatch(main, /spawnBrandMetierApi|metier-api\.mjs|bootBrandKernel|brand-runtime|listenBrandKernelHttp|prepareDesktopBoot/);

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, "tempoflow3");

console.log("OK test:first-run-auth (wiring natif tempoflow3)");
