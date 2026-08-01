#!/usr/bin/env node
/**
 * Smoke first-run auth portable — vérifie wiring onboarding / store local.
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
  "product-model.json",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.ok(fs.existsSync(p), `manquant: ${rel}`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /installBrandDesktopRuntime/);
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
assert.doesNotMatch(main, /createFileLocalConfigStore|local-config-store/);

const forbidden = [
  "src/electron/local-config-store.ts",
  "src/electron/ipc-bridge.ts",
];
for (const rel of forbidden) {
  assert.ok(
    !fs.existsSync(path.join(root, rel)),
    `OS custom interdit dans marque: ${rel}`,
  );
}

const model = JSON.parse(
  fs.readFileSync(path.join(root, "product-model.json"), "utf8"),
);
assert.equal(model.brandId, "tempoflow3");
assert.ok(model.platformNeeds?.auth !== false);

const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
assert.match(hostStack, /createMemoryLocalConfigStore/);
assert.match(hostStack, /isSetupComplete/);

console.log("OK test:first-run-auth (wiring portable tempoflow3)");
