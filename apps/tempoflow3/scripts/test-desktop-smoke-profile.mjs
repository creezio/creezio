#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.match(main, /@creezio\/app-runtime/);
assert.doesNotMatch(main, /spawnBrandMetierApi|listenBrandKernelHttp|prepareDesktopBoot|bootBrandKernel|brand-runtime/);
assert.ok(!fs.existsSync(path.join(root, "src/lib/host-stack.ts")), "glue OS host-stack interdit");
assert.ok(!fs.existsSync(path.join(root, "src/electron/brand-runtime.ts")), "brand-runtime interdit");
assert.ok(!fs.existsSync(path.join(root, "src/electron/product-hub-stub.ts")), "product-hub-stub interdit");
const harness = fs.readFileSync(
  path.join(root, "scripts/brand-kernel-harness.mjs"),
  "utf8",
);
assert.match(harness, /startBrandKernelHarness/);
assert.match(harness, /brandMigrations|registerModuleApi/);
const renderer = fs.readFileSync(
  path.join(root, "resources/renderer/index.html"),
  "utf8",
);
assert.match(renderer, /modules\/search|global-search/);
assert.match(renderer, /metierBaseUrl|creezioDesktop/);
console.log("OK test:desktop-smoke-profile (tempoflow3 native)");
