#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /bootBrandKernel/);
assert.match(main, /@creezio\/app-runtime/);
assert.doesNotMatch(main, /spawnBrandMetierApi|listenBrandKernelHttp|prepareDesktopBoot/);
const runtime = fs.readFileSync(path.join(root, "src/electron/brand-runtime.ts"), "utf8");
assert.match(runtime, /createSqliteRuntime/);
assert.match(runtime, /createApiKernel/);
const harness = fs.readFileSync(
  path.join(root, "scripts/brand-kernel-harness.mjs"),
  "utf8",
);
assert.match(harness, /startBrandKernelHarness/);
assert.match(harness, /@creezio\/app-runtime/);
assert.ok(
  fs.existsSync(path.join(root, "scripts/brand-kernel-harness.mjs")),
);
console.log("OK test:desktop-smoke-profile (startBrandDesktop)");
