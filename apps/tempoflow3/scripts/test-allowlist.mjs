#!/usr/bin/env node
/**
 * Allowlist — pas de launchers OS / pas de sidecar JSON métier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const forbiddenNameSnippets = [
  "hermes-launcher",
  "n8n-launcher",
  "meili-launcher",
  "fleet-agent",
  "plugin-control-api",
  "crash-reporter",
  "local-config-store",
  "ipc-bridge",
  "metier-api",
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "build" ||
      ent.name === ".data-metier"
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

for (const f of walk(root)) {
  const base = path.basename(f).toLowerCase();
  for (const bad of forbiddenNameSnippets) {
    assert.ok(!base.includes(bad), `fichier OS/sidecar interdit: ${f}`);
  }
}

const required = [
  "src/electron/main.ts",
  "src/electron/brand-runtime.ts",
  "src/electron/brand-migrations.ts",
  "src/electron/brand-module-api.ts",
  "scripts/brand-kernel-harness.mjs",
  "crm/src/brand/schema.sql",
  "product-model.json",
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `manquant: ${rel}`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /bootBrandKernel/);
assert.match(main, /createDesktopSessionStore/);
assert.doesNotMatch(main, /spawnBrandMetierApi/);

const modApi = fs.readFileSync(
  path.join(root, "src/electron/brand-module-api.ts"),
  "utf8",
);
assert.match(modApi, /registerModuleApi/);
assert.doesNotMatch(modApi, /delegate_to_metier_api/);

console.log("OK test:allowlist TempoFlow (OS natif, pas sidecar JSON)");
