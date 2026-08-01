#!/usr/bin/env node
/**
 * Desktop smoke profile (P2) — vérifie wiring feature-off sans GUI Electron.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
assert.match(hostStack, /pluginsFeatureOff:\s*true/);
assert.match(hostStack, /createMemoryLocalConfigStore/);

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /installBrandDesktopRuntime/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);

const boot = fs.readFileSync(path.join(root, "src/lib/creezio-boot.ts"), "utf8");
assert.match(boot, /prepareDesktopBoot/);

console.log("OK test:desktop-smoke-profile (feature-off + session kit, no Electron GUI)");
