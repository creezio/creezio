#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forbiddenNameSnippets = [
  "hermes-launcher","n8n-launcher","meili-launcher","fleet-agent",
  "plugin-control-api","crash-reporter","local-config-store","ipc-bridge","metier-api",
];
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "build" || ent.name === ".data-metier") continue;
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
  "src/electron/main.ts","src/electron/brand-migrations.ts","src/electron/brand-module-api.ts",
  "src/electron/brand-bonus-api.ts","src/electron/meili-feed.ts","scripts/brand-kernel-harness.mjs",
  "crm/src/brand/schema.sql","crm/src/brand/schema-bonus.sql","product-model.json","brand-spec/brand.yaml",
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `manquant: ${rel}`);
}
assert.ok(!fs.existsSync(path.join(root, "src/electron/brand-runtime.ts")));
assert.ok(!fs.existsSync(path.join(root, "src/lib/host-stack.ts")));
assert.ok(!fs.existsSync(path.join(root, "src/electron/product-hub-stub.ts")));
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.doesNotMatch(main, /spawnBrandMetierApi|listenBrandKernelHttp|bootBrandKernel/);
const modApi = fs.readFileSync(path.join(root, "src/electron/brand-module-api.ts"), "utf8");
assert.match(modApi, /registerModuleApi/);
assert.match(modApi, /registerBrandBonusApi/);
console.log("OK test:allowlist TempoFlow (métier + façade, pas glue OS)");
