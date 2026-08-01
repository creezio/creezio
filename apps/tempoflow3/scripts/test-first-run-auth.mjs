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
  "src/lib/host-stack.ts",
  "src/lib/paths.ts",
  "src/lib/connection-profile.ts",
  "src/lib/creezio-boot.ts",
  "src/electron/main.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "scripts/brand-kernel-harness.mjs",
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), `manquant: ${rel}`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /bootBrandKernel/);
assert.doesNotMatch(main, /spawnBrandMetierApi|metier-api\.mjs|createFileLocalConfigStore/);

assert.ok(!fs.existsSync(path.join(root, "scripts/metier-api.mjs")), "sidecar JSON interdit");

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, "tempoflow3");

const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);

console.log("OK test:first-run-auth (wiring natif tempoflow3)");
