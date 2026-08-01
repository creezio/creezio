#!/usr/bin/env node
/**
 * Prompt 13 — audit allowlist marque (pas de launchers OS recopiés).
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
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "build" || ent.name === ".data-metier") {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(root);
for (const f of files) {
  const base = path.basename(f).toLowerCase();
  for (const bad of forbiddenNameSnippets) {
    assert.ok(!base.includes(bad), `fichier OS interdit dans marque: ${f}`);
  }
}

const required = [
  "crm/src/brand/schema.ts",
  "crm/src/brand/schema.sql",
  "scripts/metier-api.mjs",
  "scripts/test-metier-parcours.mjs",
  "src/electron/main.ts",
  "src/lib/host-stack.ts",
  "src/lib/paths.ts",
  "resources/renderer/index.html",
  "product-model.json",
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `manquant: ${rel}`);
}

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /installBrandDesktopRuntime|prepareDesktopBoot/);

const nav = fs.readFileSync(path.join(root, "src/electron/vertical-slot.ts"), "utf8");
for (const id of [
  "fournisseurs",
  "panier",
  "commandes",
  "optimiser",
  "stack",
  "releves",
  "scan",
  "marketplaces",
]) {
  assert.match(nav, new RegExp(id));
}

console.log("OK test:allowlist TempoFlow3 (marque légère, pas de launchers OS)");
