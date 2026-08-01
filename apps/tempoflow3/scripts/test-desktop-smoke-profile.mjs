#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /bootBrandKernel/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /listenBrandKernelHttp/);
assert.match(main, /maybeBootBrandMeili/);
assert.match(main, /metierPort/);
assert.doesNotMatch(main, /spawnBrandMetierApi/);
const runtime = fs.readFileSync(path.join(root, "src/electron/brand-runtime.ts"), "utf8");
assert.match(runtime, /createSqliteRuntime/);
assert.match(runtime, /createApiKernel/);
const harness = fs.readFileSync(
  path.join(root, "scripts/brand-kernel-harness.mjs"),
  "utf8",
);
assert.match(harness, /listenBrandKernelHttp/);
assert.match(harness, /maybeBootBrandMeili/);
const renderer = fs.readFileSync(
  path.join(root, "resources/renderer/index.html"),
  "utf8",
);
assert.match(renderer, /modules\/search|global-search/);
assert.match(renderer, /metierBaseUrl|creezioDesktop/);
console.log("OK test:desktop-smoke-profile (tempoflow3 native)");
