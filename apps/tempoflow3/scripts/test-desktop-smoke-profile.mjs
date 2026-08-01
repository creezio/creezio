#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
assert.match(hostStack, /pluginsFeatureOff:\s*true/);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /installBrandDesktopRuntime/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
console.log("OK test:desktop-smoke-profile (tempoflow3)");
